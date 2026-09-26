import {
  NextRequest,
  NextResponse
} from "next/server";

import {
  verifySessionToken
} from "@/lib/session";

import {
  getYouTubeSyncMonitoring
} from "@/lib/youtube-sync-monitoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest
) {
  const sessionToken =
    request.cookies.get(
      "mi_session"
    )?.value;

  const isAuthenticated =
    await verifySessionToken(
      sessionToken,
      process.env.SESSION_SECRET
    );

  if (!isAuthenticated) {
    return NextResponse.json(
      {
        error: "Unauthorized"
      },
      {
        status: 401
      }
    );
  }

  const monitoring =
    await getYouTubeSyncMonitoring();

  return NextResponse.json({
    ...monitoring,
    schedule:
      "08:00 WIB",
    timezone:
      "Asia/Jakarta"
  });
}
