import {
  NextRequest,
  NextResponse
} from "next/server";

import {
  verifySessionToken
} from "@/lib/session";

import {
  runYouTubeManualSync
} from "@/lib/youtube-auto-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(
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

  try {
    const result =
      await runYouTubeManualSync();

    return NextResponse.json({
      ok: true,
      syncType:
        "youtube_manual_sync",
      syncedAt:
        new Date().toISOString(),
      ...result
    });
  } catch (error) {
    console.error(
      "YouTube manual sync error",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "YouTube sync failed."
      },
      {
        status: 500
      }
    );
  }
}
