/**
 * Meta → Supabase ONLY ingestion.
 * Dashboard read endpoints must NEVER invoke this module or Graph API.
 * Partial historical coverage is explicit; old daily reach cannot be invented.
 */
import { metaConfig, metaGraph } from "@/lib/meta-graph";
import {
  insertMetaSyncRun, finishMetaSyncRun, readMetaExistingContent, readMetaProfile,
  readMetaIngestCursor, upsertMetaRows,
  type MetaPlatform
} from "@/lib/meta-store";

type Json = Record<string, any>;
type SourceEdge = "media" | "stories" | "posts" | "videos" | "photos";
type MetricResult = { value: number | null; raw: Json; error: string | null };
type IngestResult = { rows: Array<Record<string, unknown>>; next: string | null; count: number; newCount: number };

// Each backfill call is bounded for Meta rate limits and Vercel function duration.
const PAGE_SIZE = 15;
const MAX_PAGES_PER_PLATFORM = 3;
const HARD_DEADLINE_MS = 220_000;
const MEDIA_METRICS = ["views", "reach", "likes", "comments", "saved", "shares", "total_interactions"];
const INSTAGRAM_ACCOUNT_METRICS = ["views", "reach", "total_interactions", "profile_views", "profile_links_taps", "follows_and_unfollows"];
const FACEBOOK_ACCOUNT_METRICS = ["page_media_view", "page_follows", "page_fan_adds", "page_fan_removes", "page_views_total", "page_post_engagements"];
const IG_AUDIENCE = ["age", "gender", "city", "country"];
const FB_AUDIENCE: Array<{metric:string;breakdown:string}> = [
  { metric: "page_fans_gender_age", breakdown: "gender_age" },
  { metric: "page_fans_city", breakdown: "city" },
  { metric: "page_fans_country", breakdown: "country" }
];

function wibDate(timestamp = Date.now()) {
  return new Date(timestamp + 7 * 3600 * 1000).toISOString().slice(0, 10);
}
function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function reported(input: unknown): number | null {
  if (typeof input === "number") return asNumber(input);
  return null;
}
function dateOrNull(value: unknown): string | null {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null;
}
function rawData(payload: Json): Json {
  // Never persist Meta paging.next with access_token, including nested raw responses.
  const { paging: _paging, ...safe } = payload;
  return safe;
}
function metricValue(payload: Json, name: string): number | null {
  const entry = payload.data?.find((m: Json) => m?.name === name);
  if (!entry) return null;
  if (typeof entry.total_value?.value === "number") return asNumber(entry.total_value.value);
  const values = entry.values;
  return Array.isArray(values) && values.length ? asNumber(values[values.length - 1]?.value) : null;
}
function message(error: unknown) {
  return (error instanceof Error ? error.message : "Meta request unavailable").slice(0, 480);
}
async function mapLimited<T,U>(rows: T[], limit: number, fn: (value: T) => Promise<U>): Promise<U[]> {
  const out: U[] = new Array(rows.length);
  let index = 0;
  await Promise.all(Array.from({length: Math.min(rows.length,limit)}, async () => {
    while (index < rows.length) {
      const current = index++;
      out[current] = await fn(rows[current]);
    }
  }));
  return out;
}
async function graph<T>(platform: MetaPlatform, path: string, params: Record<string, string | number | undefined | null> = {}): Promise<T> {
  return metaGraph<T>(path, params, { signal: AbortSignal.timeout(18_000) }, platform);
}

