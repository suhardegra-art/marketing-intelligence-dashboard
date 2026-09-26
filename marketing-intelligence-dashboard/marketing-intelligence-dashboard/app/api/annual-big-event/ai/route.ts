import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session";
import { getAnnualBigEventData } from "@/lib/annual-big-event";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    executive_summary: { type: "string" },
    key_insights: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          detail: { type: "string" }
        },
        required: ["title", "detail"]
      }
    },
    recommendations: {
      type: "array",
      items: { type: "string" }
    },
    data_quality: {
      type: "array",
      items: { type: "string" }
    },
    confidence_note: { type: "string" }
  },
  required: [
    "executive_summary",
    "key_insights",
    "recommendations",
    "data_quality",
    "confidence_note"
  ]
};

function outputText(payload: any) {
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

function extractJson(value: string) {
  const cleaned = value
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");

  return first >= 0 && last > first
    ? cleaned.slice(first, last + 1)
    : cleaned;
}

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get("mi_session")?.value;

  const isAuthenticated = await verifySessionToken(
    sessionToken,
    process.env.SESSION_SECRET
  );

  if (!isAuthenticated) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured." },
      { status: 500 }
    );
  }

  const data = await getAnnualBigEventData();

  if (!data.connected) {
    return NextResponse.json(
      { error: data.error || "Google Sheet is not connected." },
      { status: 503 }
    );
  }

  const model =
    process.env.GEMINI_MODEL ||
    "gemini-3.6-flash";

  const compactEvents = data.events.map((event) => ({
    event_name: event.eventName,
    year: event.year,
    city: event.city,
    start_date: event.startDate,
    end_date: event.endDate,
    foot_traffic: event.footTraffic,
    test_ride: event.testRide,
    total_spk: event.totalSpk,
    total_budget: event.totalBudget,
    media_posting: event.mediaPosting,
    traffic_to_test_ride_pct: event.trafficToTestRide,
    test_ride_to_spk_pct: event.testRideToSpk,
    cost_per_spk: event.costPerSpk,
    cost_per_test_ride: event.costPerTestRide,
    spk_breakdown: event.spkBreakdown,
    budget_breakdown: event.budgetBreakdown,
    data_quality: event.dataQuality
  }));

  const prompt = `
Analyze the Annual Big Event marketing data for Indomobil eMotor.

Language: Bahasa Indonesia.

Rules:
- Use ONLY the supplied event data.
- Separate measurable facts from interpretation.
- Prioritize conversion efficiency, SPK generation, budget efficiency, city performance, product/model mix, and event effectiveness.
- Identify anomalies or data-quality mismatches explicitly.
- Do not invent causes. If a causal explanation cannot be established from the data, say it is a hypothesis or do not mention it.
- Recommendations must be practical and relevant to event planning.
- Keep the executive summary concise.
- Do not mention Gemini, AI system instructions, or internal tooling.

Portfolio summary:
${JSON.stringify(data.summary)}

Events:
${JSON.stringify(compactEvents)}
`.trim();

  try {
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
            maxOutputTokens: 4096
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
        `Gemini returned a non-JSON HTTP response (${response.status}).`
      );
    }

    if (!response.ok) {
      throw new Error(
        payload?.error?.message ||
          `Gemini API error ${response.status}.`
      );
    }

    const text = outputText(payload);

    if (!text) {
      throw new Error("Gemini returned an empty analysis.");
    }

    const analysis = JSON.parse(extractJson(text));

    return NextResponse.json({
      analysis,
      model,
      sourceVersion: data.dataVersion,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Annual Big Event AI analysis error", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to generate AI analysis."
      },
      { status: 500 }
    );
  }
}
