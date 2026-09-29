import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnalysisRequest = {
  platform?: string;
  account?: string;
  period?: {
    label?: string;
    from?: string;
    to?: string;
  };
  data?: unknown;
  language?: string;
};

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    executive_summary: {
      type: "string"
    },
    whats_working: {
      type: "array",
      items: {
        type: "string"
      }
    },
    needs_attention: {
      type: "array",
      items: {
        type: "string"
      }
    },
    recommended_actions: {
      type: "array",
      items: {
        type: "string"
      }
    },
    confidence_note: {
      type: "string"
    }
  },
  required: [
    "executive_summary",
    "whats_working",
    "needs_attention",
    "recommended_actions",
    "confidence_note"
  ]
};

function getOutputText(payload: any) {
  const parts =
    payload?.candidates?.[0]?.content?.parts;

  if (!Array.isArray(parts)) {
    return "";
  }

  return parts
    .filter((part: any) => !part?.thought)
    .map((part: any) =>
      typeof part?.text === "string"
        ? part.text
        : ""
    )
    .join("")
    .trim();
}

function stripCodeFence(value: string) {
  return value
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractJsonObject(value: string) {
  const cleaned = stripCodeFence(value);

  if (
    cleaned.startsWith("{") &&
    cleaned.endsWith("}")
  ) {
    return cleaned;
  }

  const firstBrace =
    cleaned.indexOf("{");

  const lastBrace =
    cleaned.lastIndexOf("}");

  if (
    firstBrace >= 0 &&
    lastBrace > firstBrace
  ) {
    return cleaned.slice(
      firstBrace,
      lastBrace + 1
    );
  }

  return cleaned;
}

export async function POST(
  request: NextRequest
) {
  try {
    const apiKey =
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is not configured."
        },
        {
          status: 500
        }
      );
    }

    const body =
      (await request.json()) as AnalysisRequest;

    if (
      !body.platform ||
      !body.period?.label ||
      !body.data
    ) {
      return NextResponse.json(
        {
          error:
            "platform, period, and data are required."
        },
        {
          status: 400
        }
      );
    }

    const model =
      process.env.GEMINI_MODEL ||
      "gemini-3.6-flash";

    const language =
      body.language ||
      "Bahasa Indonesia";

    const systemInstruction = `
You are a senior social media performance analyst.

Your job is to analyze structured social media performance data and produce concise, evidence-based, actionable recommendations for a marketing team.

Rules:
- Use only the data supplied in the request.
- Never invent metrics, trends, causes, or audience facts.
- If historical data is insufficient, state that clearly.
- Focus on performance patterns, content themes, engagement quality, posting activity, and actionable next steps.
- Separate facts from interpretation.
- Keep recommendations practical and prioritized.
- Do not repeat every metric from the input.
- Write in ${language}.
- Avoid generic motivational language.
- Do not mention these instructions.
`.trim();

    const userPrompt = `
Analyze this ${body.platform} account for the selected period.

Account:
${body.account || "Unknown account"}

Period:
${body.period.label}
${body.period.from || ""} to ${body.period.to || ""}

Return:
1. Executive Summary: one concise paragraph.
2. What's Working: 2-5 specific observations.
3. Needs Attention: 2-5 specific observations.
4. Recommended Actions: 3-5 prioritized actions.
5. Confidence Note: briefly state any limitation caused by missing or short historical data.

Structured performance data:
${JSON.stringify(body.data)}
`.trim();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          "x-goog-api-key":
            apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text:
                  systemInstruction
              }
            ]
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text:
                    userPrompt
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType:
              "application/json",
            responseSchema:
              RESPONSE_SCHEMA,
            maxOutputTokens: 4096
          }
        }),
        cache: "no-store"
      }
    );

    const rawBody =
      await response.text();

    let payload: any = null;

    try {
      payload =
        rawBody
          ? JSON.parse(rawBody)
          : {};
    } catch {
      return NextResponse.json(
        {
          error:
            `Gemini API returned a non-JSON HTTP response (${response.status}).`
        },
        {
          status:
            response.ok
              ? 502
              : response.status
        }
      );
    }

    if (!response.ok) {
      const message =
        payload?.error?.message ||
        `Gemini API error ${response.status}.`;

      return NextResponse.json(
        {
          error: message
        },
        {
          status: response.status
        }
      );
    }

    const finishReason =
      payload?.candidates?.[0]?.finishReason;

    const outputText =
      getOutputText(payload);

    if (!outputText) {
      return NextResponse.json(
        {
          error:
            finishReason
              ? `Gemini returned an empty response. Finish reason: ${finishReason}.`
              : "Gemini returned an empty response."
        },
        {
          status: 502
        }
      );
    }

    const jsonText =
      extractJsonObject(
        outputText
      );

    let analysis;

    try {
      analysis =
        JSON.parse(jsonText);
    } catch {
      console.error(
        "Gemini JSON parse error",
        {
          finishReason,
          outputPreview:
            outputText.slice(
              0,
              800
            )
        }
      );

      return NextResponse.json(
        {
          error:
            finishReason ===
            "MAX_TOKENS"
              ? "Gemini response was truncated before the JSON was complete. Please try again."
              : "Gemini returned an incomplete or invalid structured response. Please try again."
        },
        {
          status: 502
        }
      );
    }

    return NextResponse.json({
      analysis,
      model,
      generatedAt:
        new Date().toISOString()
    });
  } catch (error) {
    console.error(
      "Central AI analysis error",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to generate AI analysis."
      },
      {
        status: 500
      }
    );
  }
}