// Read every requested metric individually if the bulk request is rejected.
// No metric is represented as zero when Meta refuses access.
async function contentMetrics(platform: MetaPlatform, contentId: string, edge: SourceEdge) {
  const names = MEDIA_METRICS;
  const requested = platform === "instagram" && edge === "stories"
    ? ["views", "reach", "shares", "total_interactions"]
    : platform === "facebook" ? ["post_media_view", "post_clicks", "post_reactions_by_type_total"] : names;
  const values: Record<string, number | null> = {};
  const raw: Record<string, Json> = {};
  const errors: Record<string, string> = {};
  const path = `/${contentId}/insights`;
  try {
    const payload = await graph<Json>(platform, path, {metric: requested.join(",")});
    const response = rawData(payload);
    for (const name of requested) {
      values[name] = metricValue(payload, name);
      raw[name] = response.data?.find((item: Json) => item.name === name) || {};
    }
  } catch {
    // Split unsupported metric(s) so valid views/reach are still retained.
    await mapLimited(requested, 3, async (name) => {
      try {
        const payload = await graph<Json>(platform, path, {metric: name});
        values[name] = metricValue(payload, name);
        raw[name] = rawData(payload);
      } catch (error) {
        values[name] = null;
        errors[name] = message(error);
      }
    });
  }
  // Unique Media Viewers is optional; isolate it from primary Facebook metrics
  // because Meta can reject it for certain post/media types.
  if (platform === "facebook") {
    const name = "post_total_media_view_unique";
    try {
      const payload = await graph<Json>(platform,path,{metric:name});
      values[name] = metricValue(payload,name);
      raw[name] = rawData(payload);
    } catch(error) {
      values[name] = null;
      errors[name] = message(error);
    }
  }
  return {values,raw,errors};
}
function getReactionBreakdown(raw: Record<string, Json>) {
  const entry = raw.post_reactions_by_type_total;
  const first = entry?.values?.[0]?.value ?? entry?.data?.[0]?.values?.[0]?.value;
  if (!first || typeof first !== "object") return null;
  const values = Object.values(first).map(asNumber);
  return values.some((value) => value !== null)
    ? values.reduce<number>((sum, value) => sum + (value || 0), 0) : null;
}
function sourceFields(platform: MetaPlatform, edge: SourceEdge): string {
  if (platform === "instagram") {
    return edge === "stories"
      ? "id,media_type,media_product_type,permalink,timestamp,media_url"
      : "id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count,thumbnail_url,media_url";
  }
  if (edge === "videos") return "id,title,description,created_time,permalink_url";
  if (edge === "photos") return "id,name,created_time,link,picture";
  return "id,message,created_time,permalink_url,shares,comments.limit(0).summary(true),reactions.limit(0).summary(true)";
}
function keyFor(platform: MetaPlatform, edge: SourceEdge): string { return `${platform}:${edge}`; }
function sources(platform: MetaPlatform): SourceEdge[] {
  return platform === "instagram" ? ["media"] : ["posts", "videos", "photos"];
}

async function loadContentPage(platform: MetaPlatform, accountId: string, edge: SourceEdge, after: string | null): Promise<{items:Json[];next:string|null}> {
  const path = `/${accountId}/${edge}`;
  const payload = await graph<Json>(platform, path, {
    fields: sourceFields(platform,edge), limit: PAGE_SIZE, after: after || undefined,
    ...(edge === "photos" ? { type: "uploaded" } : {})
  });
  const items: Json[] = Array.isArray(payload.data) ? payload.data : [];
  const next = payload?.paging?.next && typeof payload?.paging?.cursors?.after === "string"
    ? payload.paging.cursors.after : null;
  return { items, next };
}

