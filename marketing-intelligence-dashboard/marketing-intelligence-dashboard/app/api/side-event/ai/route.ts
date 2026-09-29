import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session";
import { getSideEventData } from "@/lib/side-event";
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

  const data = await getSideEventData();

  if (!data.connected) {
    return NextResponse.json(
      { error: data.error || "Google Sheet is not connected." },
      { status: 503 }
    );
  }

  try {
    const payload = await generateEventAiAnalysis(
      data,
      "Side Event"
    );

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Side Event AI analysis error", error);

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
