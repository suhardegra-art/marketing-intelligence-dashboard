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
  type: "OBJECT",
  properties: {
    executive_summary: {
      type: "STRING"
    },
    whats_working: {
      type: "ARRAY",
      items: {
        type: "STRING"
      }
    },
    needs_attention: {
      type: "ARRAY",
      items: {
        type: "STRING"
      }
    },
    recommended_actions: {
      type: "ARRAY",
      items: {
        type: "STRING"
      }
    },
    confidence_note: {
      type: "STRING"
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
    .map((part: any) =>
      typeof part?.text === "string"
        ? part.text
        : ""
    )
    .join("")
    .trim();
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
      "gemini-3.7-flash";

    const language =
      body.language || "Bahasa Indonesia";

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
            maxOutputTokens: 1400
          }
        }),
        cache: "no-store"
      }
    );

    const payload =
      await response.json();

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

    const outputText =
      getOutputText(payload);

    if (!outputText) {
      return NextResponse.json(
        {
          error:
            "Gemini returned an empty response."
        },
        {
          status: 502
        }
      );
    }

    let analysis;

    try {
      analysis =
        JSON.parse(outputText);
    } catch {
      return NextResponse.json(
        {
          error:
            "Gemini response could not be parsed as JSON."
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
