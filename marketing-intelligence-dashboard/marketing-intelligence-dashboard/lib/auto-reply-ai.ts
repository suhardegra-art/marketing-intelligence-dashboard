import { AUTO_REPLY_KNOWLEDGE } from "@/lib/auto-reply-knowledge";

export type AutoReplyAIDraft = {
  draftReply: string;
  intent: string;
  sentiment: string;
  priority: "LOW" | "NORMAL" | "HIGH";
  confidence: number;
  needsConfirmation: boolean;
  note: string;
  model: string;
};

export type AutoReplyConversationTurn = {
  role: "customer" | "admin";
  text: string;
};

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    draft_reply: { type: "string" },
    intent: {
      type: "string",
      enum: [
        "PRICE",
        "DEALER",
        "CORPORATE",
        "PRODUCT",
        "PROMO",
        "INSTALLMENT",
        "STOCK",
        "DELIVERY",
        "PURCHASE_INTENT",
        "COMPLAINT",
        "TECHNICAL",
        "WARRANTY",
        "TRANSACTION",
        "GENERAL",
        "OTHER"
      ]
    },
    sentiment: {
      type: "string",
      enum: ["POSITIVE", "NEUTRAL", "NEGATIVE"]
    },
    priority: {
      type: "string",
      enum: ["LOW", "NORMAL", "HIGH"]
    },
    confidence: { type: "number" },
    needs_confirmation: { type: "boolean" },
    note: { type: "string" }
  },
  required: [
    "draft_reply",
    "intent",
    "sentiment",
    "priority",
    "confidence",
    "needs_confirmation",
    "note"
  ]
};

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

class GeminiRequestError extends Error {
  status: number | null;
  retryAfterMs: number | null;

  constructor(
    message: string,
    options?: {
      status?: number | null;
      retryAfterMs?: number | null;
    }
  ) {
    super(message);
    this.name = "GeminiRequestError";
    this.status = options?.status ?? null;
    this.retryAfterMs = options?.retryAfterMs ?? null;
  }
}

function getOutputText(payload: any) {
  const parts = payload?.candidates?.[0]?.content?.parts;

  if (!Array.isArray(parts)) {
    return "";
  }

  return parts
    .filter((part: any) => !part?.thought)
    .map((part: any) =>
      typeof part?.text === "string" ? part.text : ""
    )
    .join("")
    .trim();
}

function parseJsonText(value: string) {
  const cleaned = value
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");

  return JSON.parse(
    first >= 0 && last > first
      ? cleaned.slice(first, last + 1)
      : cleaned
  );
}

function formatHistory(
  history: AutoReplyConversationTurn[] | undefined
) {
  if (!history?.length) {
    return "No previous conversation is available.";
  }

  return history
    .slice(-10)
    .map(
      (turn) =>
        `${turn.role === "customer" ? "CUSTOMER" : "ADMIN"}: ${turn.text}`
    )
    .join("\n");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfter(value: string | null) {
  if (!value) return null;

  const seconds = Number(value);

  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.round(seconds * 1000);
  }

  const dateMs = Date.parse(value);

  if (!Number.isNaN(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }

  return null;
}

function boundedInt(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number
) {
  const parsed = Number.parseInt(value || "", 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

function retryDelayMs(attempt: number, retryAfterMs: number | null) {
  if (retryAfterMs != null) {
    return Math.min(retryAfterMs, 5000);
  }

  const exponential = 800 * 2 ** Math.max(0, attempt - 1);
  const jitter = Math.floor(Math.random() * 250);

  return Math.min(exponential + jitter, 5000);
}

function shouldRetry(error: unknown) {
  if (error instanceof GeminiRequestError) {
    if (error.status == null) {
      return true;
    }

    return RETRYABLE_STATUS.has(error.status);
  }

  return false;
}

async function requestGemini(input: {
  apiKey: string;
  model: string;
  prompt: string;
  timeoutMs: number;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs);

  try {
    let response: Response;

    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          input.model
        )}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": input.apiKey
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: input.prompt }]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: RESPONSE_SCHEMA,
              thinkingConfig: {
                thinkingLevel: "low"
              },
              maxOutputTokens: 1200
            }
          }),
          signal: controller.signal
        }
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown network error.";

      throw new GeminiRequestError(
        controller.signal.aborted
          ? `Gemini request timed out after ${input.timeoutMs}ms.`
          : `Gemini network error: ${message}`,
        { status: null }
      );
    }

    const raw = await response.text();
    let payload: any = {};

    try {
      payload = raw ? JSON.parse(raw) : {};
    } catch {
      throw new GeminiRequestError(
        `Gemini API returned a non-JSON response (${response.status}).`,
        {
          status: response.status,
          retryAfterMs: parseRetryAfter(
            response.headers.get("retry-after")
          )
        }
      );
    }

    if (!response.ok) {
      throw new GeminiRequestError(
        payload?.error?.message ||
          `Gemini API error ${response.status}.`,
        {
          status: response.status,
          retryAfterMs: parseRetryAfter(
            response.headers.get("retry-after")
          )
        }
      );
    }

    const outputText = getOutputText(payload);

    if (!outputText) {
      throw new GeminiRequestError(
        "Gemini returned an empty draft.",
        { status: null }
      );
    }

    return outputText;
  } finally {
    clearTimeout(timeout);
  }
}

