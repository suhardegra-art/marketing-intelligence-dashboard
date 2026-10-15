"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type MetaPlatform = "instagram" | "facebook";
export type InstagramLiveRow = {
  id: string;
  date: string;
  caption: string;
  type: "Reel" | "Post" | "Carousel";
  views: number | null;
  reach: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  permalink: string | null;
};
export type FacebookLiveRow = {
  id: string;
  date: string;
  title: string;
  type: "Reel" | "Video" | "Photo" | "Link" | "Post";
  reach: number | null;
  impressions: number | null; // Maps to media views, not deprecated impressions.
  reactions: number | null;
  comments: number | null;
  shares: number | null;
  clicks: number | null;
  permalink: string | null;
};
export type LiveAccount = {
  id: string;
  name?: string;
  username?: string;
  followers_count?: number;
  fan_count?: number;
  media_count?: number;
  followers?: number;
  link?: string;
};

type ApiResult = {
  ok: boolean;
  error?: string;
  account?: LiveAccount;
  accountInsights?: { data?: Array<Record<string, unknown>>; warning?: string };
  page?: LiveAccount;
  media?: Array<Record<string, any>>;
  posts?: Array<Record<string, any>>;
  paging?: { cursors?: { after?: string | null }; hasNext?: boolean } | null;
};

type LiveContext = {
  platform: MetaPlatform;
  instagramRows: InstagramLiveRow[];
  facebookRows: FacebookLiveRow[];
  account: LiveAccount | null;
  accountInsights: ApiResult["accountInsights"] | null;
  page: LiveAccount | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasNext: boolean;
  updatedAt: Date | null;
  period: { from: string; to: string };
  setPeriod: (from: string, to: string) => void;
  loadMore: () => Promise<void>;
  loadAllForCsv: () => Promise<{ instagram: InstagramLiveRow[]; facebook: FacebookLiveRow[] }>;
};

const Context = createContext<LiveContext | null>(null);
const PAGE_SIZE = 25;
const MAX_EXPORT_PAGES = 120;

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function readCursor(result: ApiResult): string | null {
  const cursor = result.paging?.hasNext ? result.paging.cursors?.after : null;
  return typeof cursor === "string" && cursor.length > 0 ? cursor : null;
}
function instagramItems(input: ApiResult["media"]): InstagramLiveRow[] {
  return (input || []).map((row) => {
    const metrics = row.insights || {};
    return {
      id: String(row.id),
      date: String(row.timestamp || "").slice(0, 10),
      caption: String(row.caption || "(No caption)"),
      type: row.media_product_type === "REELS" ? "Reel"
        : row.media_type === "CAROUSEL_ALBUM" ? "Carousel" : "Post",
      views: numberOrNull(metrics.views),
      reach: numberOrNull(metrics.reach),
      likes: numberOrNull(metrics.likes ?? row.like_count),
      comments: numberOrNull(metrics.comments ?? row.comments_count),
      shares: numberOrNull(metrics.shares),
      saves: numberOrNull(metrics.saves),
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
      id: String(row.id),
      date: String(row.created_time || "").slice(0, 10),
      title: String(row.message || "(No caption)"),
      type: link.includes("/reel/") ? "Reel"
        : link.includes("/videos/") ? "Video" : "Post",
      reach: null, // Meta deprecated legacy post reach in 2026; do not invent.
      impressions: numberOrNull(row.insights?.mediaViews), // Actually media views.
      reactions: numberOrNull(row.reactions) ?? breakdownTotal,
      comments: numberOrNull(row.comments),
      shares: numberOrNull(row.shares),
      clicks: numberOrNull(row.insights?.clicks),
      permalink: link || null
    };
  });
}
function uniqueById<T extends { id: string }>(rows: T[]): T[] {
  return Array.from(new Map(rows.map((row) => [row.id, row])).values());
}
async function fetchPage(platform: MetaPlatform, cursor?: string, signal?: AbortSignal): Promise<ApiResult> {
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
  const [page, setPage] = useState<LiveAccount | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [period, setPeriodState] = useState({ from: "", to: "" });

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchPage(platform, undefined, controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      setInstagramRows(instagramItems(result.media));
      setFacebookRows(facebookItems(result.posts));
      setAccount(result.account || null);
      setAccountInsights(result.accountInsights || null);
      setPage(result.page || null);
      setCursor(readCursor(result));
      setUpdatedAt(new Date());
    }).catch((cause) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Unable to fetch live analytics.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [platform]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore || loading) return;
    setLoadingMore(true);
    setError(null);
    try {
      const result = await fetchPage(platform, cursor);
      setInstagramRows((rows) => uniqueById([...rows, ...instagramItems(result.media)]));
      setFacebookRows((rows) => uniqueById([...rows, ...facebookItems(result.posts)]));
      setCursor(readCursor(result));
      setUpdatedAt(new Date());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to fetch older content.");
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loading, loadingMore, platform]);

  // All CSV fetches ALL available cursor pages. Never silently export an incomplete dataset.
  const loadAllForCsv = useCallback(async () => {
    if (loading) throw new Error("Please wait until the live data finishes loading.");
    setLoadingMore(true);
    setError(null);
    let allInstagram = [...instagramRows];
    let allFacebook = [...facebookRows];
    let next = cursor;
    let pages = 0;
    try {
      while (next) {
        if (++pages > MAX_EXPORT_PAGES) throw new Error("CSV safety limit reached. Export was cancelled rather than returning incomplete data.");
        const result = await fetchPage(platform, next);
        allInstagram = uniqueById([...allInstagram, ...instagramItems(result.media)]);
        allFacebook = uniqueById([...allFacebook, ...facebookItems(result.posts)]);
        const following = readCursor(result);
        if (following === next) throw new Error("Meta returned the same pagination cursor. Export cancelled.");
        next = following;
      }
      setInstagramRows(allInstagram);
      setFacebookRows(allFacebook);
      setCursor(null);
      setUpdatedAt(new Date());
      return { instagram: allInstagram, facebook: allFacebook };
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Unable to download all content.";
      setError(message);
      throw new Error(message);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, facebookRows, instagramRows, loading, platform]);

  const setPeriod = useCallback((from: string, to: string) => {
    setPeriodState({ from, to });
  }, []);
  const value = useMemo<LiveContext>(() => ({
    platform, instagramRows, facebookRows, account, accountInsights, page,
    loading, loadingMore, error, hasNext: Boolean(cursor), updatedAt,
    period, setPeriod, loadMore, loadAllForCsv
  }), [platform, instagramRows, facebookRows, account, accountInsights, page,
    loading, loadingMore, error, cursor, updatedAt, period, setPeriod, loadMore, loadAllForCsv]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useMetaLive(): LiveContext {
  const value = useContext(Context);
  if (!value) throw new Error("Meta dashboard components must be inside MetaLiveProvider.");
  return value;
}

export function sumReported<T>(rows: T[], get: (row: T) => number | null | undefined): number | null {
  let found = false;
  let total = 0;
  for (const row of rows) {
    const value = get(row);
    if (typeof value === "number" && Number.isFinite(value)) {
      total += value;
      found = true;
    }
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
