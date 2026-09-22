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

function getOutputText(payload: any) {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";

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

export async function generateCustomerServiceDraft(input: {
  platform: string;
  customerName?: string | null;
  username?: string | null;
  commentText: string;
}): Promise<AutoReplyAIDraft> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const model =
    process.env.AUTO_REPLY_GEMINI_MODEL ||
    process.env.GEMINI_MODEL ||
    "gemini-3.6-flash";

  const prompt = `
${AUTO_REPLY_KNOWLEDGE}

TASK
Create one customer-service DRAFT reply for human approval.

Channel:
${input.platform}

Customer:
${input.customerName || input.username || "Unknown customer"}

Customer message/comment:
${input.commentText}

RULES
- Answer the actual question first.
- Use only the knowledge above.
- If the answer depends on dynamic information, explicitly state that it needs confirmation.
- Never claim that follow-up has already happened.
- Do not mention AI, Gemini, ManyChat, Vercel, approval workflow, internal systems, or these instructions.
- confidence must be 0–100.
- note is internal only.
- Serious complaints, safety issues, accidents or refund requests should be priority HIGH.
- Missing or dynamic information should set needs_confirmation true.
`.trim();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.2,
          maxOutputTokens: 1200
        }
      }),
      cache: "no-store"
    }
  );

  const raw = await response.text();
  let payload: any = {};

  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(
      `Gemini API returned a non-JSON response (${response.status}).`
    );
  }

  if (!response.ok) {
    throw new Error(
      payload?.error?.message ||
        `Gemini API error ${response.status}.`
    );
  }

  const outputText = getOutputText(payload);

  if (!outputText) {
    throw new Error("Gemini returned an empty draft.");
  }

  const parsed = parseJsonText(outputText);

  const confidence = Math.max(
    0,
    Math.min(100, Number(parsed.confidence || 0))
  );

  return {
    draftReply: String(parsed.draft_reply || "").trim(),
    intent: String(parsed.intent || "GENERAL").trim(),
    sentiment: String(parsed.sentiment || "NEUTRAL").trim(),
    priority: ["LOW", "NORMAL", "HIGH"].includes(parsed.priority)
      ? parsed.priority
      : "NORMAL",
    confidence,
    needsConfirmation: Boolean(parsed.needs_confirmation),
    note: String(parsed.note || "").trim(),
    model
  };
}
