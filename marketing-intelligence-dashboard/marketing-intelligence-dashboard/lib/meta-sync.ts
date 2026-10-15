import { metaConfig, metaGraph } from "@/lib/meta-graph";
import { metaStore, readMetaProgress, upsertMetaRows, type MetaPlatform } from "@/lib/meta-store";

type JsonRecord = Record<string, any>;
type CollectedPage = { rows: JsonRecord[]; next: string | null };
const CONTENT_PAGE_SIZE = 25;
const BACKFILL_PAGES_PER_DAY = 2;

function numberOrNull(input: unknown): number | null {
  return typeof input === "number" && Number.isFinite(input) ? input : null;
}
function dateInWib(input: unknown): string | null {
  if (typeof input !== "string" || !input) return null;
  const timestamp = Date.parse(input);
  return Number.isFinite(timestamp)
    ? new Date(timestamp + 7 * 3600000).toISOString().slice(0, 10)
    : input.slice(0, 10);
}
function metricValue(payload: JsonRecord | null, name: string): number | null {
  const record = payload?.data?.find((item: JsonRecord) => item?.name === name);
  if (!record) return null;
  if (typeof record.total_value?.value === "number") return record.total_value.value;
  const values = record.values;
  return Array.isArray(values) && values.length ? numberOrNull(values[values.length - 1]?.value) : null;
}
async function safeInsights(path: string, metrics: string, service: MetaPlatform): Promise<JsonRecord | null> {
  try { return await metaGraph<JsonRecord>(path, { metric: metrics }, {}, service); }
  catch { return null; }
}
async function mapLimited<T, U>(items: T[], limit: number, fn: (item: T) => Promise<U>): Promise<U[]> {
  const values: U[] = new Array(items.length);
  let offset = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (offset < items.length) {
      const index = offset++;
      values[index] = await fn(items[index]);
    }
  }));
  return values;
}
function reactionCount(post: JsonRecord): number | null {
  const direct = numberOrNull(post.reactions?.summary?.total_count);
  return direct;
}

async function collect(platform: MetaPlatform, accountId: string, after: string | null): Promise<CollectedPage> {
  const instagram = platform === "instagram";
  const edge = instagram ? "media" : "posts";
  const fields = instagram
    ? "id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count"
    : "id,message,created_time,permalink_url,shares,comments.limit(0).summary(true),reactions.limit(0).summary(true)";
  const payload = await metaGraph<JsonRecord>(`/${accountId}/${edge}`, {
    fields, limit: CONTENT_PAGE_SIZE, after: after || undefined
  }, {}, platform);
  const items: JsonRecord[] = Array.isArray(payload?.data) ? payload.data : [];
  const now = new Date().toISOString();
  const rows = await mapLimited(items, 4, async (item) => {
    if (instagram) {
      const insights = await safeInsights(`/${item.id}/insights`, "views,reach,likes,comments,saved,shares,total_interactions", platform);
      return {
        platform, account_id: accountId, content_id: String(item.id),
        published_on: dateInWib(item.timestamp),
        caption: item.caption || null,
        content_type: item.media_product_type === "REELS" ? "Reel" : item.media_type === "CAROUSEL_ALBUM" ? "Carousel" : "Post",
        permalink: item.permalink || null,
        media_views: metricValue(insights, "views"),
        unique_media_viewers: null,
        reach: metricValue(insights, "reach"),
        likes: metricValue(insights, "likes") ?? numberOrNull(item.like_count),
        reactions: null,
        comments: metricValue(insights, "comments") ?? numberOrNull(item.comments_count),
        shares: metricValue(insights, "shares"),
        saves: metricValue(insights, "saved"),
        clicks: null, updated_at: now
      };
    }
    const [insights, viewers] = await Promise.all([
      safeInsights(`/${item.id}/insights`, "post_media_view,post_clicks,post_reactions_by_type_total", platform),
      safeInsights(`/${item.id}/insights`, "post_total_media_view_unique", platform)
    ]);
    const byType = insights?.data?.find((m: JsonRecord) => m?.name === "post_reactions_by_type_total")?.values?.[0]?.value;
    const reactionSum = byType && typeof byType === "object" ?
      Object.values(byType).filter((v) => typeof v === "number").reduce<number>((a, v) => a + Number(v), 0) : null;
    return {
      platform, account_id: accountId, content_id: String(item.id),
      published_on: dateInWib(item.created_time),
      caption: item.message || null,
      content_type: String(item.permalink_url || "").includes("/reel/") ? "Reel" : String(item.permalink_url || "").includes("/videos/") ? "Video" : "Post",
      permalink: item.permalink_url || null,
      media_views: metricValue(insights, "post_media_view"),
      unique_media_viewers: metricValue(viewers, "post_total_media_view_unique"),
      reach: null,
      likes: null,
      reactions: reactionCount(item) ?? reactionSum,
      comments: numberOrNull(item.comments?.summary?.total_count),
      shares: numberOrNull(item.shares?.count) ?? 0,
      saves: null,
      clicks: metricValue(insights, "post_clicks"),
      updated_at: now
    };
  });
  const next = typeof payload.paging?.cursors?.after === "string" && payload.paging?.next
    ? payload.paging.cursors.after : null;
  return { rows, next };
}