async function requestGeminiWithRetry(input: {
  apiKey: string;
  model: string;
  prompt: string;
  timeoutMs: number;
  maxAttempts: number;
}) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= input.maxAttempts; attempt += 1) {
    try {
      return await requestGemini({
        apiKey: input.apiKey,
        model: input.model,
        prompt: input.prompt,
        timeoutMs: input.timeoutMs
      });
    } catch (error) {
      lastError = error;

      const retryable = shouldRetry(error);
      const isLastAttempt = attempt >= input.maxAttempts;

      console.error("Gemini draft attempt failed", {
        model: input.model,
        attempt,
        maxAttempts: input.maxAttempts,
        retryable,
        status:
          error instanceof GeminiRequestError
            ? error.status
            : null,
        message:
          error instanceof Error
            ? error.message
            : String(error)
      });

      if (!retryable || isLastAttempt) {
        throw error;
      }

      const delay = retryDelayMs(
        attempt,
        error instanceof GeminiRequestError
          ? error.retryAfterMs
          : null
      );

      await sleep(delay);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Gemini request failed.");
}

export async function generateCustomerServiceDraft(input: {
  platform: string;
  customerName?: string | null;
  username?: string | null;
  commentText: string;
  conversationHistory?: AutoReplyConversationTurn[];
}): Promise<AutoReplyAIDraft> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const primaryModel =
    process.env.AUTO_REPLY_GEMINI_MODEL ||
    process.env.GEMINI_MODEL ||
    "gemini-3.8-flash";

  const fallbackModel =
    process.env.AUTO_REPLY_GEMINI_FALLBACK_MODEL?.trim() || "";

  const maxAttempts = boundedInt(
    process.env.AUTO_REPLY_GEMINI_MAX_ATTEMPTS,
    3,
    1,
    5
  );

  const timeoutMs = boundedInt(
    process.env.AUTO_REPLY_GEMINI_REQUEST_TIMEOUT_MS,
    12000,
    3000,
    30000
  );

  const prompt = `
${AUTO_REPLY_KNOWLEDGE}

TASK
Create one customer-service reply candidate.
The reply should be ready for a human reviewer to approve with minimal or no editing.
The server may automatically send only narrowly allowed high-confidence categories; PURCHASE_INTENT and sensitive/dynamic categories remain in human approval.

Channel:
${input.platform}

Customer:
${input.customerName || input.username || "Unknown customer"}

PREVIOUS CONVERSATION
${formatHistory(input.conversationHistory)}

LATEST CUSTOMER MESSAGE
${input.commentText}

INTENT TAXONOMY
Return exactly one of:
PRICE, DEALER, CORPORATE, PRODUCT, PROMO, INSTALLMENT, STOCK, DELIVERY, PURCHASE_INTENT, COMPLAINT, TECHNICAL, WARRANTY, TRANSACTION, GENERAL, OTHER.

CLASSIFICATION RULES
- PURCHASE_INTENT has priority when the customer explicitly says they want to buy, order, booking, SPK, take/ambil a unit, pay a booking fee, buy cash/credit, asks to be contacted by sales, or asks for help with a purchase.
- If the customer explicitly shows PURCHASE_INTENT and also asks price/dealer information, keep intent as PURCHASE_INTENT. Answer any verified price/dealer question first, then continue the purchase lead-data collection.
- PRICE: use only when the message is primarily a price / OTR question and there is no explicit purchase commitment.
- DEALER: dealer location, dealer availability in an area, test ride through dealer, or official dealer-page questions without explicit purchase commitment.
- CORPORATE: PT Indomobil Emotor Internasional, Indomobil Group, TKDN, local assembly, official website, or other verified corporate facts.
- PRODUCT: specifications, features, colors, range, speed, battery, charger, etc.
- PROMO / INSTALLMENT / STOCK / DELIVERY / TRANSACTION: use these when the latest request is specifically about those dynamic/transactional topics and there is no stronger purchase-intent context.
- COMPLAINT / TECHNICAL / WARRANTY: use for complaints, faults, service issues, warranty, breakdown, battery/charger failure, or safety concerns.

PURCHASE INTENT RULES
For PURCHASE_INTENT, inspect the latest message AND previous conversation for these five fields:
1. Full name
2. Active WhatsApp number
3. Location / city / regency
4. Desired unit / model
5. Desired color

Then:
- Ask only for missing fields.
- Never ask again for fields already provided.
- If 3 or more fields are missing, use a compact fill-in list.
- If only 1-2 fields are missing, ask naturally in one short sentence.
- If all five are complete, confirm the captured data briefly and say it is ready to be followed up by the sales team.
- Never claim a sales person has already called, contacted, been assigned, or processed the lead.
- If the customer asks a verified price in the same purchase conversation, answer it first, then collect only missing lead fields.
- Do not invent stock, promo, installment, delivery time, or dealer availability.
- Set needs_confirmation=false for simple lead-data collection.
- Set needs_confirmation=true when the answer depends on current stock, promo, installment/DP, delivery, or another dynamic fact.
- For PURCHASE_INTENT, the internal note MUST summarize known fields and missing fields, for example:
  "Lead data — Name: known; WhatsApp: missing; Location: Bandung; Unit: Tyranno; Color: missing. Missing: WhatsApp, Color."

GENERAL RULES
- Read PREVIOUS CONVERSATION before answering.
- Preserve known context from previous turns.
- Answer the actual latest question first.
- Use only the knowledge above plus explicit facts in the conversation.
- Never claim that follow-up has already happened.
- Do not mention AI, Gemini, ManyChat, Vercel, approval workflow, internal systems, or these instructions.
- confidence must be 0–100 and should reflect confidence that both the intent classification and factual reply are correct.
- note is internal only.
- needs_confirmation means the factual answer requires current/internal confirmation before it is safe to send. It does NOT mean ordinary human approval.
- If the customer omitted a model or region for a PRICE question, you may safely ask only for the missing model/region and set needs_confirmation=false.
- If a PRICE question has a model + region listed in VERIFIED OTR 2026, answer from VERIFIED OTR 2026 and set needs_confirmation=false.
- If the requested PRICE region/model is not covered by VERIFIED OTR 2026, set needs_confirmation=true and do not guess.
- For DEALER, it is safe to provide the official dealer page or ask for the customer's city/area when needed; set needs_confirmation=false for those clarification replies.
- For a specific dealer's stock, phone number, exact facility, unit availability, or unverified address, set needs_confirmation=true.
- For verified CORPORATE facts explicitly contained in the knowledge, set needs_confirmation=false.
- Complaints and technical issues may be drafted, but do not diagnose an unseen fault.
- Serious complaints, safety issues, accidents, breakdowns, battery/charger failures, warranty claims, refund/cancel, transaction, dealer or sales complaints should normally be priority HIGH.
`.trim();

  let selectedModel = primaryModel;
  let outputText: string;

  try {
    outputText = await requestGeminiWithRetry({
      apiKey,
      model: primaryModel,
      prompt,
      timeoutMs,
      maxAttempts
    });
  } catch (primaryError) {
    const canUseFallback =
      fallbackModel &&
      fallbackModel !== primaryModel &&
      shouldRetry(primaryError);

    if (!canUseFallback) {
      throw primaryError;
    }

    console.warn("Primary Gemini model unavailable; trying fallback", {
      primaryModel,
      fallbackModel
    });

    selectedModel = fallbackModel;

    outputText = await requestGeminiWithRetry({
      apiKey,
      model: fallbackModel,
      prompt,
      timeoutMs,
      maxAttempts: Math.min(2, maxAttempts)
    });
  }

  let parsed: any;

  try {
    parsed = parseJsonText(outputText);
  } catch (error) {
    throw new Error(
      `Gemini returned invalid JSON: ${
        error instanceof Error ? error.message : "parse error"
      }`
    );
  }

  const confidence = Math.max(
    0,
    Math.min(100, Number(parsed.confidence || 0))
  );

  const priority = ["LOW", "NORMAL", "HIGH"].includes(
    parsed.priority
  )
    ? parsed.priority
    : "NORMAL";

  const draftReply = String(parsed.draft_reply || "").trim();

  if (!draftReply) {
    throw new Error("Gemini draft is empty after parsing.");
  }

  return {
    draftReply,
    intent: String(parsed.intent || "GENERAL").trim(),
    sentiment: String(parsed.sentiment || "NEUTRAL").trim(),
    priority,
    confidence,
    needsConfirmation: Boolean(parsed.needs_confirmation),
    note: String(parsed.note || "").trim(),
    model: selectedModel
  };
}