function normalizeItem(platform: MetaPlatform, accountId: string, edge: SourceEdge, item: Json,
  result: Awaited<ReturnType<typeof contentMetrics>>, now: string): Record<string, unknown> {
  const ig = platform === "instagram";
  const timestamp = dateOrNull(ig ? item.timestamp : item.created_time);
  const type = ig
    ? edge === "stories" ? "Story" : item.media_product_type === "REELS" ? "Reel" : item.media_type === "CAROUSEL_ALBUM" ? "Carousel" : "Post"
    : edge === "videos" ? "Video" : edge === "photos" ? "Photo"
    : (item.permalink_url || "").includes("/reel/") ? "Reel" : (item.permalink_url || "").includes("/videos/") ? "Video" : "Post";
  const reactions = asNumber(item.reactions?.summary?.total_count) ?? getReactionBreakdown(result.raw);
  const metrics = result.values;
  const published_on = timestamp ? wibDate(Date.parse(timestamp)) : null;
  return {
    platform, account_id: accountId, content_id: String(item.id),
    published_on, published_at: timestamp,
    source_edge: edge, content_type: type,
    caption: ig ? (item.caption || null) : (item.message || item.description || item.name || item.title || null),
    permalink: ig ? item.permalink || null : item.permalink_url || item.link || null,
    thumbnail_url: item.thumbnail_url || item.picture || null,
    media_url: item.media_url || null,
    media_product_type: item.media_product_type || item.media_type || null,
    media_views: ig ? (metrics.views ?? null) : (metrics.post_media_view ?? null),
    unique_media_viewers: ig ? null : (metrics.post_total_media_view_unique ?? null),
    reach: ig ? (metrics.reach ?? null) : null,
    likes: ig ? (metrics.likes ?? asNumber(item.like_count)) : null,
    reactions: ig ? null : reactions,
    comments: ig ? (metrics.comments ?? asNumber(item.comments_count)) : asNumber(item.comments?.summary?.total_count),
    shares: ig ? (metrics.shares ?? null) : asNumber(item.shares?.count),
    saves: ig ? (metrics.saved ?? null) : null,
    clicks: ig ? null : (metrics.post_clicks ?? null),
    raw_media: item, raw_insights: result.raw, metric_errors: result.errors,
    insights_checked_at: now, last_seen_at: now, updated_at: now
  };
}
const KEEP_METRICS = ["media_views","unique_media_viewers","reach","likes","reactions","comments","shares","saves","clicks"] as const;
async function ingestPage(platform: MetaPlatform, accountId: string, edge: SourceEdge, after: string | null): Promise<IngestResult> {
  const {items,next} = await loadContentPage(platform,accountId,edge,after);
  const now = new Date().toISOString();
  const rows = await mapLimited(items, 4, async item => {
    const metrics = await contentMetrics(platform, String(item.id), edge);
    return normalizeItem(platform,accountId,edge,item,metrics,now);
  });
  const existing = await readMetaExistingContent(platform, accountId, items.map(item => String(item.id)));
  const found = new Map(existing.map(row => [row.content_id,row]));
  // Preserve the last successful normalized values on transient metric failures.
  const merged = rows.map(row => {
    const previous = found.get(String(row.content_id));
    if (!previous) return row;
    for (const name of KEEP_METRICS) if (row[name] == null) row[name] = previous[name];
    if (row.published_at == null) row.published_at = previous.published_at;
    if (row.published_on == null) row.published_on = previous.published_on;
    if (row.caption == null) row.caption = previous.caption;
    if (row.permalink == null) row.permalink = previous.permalink;
    // Preserve historical raw data when the current request failed entirely.
    row.raw_insights = { ...(previous.raw_insights || {}), ...(row.raw_insights as Json) };
    row.first_seen_at = (previous as any).first_seen_at || now;
    return row;
  });
  await upsertMetaRows("meta_content_catalog", "platform,account_id,content_id", merged);
  await upsertMetaRows("meta_content_insight_snapshots", "platform,account_id,content_id,snapshot_date", merged.map(row => ({
    platform, account_id:accountId,content_id:String(row.content_id),snapshot_date:wibDate(),
    ...Object.fromEntries(KEEP_METRICS.map(name=>[name,row[name]])),
    raw_insights:row.raw_insights,metric_errors:row.metric_errors,captured_at:now
  })));
  return {rows:merged,next,count:merged.length,newCount:merged.filter(row=>!found.has(String(row.content_id))).length};
}

async function ingestLatest(platform: MetaPlatform, accountId: string): Promise<IngestResult> {
  const main = platform === "instagram" ? "media" : "posts";
  const fresh = await ingestPage(platform,accountId,main,null);
  if (platform === "instagram") {
    // Instagram Stories endpoint contains active stories only; historical
    // expired/archived stories cannot reliably be recovered via this API.
    try { await ingestPage(platform,accountId,"stories",null); }
    catch (error) { console.warn("Meta optional active stories unavailable",message(error)); }
  }
  return fresh;
}

