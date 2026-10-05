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
    intent: { type: "string" },
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

  // 800ms, 1600ms, 3200ms ... with a small jitter.
  const exponential = 800 * 2 ** Math.max(0, attempt - 1);
  const jitter = Math.floor(Math.random() * 250);

  return Math.min(exponential + jitter, 5000);
}

function shouldRetry(error: unknown) {
  if (error instanceof GeminiRequestError) {
    if (error.status == null) {
      // Network error / timeout.
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
Create one customer-service DRAFT reply for human approval.

Channel:
${input.platform}

Customer:
${input.customerName || input.username || "Unknown customer"}

PREVIOUS CONVERSATION
${formatHistory(input.conversationHistory)}

LATEST CUSTOMER MESSAGE
${input.commentText}

RULES
- Read PREVIOUS CONVERSATION before answering.
- Preserve known context from previous turns. Do not ask again for information the customer already gave.
- Answer the actual latest question first.
- Use only the knowledge above plus explicit facts in the conversation.
- If the answer depends on dynamic information, explicitly state that it needs confirmation.
- Never claim that follow-up has already happened.
- Do not mention AI, Gemini, ManyChat, Vercel, approval workflow, internal systems, or these instructions.
- confidence must be 0–100.
- note is internal only.
- Complaints and technical issues are allowed as drafts, but do not diagnose an unseen fault.
- Serious complaints, safety issues, accidents, breakdowns, battery/charger failures, warranty claims, refund/cancel, transaction, dealer or sales complaints should normally be priority HIGH.
- Missing or dynamic information should set needs_confirmation true.
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
