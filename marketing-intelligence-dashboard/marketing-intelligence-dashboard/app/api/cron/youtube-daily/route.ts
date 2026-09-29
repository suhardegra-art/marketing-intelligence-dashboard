import {
  NextRequest,
  NextResponse
} from "next/server";

import {
  runYouTubeDailySync
} from "@/lib/youtube-auto-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const cronSecret =
    process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      {
        error:
          "CRON_SECRET is not configured."
      },
      {
        status: 500
      }
    );
  }

  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    authorization !==
    `Bearer ${cronSecret}`
  ) {
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
      await runYouTubeDailySync();

    return NextResponse.json({
      ok: true,
      syncType:
        "youtube_daily_cron",
      scheduledTime:
        "08:00 WIB",
      syncedAt:
        new Date().toISOString(),
      ...result
    });
  } catch (error) {
    console.error(
      "YouTube daily cron sync error",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "YouTube daily sync failed."
      },
      {
        status: 500
      }
    );
  }
}
