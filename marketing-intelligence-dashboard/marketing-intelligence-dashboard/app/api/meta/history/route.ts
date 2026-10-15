import { NextRequest, NextResponse } from "next/server";
import { metaConfig } from "@/lib/meta-graph";
import { readMetaHistory, readMetaAllTimeTop, readMetaProgress, readMetaCoverage, type MetaPlatform } from "@/lib/meta-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams.get("platform");
  if (input !== "instagram" && input !== "facebook") {
    return NextResponse.json({ ok: false, error: "Valid platform is required." }, { status: 400 });
  }
  const platform: MetaPlatform = input;
  try {
    const config = metaConfig();
    const accountId = platform === "instagram" ? config.instagramUserId : config.facebookPageId;
    const [history, top, progress, count] = await Promise.all([
      readMetaHistory(platform, accountId), readMetaAllTimeTop(platform, accountId),
      readMetaProgress(platform), readMetaCoverage(platform, accountId)
    ]);
    const validProgress = progress?.account_id === accountId ? progress : null;
    return NextResponse.json({
      ok: true, platform, history, top,
      coverage: {
        scanned: count,
        complete: Boolean(validProgress?.complete),
        lastSync: validProgress?.last_synced_at ?? null,
        lastError: validProgress?.last_error ?? null
      }
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ ok: false,
      error: error instanceof Error ? error.message : "Unable to load Meta history." }, { status: 503 });
  }
}
