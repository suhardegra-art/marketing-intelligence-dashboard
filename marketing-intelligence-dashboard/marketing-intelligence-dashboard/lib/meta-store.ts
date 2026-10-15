/** Server-only Meta Supabase storage. NEVER import this module in a client component. */
export type MetaPlatform = "instagram" | "facebook";
export type MetaStoredContent = {
  platform: MetaPlatform; account_id: string; content_id: string;
  published_on: string | null; published_at?: string | null;
  caption: string | null; content_type: string | null; source_edge?: string | null;
  permalink: string | null; thumbnail_url?: string | null; media_url?: string | null;
  media_views: number | null; unique_media_viewers: number | null; reach: number | null;
  likes: number | null; reactions: number | null; comments: number | null;
  shares: number | null; saves: number | null; clicks: number | null;
  raw_media?: Record<string, any>; raw_insights?: Record<string, any>;
  metric_errors?: Record<string, any>; updated_at: string;
};
export type MetaSnapshot = {
  platform: MetaPlatform; account_id: string; snapshot_date: string;
  captured_at: string; followers: number | null; media_count: number | null;
  recent_media_views: number | null; recent_interactions: number | null;
  recent_posts_sample_count: number;
};
export type MetaProgress = {
  platform: MetaPlatform; account_id: string; after_cursor: string | null;
  complete: boolean; last_synced_at: string | null; last_error: string | null;
};
export type MetaIngestCursor = {
  platform: MetaPlatform; account_id: string; edge: string;
  after_cursor: string | null; initial_complete: boolean;
  refresh_cursor: string | null; last_completed_refresh: string | null;
  last_synced_at: string | null; last_error: string | null;
  next_retry_at: string | null;
};
export type MetaProfile = {
  platform: MetaPlatform; account_id: string; name: string | null;
  username: string | null; profile_url: string | null;
  profile_picture_url: string | null; followers: number | null;
  media_count: number | null; raw_profile: Record<string, any>;
  captured_at: string;
};

function config() {
  const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!base || !key) throw new Error("SUPABASE_URL or SUPABASE_SECRET_KEY is missing on Vercel.");
  return { base, key };
}

export async function metaStore(path: string, init: RequestInit = {}): Promise<Response> {
  const { base, key } = config();
  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  // Old service_role JWT keys are Bearer JWTs. sb_secret_* must NOT be sent as Bearer.
  if (key.startsWith("eyJ")) headers.set("Authorization", `Bearer ${key}`);
  if (init.body) headers.set("Content-Type", "application/json");
  const response = await fetch(`${base}/rest/v1/${path}`, { ...init, headers, cache: "no-store" });
  if (!response.ok) {
    console.error("Meta DB request failed", response.status, path.split("?")[0]);
    throw new Error(`Supabase Meta storage HTTP ${response.status}; check V4 SQL and Vercel server-side environment.`);
  }
  return response;
}