function sumOrNull(values: Array<number | null>) {
  const valid = values.filter((value): value is number => typeof value === "number");
  return valid.length ? valid.reduce((a, b) => a + b, 0) : null;
}

async function syncOne(platform: MetaPlatform) {
  const config = metaConfig();
  const accountId = platform === "instagram" ? config.instagramUserId : config.facebookPageId;
  const profile = await metaGraph<JsonRecord>(`/${accountId}`, {
    fields: platform === "instagram" ? "id,username,followers_count,media_count" : "id,name,followers_count,fan_count"
  }, {}, platform);
  const fresh = await collect(platform, accountId, null);
  await upsertMetaRows("meta_content_catalog", "platform,account_id,content_id", fresh.rows);

  // The first page is a changing 25-post cohort, NOT complete daily account traffic.
  const viewSample = sumOrNull(fresh.rows.map((row) => numberOrNull(row.media_views)));
  const interactionSample = sumOrNull(fresh.rows.map((row) => {
    const metrics = platform === "instagram"
      ? [row.likes, row.comments, row.shares, row.saves]
      : [row.reactions, row.comments, row.shares];
    return sumOrNull(metrics.map(numberOrNull));
  }));
  const wibDate = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  await upsertMetaRows("meta_account_daily_snapshots", "platform,account_id,snapshot_date", [{
    platform, account_id: accountId, snapshot_date: wibDate,
    captured_at: new Date().toISOString(),
    followers: numberOrNull(profile.followers_count ?? profile.fan_count),
    media_count: numberOrNull(profile.media_count),
    recent_media_views: viewSample,
    recent_interactions: interactionSample,
    recent_posts_sample_count: fresh.rows.length
  }]);

  // Progress older pages in small batches; safe for Vercel function duration
  // and Meta rate limits. Once initially complete, rotate older pages to refresh metrics.
  const previous = await readMetaProgress(platform);
  const sameAccount = previous !== null && previous.account_id === accountId;
  let cursor = sameAccount && previous?.after_cursor ? previous.after_cursor : fresh.next;
  let complete = sameAccount ? Boolean(previous?.complete) : false;
  let olderProcessed = 0;
  try {
    for (let i = 0; i < BACKFILL_PAGES_PER_DAY && cursor; i++) {
      const older = await collect(platform, accountId, cursor);
      await upsertMetaRows("meta_content_catalog", "platform,account_id,content_id", older.rows);
      olderProcessed += older.rows.length;
      if (older.next === cursor) throw new Error("Meta repeated its pagination cursor");
      cursor = older.next;
      if (!cursor) complete = true;
    }
    await upsertMetaRows("meta_backfill_progress", "platform", [{
      platform, account_id: accountId, after_cursor: cursor,
      complete, last_synced_at: new Date().toISOString(), last_error: null
    }]);
  } catch (error) {
    await upsertMetaRows("meta_backfill_progress", "platform", [{
      platform, account_id: accountId, after_cursor: cursor,
      complete, last_synced_at: new Date().toISOString(),
      last_error: error instanceof Error ? error.message.slice(0, 300) : "Historical scan failed"
    }]);
    throw error;
  }
  return { platform, followerSnapshot: numberOrNull(profile.followers_count ?? profile.fan_count),
    recentPosts: fresh.rows.length, olderProcessed, allTimeScanComplete: complete };
}

export async function runMetaDailySync() {
  const results: Array<Awaited<ReturnType<typeof syncOne>>> = [];
  const failures: string[] = [];
  for (const platform of ["instagram", "facebook"] as const) {
    try { results.push(await syncOne(platform)); }
    catch (error) {
      failures.push(`${platform}: ${error instanceof Error ? error.message : "unknown error"}`);
      console.error("Meta cron failed", platform, error);
    }
  }
  return { ok: failures.length === 0, results, failures };
}
