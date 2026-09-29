import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session";
import { getAnnualBigEventData } from "@/lib/annual-big-event-source";
import { generateEventAiAnalysis } from "@/lib/event-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const data = await getAnnualBigEventData();

  if (!data.connected) {
    return NextResponse.json(
      { error: data.error || "Google Sheet is not connected." },
      { status: 503 }
    );
  }

  try {
    const payload = await generateEventAiAnalysis(
      data,
      "Annual Big Event"
    );

    return NextResponse.json(payload);
  } catch (error) {
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
