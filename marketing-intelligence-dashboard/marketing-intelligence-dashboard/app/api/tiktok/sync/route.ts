import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session";
import {
  fetchTikTokVideoPage,
  getStoredTikTokVideoCount,
  getTikTokAccountId,
  getValidTikTokAccessToken,
  logTikTokFullSync,
  saveTikTokVideoBatch
} from "@/lib/tiktok-sync";

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get("mi_session")?.value;
  const isAuthenticated = await verifySessionToken(
    sessionToken,
    process.env.SESSION_SECRET
  );

  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      cursor?: number | null;
      totalSynced?: number;
    };

    const { accessToken, openId } = await getValidTikTokAccessToken();
    const accountId = await getTikTokAccountId(openId);

    const page = await fetchTikTokVideoPage(
      accessToken,
      typeof body.cursor === "number" ? body.cursor : null
    );

    await saveTikTokVideoBatch(accountId, page.videos);

    const totalSynced = (body.totalSynced ?? 0) + page.videos.length;
    const storedCount = await getStoredTikTokVideoCount(accountId);

    if (!page.hasMore) {
      await logTikTokFullSync(accountId, totalSynced);
    }

    return NextResponse.json({
      syncedThisPage: page.videos.length,
      totalSynced,
      storedCount,
      hasMore: page.hasMore,
      nextCursor: page.nextCursor
    });
  } catch (error) {
    console.error("TikTok full sync error", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to sync TikTok videos."
      },
      { status: 500 }
    );
  }
}