export async function metaRows<T>(path: string): Promise<T[]> {
  const response = await metaStore(path);
  const body = await response.json();
  if (!Array.isArray(body)) throw new Error("Invalid Supabase Meta response.");
  return body as T[];
}
export async function upsertMetaRows<T extends Record<string, unknown>>(table: string, conflict: string, rows: T[]) {
  for (let i = 0; i < rows.length; i += 40) {
    await metaStore(`${table}?on_conflict=${conflict}`, {
      method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows.slice(i, i + 40))
    });
  }
}
export async function readMetaProgress(platform: MetaPlatform): Promise<MetaProgress | null> {
  const data = await metaRows<MetaProgress>(`meta_backfill_progress?platform=eq.${platform}&select=*&limit=1`);
  return data[0] || null;
}
export async function readMetaIngestCursor(platform: MetaPlatform, accountId: string, edge: string): Promise<MetaIngestCursor | null> {
  const data = await metaRows<MetaIngestCursor>(`meta_ingest_cursors?platform=eq.${platform}&account_id=eq.${encodeURIComponent(accountId)}&edge=eq.${encodeURIComponent(edge)}&select=*&limit=1`);
  return data[0] || null;
}
export async function readMetaProfile(platform: MetaPlatform, accountId: string): Promise<MetaProfile | null> {
  const data = await metaRows<MetaProfile>(`meta_account_profiles?platform=eq.${platform}&account_id=eq.${encodeURIComponent(accountId)}&select=*&limit=1`);
  return data[0] || null;
}
export async function readMetaContentPage(platform: MetaPlatform, accountId: string, offset: number, limit: number) {
  const data = await metaRows<MetaStoredContent>(`meta_content_catalog?platform=eq.${platform}&account_id=eq.${encodeURIComponent(accountId)}&select=*&order=published_at.desc.nullslast,published_on.desc.nullslast,content_id.desc&limit=${limit + 1}&offset=${offset}`);
  return { rows: data.slice(0, limit), hasNext: data.length > limit };
}
export async function readMetaExistingContent(platform: MetaPlatform, accountId: string, ids: string[]) {
  if (!ids.length) return [];
  // Meta Graph content IDs are numeric or PageID_PostID strings. Encode PostgREST in() safely.
  const safe = ids.filter((id) => /^[0-9_]+$/.test(id)).slice(0, 50);
  if (!safe.length) return [];
  return metaRows<MetaStoredContent>(`meta_content_catalog?platform=eq.${platform}&account_id=eq.${encodeURIComponent(accountId)}&content_id=in.(${safe.join(",")})&select=*`);
}
export async function readMetaHistory(platform: MetaPlatform, accountId: string, days = 365): Promise<MetaSnapshot[]> {
  const since = new Date(Date.now() - (days + 3) * 86400000).toISOString().slice(0, 10);
  return metaRows<MetaSnapshot>(`meta_account_daily_snapshots?platform=eq.${platform}&account_id=eq.${encodeURIComponent(accountId)}&snapshot_date=gte.${since}&select=*&order=snapshot_date.asc&limit=400`);
}
export async function readMetaAllTimeTop(platform: MetaPlatform, accountId: string): Promise<MetaStoredContent[]> {
  return metaRows<MetaStoredContent>(`meta_content_catalog?platform=eq.${platform}&account_id=eq.${encodeURIComponent(accountId)}&media_views=not.is.null&select=*&order=media_views.desc.nullslast&limit=5`);
}
export async function readMetaCoverage(platform: MetaPlatform, accountId: string): Promise<number> {
  const response = await metaStore(`meta_content_catalog?platform=eq.${platform}&account_id=eq.${encodeURIComponent(accountId)}&select=content_id&limit=1`, { headers: { Prefer: "count=exact" } });
  const value = Number((response.headers.get("content-range") || "").split("/").pop());
  return Number.isFinite(value) ? value : 0;
}
export async function readMetaAccountInsights(platform: MetaPlatform, accountId: string) {
  return metaRows<{metric:string;period:string;status:string;raw_response:Record<string, any>;snapshot_date:string}>(`meta_account_insight_snapshots?platform=eq.${platform}&account_id=eq.${encodeURIComponent(accountId)}&select=metric,period,status,raw_response,snapshot_date&order=snapshot_date.desc&limit=100`);
}
export async function readMetaAudience(platform: MetaPlatform, accountId: string) {
  return metaRows<{metric:string;breakdown:string;status:string;raw_response:Record<string, any>;snapshot_date:string}>(`meta_audience_snapshots?platform=eq.${platform}&account_id=eq.${encodeURIComponent(accountId)}&select=metric,breakdown,status,raw_response,snapshot_date&order=snapshot_date.desc&limit=60`);
}
export async function insertMetaSyncRun(platform: MetaPlatform, kind: "daily" | "backfill"): Promise<number> {
  const result = await metaStore("meta_sync_runs?select=id", {
    method: "POST", headers: { Prefer: "return=representation" },
    body: JSON.stringify({ platform, run_kind: kind, status: "running" })
  });
  const rows = await result.json() as Array<{id:number}>;
  if (!rows[0]?.id) throw new Error("Unable to create Meta sync run record.");
  return rows[0].id;
}
export async function finishMetaSyncRun(id: number, fields: Record<string, unknown>) {
  await metaStore(`meta_sync_runs?id=eq.${id}`, {
    method: "PATCH", headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ ...fields, finished_at: new Date().toISOString() })
  });
}
