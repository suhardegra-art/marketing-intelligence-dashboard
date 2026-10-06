import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session";
import { getReportMediaData } from "@/lib/report-media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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

  const data = await getReportMediaData();

  return NextResponse.json(data, {
    status: data.connected ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, max-age=0"
    }
  });
}
