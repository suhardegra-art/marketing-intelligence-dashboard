import { NextRequest, NextResponse } from "next/server";
import { runTikTokDailySync } from "@/lib/tiktok-sync";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 500 }
    );
  }

  const authorization = request.headers.get("authorization");

  if (authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runTikTokDailySync();

    return NextResponse.json({
      ok: true,
      syncedAt: new Date().toISOString(),
      ...result
    });
  } catch (error) {
    console.error("TikTok daily cron sync error", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "TikTok daily sync failed."
      },
      { status: 500 }
    );
  }
}
