/** Meta-only Supabase PostgREST access. Secrets are never returned to browsers. */
export type MetaPlatform = "instagram" | "facebook";

export type MetaStoredContent = {
  platform: MetaPlatform;
  account_id: string;
  content_id: string;
  published_on: string | null;
  caption: string | null;
  content_type: string | null;
  permalink: string | null;
  media_views: number | null;
  unique_media_viewers: number | null;
  reach: number | null;
  likes: number | null;
  reactions: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  clicks: number | null;
  updated_at: string;
};
export type MetaSnapshot = {
  platform: MetaPlatform;
  account_id: string;
  snapshot_date: string;
  captured_at: string;
  followers: number | null;
  media_count: number | null;
  recent_media_views: number | null;
  recent_interactions: number | null;
  recent_posts_sample_count: number;
};
export type MetaProgress = {
  platform: MetaPlatform;
  account_id: string;
  after_cursor: string | null;
  complete: boolean;
  last_synced_at: string | null;
  last_error: string | null;
};

function configuration() {
  const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!base || !key) throw new Error("SUPABASE_URL or SUPABASE_SECRET_KEY is missing on Vercel.");
  return { base, key };
}

export async function metaStore(path: string, init: RequestInit = {}) {
  const { base, key } = configuration();
  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  // sb_secret_* keys are NOT JWTs and must not be used as Bearer tokens.
  if (key.startsWith("eyJ")) headers.set("Authorization", `Bearer ${key}`);
  if (init.body) headers.set("Content-Type", "application/json");
  const response = await fetch(`${base}/rest/v1/${path}`, { ...init, headers, cache: "no-store" });
  if (!response.ok) {
    const body = await response.text();
    // Do not echo headers, URLs containing secrets, or raw DB response bodies to users.
    console.error("Meta snapshot store HTTP error", response.status, body.slice(0, 300));
    throw new Error(`Meta history storage returned HTTP ${response.status}. Check SQL migration and Vercel Supabase environment variables.`);
  }
  return response;
}

export async function upsertMetaRows<T extends Record<string, unknown>>(table: string, conflict: string, rows: T[]) {
  if (!rows.length) return;
  // Small batches to stay below PostgREST and request size limits.
  for (let i = 0; i < rows.length; i += 50) {
    await metaStore(`${table}?on_conflict=${conflict}`, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows.slice(i, i + 50))
    });
  }
}

export async function readMetaProgress(platform: MetaPlatform): Promise<MetaProgress | null> {
  const res = await metaStore(`meta_backfill_progress?platform=eq.${platform}&select=*&limit=1`);
  const rows = (await res.json()) as MetaProgress[];
  return rows[0] || null;
}

export async function readMetaHistory(platform: MetaPlatform, accountId: string, days = 365): Promise<MetaSnapshot[]> {
  const since = new Date(Date.now() - (days + 2) * 86400000).toISOString().slice(0, 10);
  const res = await metaStore(`meta_account_daily_snapshots?platform=eq.${platform}&account_id=eq.${encodeURIComponent(accountId)}&snapshot_date=gte.${since}&select=*&order=snapshot_date.asc&limit=400`);
  return (await res.json()) as MetaSnapshot[];
}

export async function readMetaAllTimeTop(platform: MetaPlatform, accountId: string): Promise<MetaStoredContent[]> {
  const res = await metaStore(`meta_content_catalog?platform=eq.${platform}&account_id=eq.${encodeURIComponent(accountId)}&media_views=not.is.null&select=*&order=media_views.desc.nullslast&limit=5`);
  return (await res.json()) as MetaStoredContent[];
}

export async function readMetaCoverage(platform: MetaPlatform, accountId: string) {
  const res = await metaStore(`meta_content_catalog?platform=eq.${platform}&account_id=eq.${encodeURIComponent(accountId)}&select=content_id&limit=1`, { headers: { Prefer: "count=exact" } });
  const contentRange = res.headers.get("content-range") || "";
  const total = Number(contentRange.split("/").pop());
  return Number.isFinite(total) ? total : 0;
}