async function profileAndInsights(platform: MetaPlatform, accountId: string, sample: IngestResult) {
  const ig = platform === "instagram";
  const profile = await graph<Json>(platform, `/${accountId}`, {
    fields: ig ? "id,username,name,followers_count,media_count,profile_picture_url"
      : "id,name,link,followers_count,fan_count,picture.type(large)"
  });
  const now = new Date().toISOString();
  const today = wibDate();
  const followers = asNumber(profile.followers_count ?? profile.fan_count);
  await upsertMetaRows("meta_account_profiles", "platform,account_id", [{
    platform, account_id:accountId,name:profile.name || null,username:profile.username || null,
    profile_url:profile.link || (ig ? `https://instagram.com/${profile.username || ""}/` : null),
    profile_picture_url:ig ? profile.profile_picture_url || null : profile.picture?.data?.url || null,
    followers,media_count:asNumber(profile.media_count),raw_profile:rawData(profile),captured_at:now
  }]);
  const sum = (name: string) => {
    const valid = sample.rows.map(row=>asNumber(row[name])).filter((num):num is number=>num!==null);
    return valid.length ? valid.reduce((a,b)=>a+b,0) : null;
  };
  const interactions = sample.rows.map(row => {
    const fields = ig ? ["likes","comments","shares","saves"] : ["reactions","comments","shares"];
    const valid = fields.map(name=>asNumber(row[name])).filter((n):n is number=>n!==null);
    return valid.length ? valid.reduce((a,b)=>a+b,0) : null;
  });
  const validInteractions = interactions.filter((n):n is number=>n!==null);
  await upsertMetaRows("meta_account_daily_snapshots", "platform,account_id,snapshot_date", [{
    platform,account_id:accountId,snapshot_date:today,captured_at:now,
    followers,media_count:asNumber(profile.media_count),recent_media_views:sum("media_views"),
    recent_interactions:validInteractions.length ? validInteractions.reduce((a,b)=>a+b,0) : null,
    recent_posts_sample_count:sample.count
  }]);
  // Persist all configured account Insights including unavailable/error states;
  // one failing metric must not prevent other metrics or the daily snapshot.
  const metrics = ig ? INSTAGRAM_ACCOUNT_METRICS : FACEBOOK_ACCOUNT_METRICS;
  const accountRows = await mapLimited(metrics,3,async metric => {
    const params: Record<string,string|number> = ig
      ? {metric,period:"day",metric_type:"total_value",since:Math.floor(Date.now()/1000)-2*86400,until:Math.floor(Date.now()/1000)}
      : {metric,period:"day",since:Math.floor(Date.now()/1000)-2*86400,until:Math.floor(Date.now()/1000)};
    try {
      const payload = await graph<Json>(platform,`/${accountId}/insights`,params);
      return {platform,account_id:accountId,snapshot_date:today,metric,period:"day",dimension:"",
        status:Array.isArray(payload.data)&&payload.data.length?"ok":"unavailable",
        value:metricValue(payload,metric),raw_response:rawData(payload),error_message:null,captured_at:now};
    } catch(error) {
      return {platform,account_id:accountId,snapshot_date:today,metric,period:"day",dimension:"",
        status:"error",value:null,raw_response:{},error_message:message(error),captured_at:now};
    }
  });
  await upsertMetaRows("meta_account_insight_snapshots","platform,account_id,snapshot_date,metric,period,dimension",accountRows);
  const demographics = ig ? IG_AUDIENCE.map(breakdown=>({metric:"follower_demographics",breakdown})) : FB_AUDIENCE;
  const demoRows = await mapLimited(demographics,3,async({metric,breakdown})=>{
    const params = ig
      ? {metric,period:"lifetime",metric_type:"total_value",timeframe:"last_90_days",breakdown}
      : {metric,period:"lifetime"};
    try {
      const payload=await graph<Json>(platform,`/${accountId}/insights`,params);
      return {platform,account_id:accountId,snapshot_date:today,metric,breakdown,
        status:Array.isArray(payload.data)&&payload.data.length?"ok":"unavailable",
        raw_response:rawData(payload),error_message:null,captured_at:now};
    } catch(error) {
      return {platform,account_id:accountId,snapshot_date:today,metric,breakdown,
        status:"error",raw_response:{},error_message:message(error),captured_at:now};
    }
  });
  await upsertMetaRows("meta_audience_snapshots","platform,account_id,snapshot_date,metric,breakdown",demoRows);
  return {followers,accountMetrics:accountRows.filter(row=>row.status==="ok").length};
}

// Each source has independent initial cursor and subsequent full-refresh cursor.
// Re-checking older posts updates their lifetime metrics and daily snapshots.
async function backfillEdge(platform: MetaPlatform, accountId: string, edge: SourceEdge) {
  const prior = await readMetaIngestCursor(platform,accountId,edge);
  if (prior?.next_retry_at && Date.parse(prior.next_retry_at)>Date.now()) return {edge,skipped:true,pages:0,posts:0};
  const initial = !prior?.initial_complete;
  const after = initial ? prior?.after_cursor || null : prior?.refresh_cursor || null;
  try {
    const collected = await ingestPage(platform,accountId,edge,after);
    if (after && collected.next === after) throw new Error("Meta returned unchanged pagination cursor.");
    const now = new Date().toISOString();
    const complete = initial ? !collected.next : Boolean(prior?.initial_complete);
    await upsertMetaRows("meta_ingest_cursors","platform,account_id,edge",[{
      platform,account_id:accountId,edge,
      after_cursor:initial?collected.next:null,
      initial_complete:complete,
      refresh_cursor:initial?null:collected.next,
      last_completed_refresh:!initial&&!collected.next?now:prior?.last_completed_refresh || null,
      last_synced_at:now,last_error:null,next_retry_at:null
    }]);
    const main = platform === "instagram" ? "media" : "posts";
    if(edge===main) await upsertMetaRows("meta_backfill_progress","platform",[{
      platform,account_id:accountId,after_cursor:initial?collected.next:null,
      complete,last_synced_at:now,last_error:null
    }]);
    return {edge,skipped:false,pages:1,posts:collected.count,complete};
  }catch(error){
    const issue=message(error);
    const now=new Date().toISOString();
    // Meta cursors are opaque and may become invalid when a feed changes.
    // Reset only the affected edge, keep previously ingested catalog entries.
    const resetCursor = /invalid.*(cursor|after)|paging cursor|expired.*cursor|cursor.*invalid/i.test(issue);
    await upsertMetaRows("meta_ingest_cursors","platform,account_id,edge",[{
      platform,account_id:accountId,edge,
      after_cursor:resetCursor?null:prior?.after_cursor || null,
      initial_complete:resetCursor?false:Boolean(prior?.initial_complete),
      refresh_cursor:resetCursor?null:prior?.refresh_cursor || null,
      last_completed_refresh:prior?.last_completed_refresh || null,
      last_synced_at:now,last_error:issue,
      next_retry_at:new Date(Date.now()+6*3600*1000).toISOString()
    }]);
    console.warn("Meta historical edge unavailable",keyFor(platform,edge),issue);
    return {edge,skipped:false,pages:0,posts:0,error:issue};
  }
}

