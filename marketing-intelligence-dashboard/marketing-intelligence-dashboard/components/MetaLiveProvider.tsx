"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type MetaPlatform = "instagram" | "facebook";
export type InstagramLiveRow = {
  id: string; date: string; caption: string; type: "Reel" | "Post" | "Carousel" | "Story";
  views: number | null; reach: number | null; likes: number | null;
  comments: number | null; shares: number | null; saves: number | null;
  permalink: string | null;
};
export type FacebookLiveRow = {
  id: string; date: string; title: string; type: "Reel" | "Video" | "Photo" | "Link" | "Post";
  reach: number | null; // Unique Media Viewers, not the legacy Facebook "Reach" metric.
  impressions: number | null; // Actually Meta Media Views (legacy name kept for compatibility).
  reactions: number | null; comments: number | null; shares: number | null;
  clicks: number | null; permalink: string | null;
};
export type LiveAccount = {
  id: string; name?: string; username?: string;
  followers_count?: number; fan_count?: number; media_count?: number;
  followers?: number; link?: string;
};
export type MetaSnapshot = {
  snapshot_date: string;
  captured_at: string;
  followers: number | null;
  media_count: number | null;
  recent_media_views: number | null;
  recent_interactions: number | null;
  recent_posts_sample_count: number;
};
export type MetaAllTimeRow = {
  content_id: string; published_on: string | null; caption: string | null;
  content_type: string | null; permalink: string | null;
  media_views: number | null; unique_media_viewers: number | null; reach: number | null;
  likes: number | null; reactions: number | null; comments: number | null;
  shares: number | null; saves: number | null; clicks: number | null;
};
export type MetaCoverage = { scanned: number; complete: boolean; lastSync: string | null; lastError: string | null };
export type InstagramAudience = Record<string, any[]>;

type ApiResult = {
  ok: boolean; error?: string;
  account?: LiveAccount; accountInsights?: { data?: Array<Record<string, unknown>>; warning?: string };
  audience?: InstagramAudience;
  page?: LiveAccount; media?: Array<Record<string, any>>; posts?: Array<Record<string, any>>;
  paging?: { cursors?: { after?: string | null }; hasNext?: boolean } | null;
  syncedAt?: string | null; source?: "supabase";
};

type LiveContext = {
  platform: MetaPlatform;
  instagramRows: InstagramLiveRow[]; facebookRows: FacebookLiveRow[];
  account: LiveAccount | null; page: LiveAccount | null;
  accountInsights: ApiResult["accountInsights"] | null;
  audience: InstagramAudience | null;
  history: MetaSnapshot[]; allTimeTop: MetaAllTimeRow[];
  coverage: MetaCoverage | null; historyError: string | null;
  loading: boolean; loadingMore: boolean; error: string | null;
  hasNext: boolean; updatedAt: Date | null; scannedCount: number;
  period: { from: string; to: string };
  setPeriod: (from: string, to: string) => void;
  loadMore: () => Promise<void>;
  ensureLoaded: (minimum: number) => Promise<boolean>;
  loadAllForCsv: () => Promise<{ instagram: InstagramLiveRow[]; facebook: FacebookLiveRow[] }>;
};
const Context = createContext<LiveContext | null>(null);
const PAGE_SIZE = 50; // Meta API limit is 50; UI assembles two pages per 100 rows.
const MAX_EXPORT_PAGES = 120;

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function dateInWib(value: unknown): string {
  if (typeof value !== "string" || !value) return "";
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp)
    ? new Date(timestamp + 7 * 3600000).toISOString().slice(0, 10)
    : value.slice(0, 10);
}
function readCursor(result: ApiResult): string | null {
  const cursor = result.paging?.hasNext ? result.paging.cursors?.after : null;
  return typeof cursor === "string" && cursor.length > 0 ? cursor : null;
}
function instagramItems(input: ApiResult["media"]): InstagramLiveRow[] {
  return (input || []).map((row) => {
    const metrics = row.insights || {};
    return {
      id: String(row.id), date: dateInWib(row.timestamp),
      caption: String(row.caption || "(No caption)"),
      type: row.media_product_type === "STORY" ? "Story" : row.media_product_type === "REELS" ? "Reel"
        : row.media_type === "CAROUSEL_ALBUM" ? "Carousel" : "Post",
      views: numberOrNull(metrics.views), reach: numberOrNull(metrics.reach),
      likes: numberOrNull(metrics.likes ?? row.like_count),
      comments: numberOrNull(metrics.comments ?? row.comments_count),
      shares: numberOrNull(metrics.shares), saves: numberOrNull(metrics.saves),
      permalink: typeof row.permalink === "string" ? row.permalink : null
    };
  });
}
function facebookItems(input: ApiResult["posts"]): FacebookLiveRow[] {
  return (input || []).map((row) => {
    const link = typeof row.permalink_url === "string" ? row.permalink_url : "";
    const reactionsByType = row.insights?.reactionsByType;
    const breakdown = reactionsByType && typeof reactionsByType === "object"
      ? Object.values(reactionsByType) : [];
    const breakdownTotal = breakdown.length && breakdown.every((value) => numberOrNull(value) !== null)
      ? breakdown.reduce<number>((sum, value) => sum + Number(value), 0) : null;
    return {
      id: String(row.id), date: dateInWib(row.created_time),
      title: String(row.message || "(No caption)"),
      type: (["Reel", "Video", "Photo", "Link", "Post"].includes(String(row.content_type))
        ? String(row.content_type) : link.includes("/reel/") ? "Reel" : link.includes("/videos/") ? "Video" : "Post") as FacebookLiveRow["type"],
      reach: numberOrNull(row.insights?.uniqueViewers),
      impressions: numberOrNull(row.insights?.mediaViews),
      reactions: numberOrNull(row.reactions) ?? breakdownTotal,
      comments: numberOrNull(row.comments), shares: numberOrNull(row.shares),
      clicks: numberOrNull(row.insights?.clicks), permalink: link || null
    };
  });
}
function uniqueById<T extends { id: string }>(rows: T[]): T[] {
  return Array.from(new Map(rows.map((row) => [row.id, row])).values());
}
async function fetchPage(platform: MetaPlatform, cursor?: string | null, signal?: AbortSignal): Promise<ApiResult> {
  const qs = new URLSearchParams({ limit: String(PAGE_SIZE) });
  if (cursor) qs.set("after", cursor);
  const response = await fetch(`/api/meta/${platform}?${qs}`, { cache: "no-store", signal });
  const result: ApiResult = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.error || `Meta API HTTP ${response.status}`);
  return result;
}