async function doBackfill(platform: MetaPlatform, accountId: string, deadline: number) {
  const edges=sources(platform);
  const reports: Awaited<ReturnType<typeof backfillEdge>>[] = [];
  // At most one page/edge in a round-robin cycle. FB photos/videos are
  // optional and errors are recorded without blocking the essential posts edge.
  for(let iteration=0;iteration<MAX_PAGES_PER_PLATFORM && Date.now()<deadline;iteration++){
    // IG has only one edge; can process 2 pages each hour.
    const edge=edges[iteration%edges.length];
    reports.push(await backfillEdge(platform,accountId,edge));
  }
  return {pages:reports.reduce((a,b)=>a+b.pages,0),posts:reports.reduce((a,b)=>a+b.posts,0),reports};
}

async function runOne(platform: MetaPlatform, kind:"daily"|"backfill"){
  const {facebookPageId,instagramUserId}=metaConfig();
  const accountId=platform==="instagram"?instagramUserId:facebookPageId;
  const runId=await insertMetaSyncRun(platform,kind);
  const deadline=Date.now()+HARD_DEADLINE_MS;
  let posts=0, pages=0, created=0;
  try{
    // First-ever deploy: hourly backfill seeds the profile/snapshot so the
    // Supabase-only dashboard can come online before the next 08:00 WIB run.
    const bootstrap=kind==="backfill" && !(await readMetaProfile(platform,accountId));
    if(kind==="daily" || bootstrap){
      const sample=await ingestLatest(platform,accountId);
      posts+=sample.count; created+=sample.newCount; pages+=1;
      await profileAndInsights(platform,accountId,sample);
    }
    // Catch ephemeral Instagram Stories more reliably than once per day.
    // Stories deleted or expired before any successful collection cannot be recovered.
    if(kind==="backfill" && platform==="instagram" && !bootstrap) {
      try {const activeStories=await ingestPage(platform,accountId,"stories",null);
        posts+=activeStories.count;pages+=1;} catch(error) {
        console.warn("Active Instagram Stories not available",message(error));
      }
    }
    const backfill=await doBackfill(platform,accountId,deadline);
    posts+=backfill.posts;pages+=backfill.pages;
    const errors=backfill.reports.filter(row=>"error" in row&&row.error).map(row=>`${row.edge}: ${row.error}`);
    await finishMetaSyncRun(runId,{status:errors.length?"partial":"success",contents_processed:posts,
      new_contents:created,pages_processed:pages,details:{backfill:backfill.reports},
      error_message:errors.length?errors.join("; ").slice(0,400):null});
    return {platform,kind,ok:true,partial:errors.length>0,posts,pages,accountId,details:backfill.reports};
  }catch(error){
    const issue=message(error);
    await finishMetaSyncRun(runId,{status:"failed",contents_processed:posts,
      new_contents:created,pages_processed:pages,error_message:issue});
    console.error("Meta ingestion failed",platform,kind,issue);
    return {platform,kind,ok:false,error:issue,posts,pages};
  }
}
export async function runMetaDailySync(){
  const results=[];
  for(const platform of ["instagram","facebook"] as const) results.push(await runOne(platform,"daily"));
  return {ok:results.every(x=>x.ok),results};
}
export async function runMetaBackfillSync(){
  const results=[];
  for(const platform of ["instagram","facebook"] as const) results.push(await runOne(platform,"backfill"));
  return {ok:results.every(x=>x.ok),results};
}

/** Run the existing daily ingest for a single authenticated dashboard. */
export async function runMetaManualSync(platform: MetaPlatform) {
  return runOne(platform, "daily");
}