export function MetaLiveProvider({ platform, children }: { platform: MetaPlatform; children: ReactNode }) {
  const [instagramRows, setInstagramRows] = useState<InstagramLiveRow[]>([]);
  const [facebookRows, setFacebookRows] = useState<FacebookLiveRow[]>([]);
  const [account, setAccount] = useState<LiveAccount | null>(null);
  const [accountInsights, setAccountInsights] = useState<ApiResult["accountInsights"] | null>(null);
  const [audience, setAudience] = useState<InstagramAudience | null>(null);
  const [page, setPage] = useState<LiveAccount | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [period, setPeriodState] = useState({ from: "", to: "" });
  const [history, setHistory] = useState<MetaSnapshot[]>([]);
  const [allTimeTop, setAllTimeTop] = useState<MetaAllTimeRow[]>([]);
  const [coverage, setCoverage] = useState<MetaCoverage | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [scannedCount, setScannedCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    (async () => {
      const first = await fetchPage(platform, null, controller.signal);
      if (controller.signal.aborted) return;
      let ig = instagramItems(first.media);
      let fb = facebookItems(first.posts);
      let next = readCursor(first);
      // Eagerly fill 100 displayed rows by fetching a second 50-item API batch.
      if (next) {
        try {
          const second = await fetchPage(platform, next, controller.signal);
          ig = uniqueById([...ig, ...instagramItems(second.media)]);
          fb = uniqueById([...fb, ...facebookItems(second.posts)]);
          next = readCursor(second);
        } catch (cause) {
          if (controller.signal.aborted) return;
          console.warn("Meta second page unavailable; first batch remains usable", cause);
        }
      }
      if (controller.signal.aborted) return;
      setInstagramRows(ig); setFacebookRows(fb);
      setAccount(first.account || null); setAccountInsights(first.accountInsights || null);
      setAudience(first.audience || null); setPage(first.page || null);
      setCursor(next); setScannedCount(platform === "instagram" ? ig.length : fb.length);
      setUpdatedAt(first.syncedAt ? new Date(first.syncedAt) : null);
    })().catch((cause) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Unable to load live analytics.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [platform]);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      const response = await fetch(`/api/meta/history?platform=${platform}`, { cache: "no-store", signal: controller.signal });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Meta history unavailable.");
      if (controller.signal.aborted) return;
      setHistory(Array.isArray(payload.history) ? payload.history : []);
      setAllTimeTop(Array.isArray(payload.top) ? payload.top : []);
      setCoverage(payload.coverage || null);
      setHistoryError(null);
    })().catch((cause) => {
      if (!controller.signal.aborted) setHistoryError(cause instanceof Error ? cause.message : "History snapshots unavailable.");
    });
    return () => controller.abort();
  }, [platform]);

  const ensureLoaded = useCallback(async (minimum: number) => {
    if (loading || loadingMore) return false;
    let ig = [...instagramRows]; let fb = [...facebookRows];
    const initialCount = platform === "instagram" ? ig.length : fb.length;
    let next = cursor;
    setLoadingMore(true); setError(null);
    try {
      while (next && (platform === "instagram" ? ig.length : fb.length) < minimum) {
        const response = await fetchPage(platform, next);
        const nextCursor = readCursor(response);
        if (nextCursor === next) throw new Error("Meta repeated pagination cursor.");
        ig = uniqueById([...ig, ...instagramItems(response.media)]);
        fb = uniqueById([...fb, ...facebookItems(response.posts)]);
        next = nextCursor;
      }
      setInstagramRows(ig); setFacebookRows(fb); setCursor(next);
      setScannedCount(platform === "instagram" ? ig.length : fb.length);
      // Account sync time is fixed until Vercel performs another Supabase ingestion.
      const finalCount = platform === "instagram" ? ig.length : fb.length;
      return finalCount >= minimum || finalCount > initialCount;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load content page.");
      return false;
    } finally { setLoadingMore(false); }
  }, [instagramRows, facebookRows, cursor, loading, loadingMore, platform]);

  const loadMore = useCallback(async () => { await ensureLoaded((platform === "instagram" ? instagramRows.length : facebookRows.length) + PAGE_SIZE); },
    [ensureLoaded, platform, instagramRows.length, facebookRows.length]);

  const loadAllForCsv = useCallback(async () => {
    if (loading || loadingMore) throw new Error("Please wait for the current data request to finish.");
    setLoadingMore(true); setError(null);
    let ig = [...instagramRows]; let fb = [...facebookRows];
    let next = cursor; let pages = 0;
    try {
      while (next) {
        if (++pages > MAX_EXPORT_PAGES) throw new Error("Stored database pagination limit reached; export cancelled to avoid an incomplete file.");
        const response = await fetchPage(platform, next);
        ig = uniqueById([...ig, ...instagramItems(response.media)]);
        fb = uniqueById([...fb, ...facebookItems(response.posts)]);
        const following = readCursor(response);
        if (following === next) throw new Error("Supabase returned the same pagination cursor.");
        next = following;
        setScannedCount(platform === "instagram" ? ig.length : fb.length);
      }
      setInstagramRows(ig); setFacebookRows(fb); setCursor(null);
      return { instagram: ig, facebook: fb };
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Historical scan failed.";
      setError(message); throw new Error(message);
    } finally { setLoadingMore(false); }
  }, [cursor, facebookRows, instagramRows, loading, loadingMore, platform]);

  const setPeriod = useCallback((from: string, to: string) => { setPeriodState({ from, to }); }, []);
  const value = useMemo<LiveContext>(() => ({
    platform, instagramRows, facebookRows, account, accountInsights, audience, page,
    history, allTimeTop, coverage, historyError, scannedCount,
    loading, loadingMore, error, hasNext: Boolean(cursor), updatedAt,
    period, setPeriod, loadMore, ensureLoaded, loadAllForCsv
  }), [platform, instagramRows, facebookRows, account, accountInsights, audience, page,
    history, allTimeTop, coverage, historyError, scannedCount,
    loading, loadingMore, error, cursor, updatedAt, period, setPeriod, loadMore, ensureLoaded, loadAllForCsv]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useMetaLive(): LiveContext {
  const value = useContext(Context);
  if (!value) throw new Error("Meta dashboard components must be inside MetaLiveProvider.");
  return value;
}
export function sumReported<T>(rows: T[], get: (row: T) => number | null | undefined): number | null {
  let found = false, total = 0;
  for (const row of rows) {
    const value = get(row);
    if (typeof value === "number" && Number.isFinite(value)) { total += value; found = true; }
  }
  return found ? total : null;
}
export function formatLiveNumber(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value)
    ? new Intl.NumberFormat("en-US").format(value) : "—";
}
export function formatLiveCompact(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value)
    ? new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value) : "—";
}
export function formatLiveEr(numerator: number | null | undefined, denominator: number | null | undefined): string {
  return typeof numerator === "number" && typeof denominator === "number" && denominator > 0
    ? `${((numerator / denominator) * 100).toFixed(2)}%` : "—";
}
