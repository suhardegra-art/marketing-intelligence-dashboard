"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  useMetaLive, formatLiveCompact, formatLiveNumber, formatLiveEr, sumReported,
  type MetaPlatform, type InstagramLiveRow, type FacebookLiveRow, type MetaSnapshot,
  type MetaAllTimeRow
} from "@/components/MetaLiveProvider";

type LiveRow = {
  id: string; date: string; caption: string; type: string; permalink: string | null;
  views: number | null; reach: number | null; likes: number | null;
  reactions: number | null; comments: number | null; shares: number | null;
  saves: number | null; clicks: number | null;
};
type Metric = "views" | "reach" | "interactions" | "likes" | "comments" | "shares" | "saves" | "clicks" | "er";
type WindowKey = "7D" | "1M" | "3M" | "6M" | "1Y";
type AudienceTab = "demographic" | "cities" | "countries";
const RANGES: Record<WindowKey, number> = { "7D": 7, "1M": 30, "3M": 90, "6M": 180, "1Y": 365 };
const PER_PAGE = 100;

function toRows(platform: MetaPlatform, ig: InstagramLiveRow[], fb: FacebookLiveRow[]): LiveRow[] {
  return platform === "instagram" ? ig.map((row) => ({
    id: row.id, date: row.date, caption: row.caption, type: row.type,
    permalink: row.permalink, views: row.views, reach: row.reach, likes: row.likes,
    reactions: row.likes, comments: row.comments, shares: row.shares, saves: row.saves, clicks: null
  })) : fb.map((row) => ({
    id: row.id, date: row.date, caption: row.title, type: row.type,
    permalink: row.permalink, views: row.impressions, reach: row.reach, likes: null,
    reactions: row.reactions, comments: row.comments, shares: row.shares, saves: null, clicks: row.clicks
  }));
}
function fromStored(row: MetaAllTimeRow): LiveRow {
  return { id: row.content_id, date: row.published_on || "", caption: row.caption || "(No caption)",
    type: row.content_type || "Post", permalink: row.permalink, views: row.media_views,
    reach: row.reach ?? row.unique_media_viewers, likes: row.likes, reactions: row.reactions ?? row.likes,
    comments: row.comments, shares: row.shares, saves: row.saves, clicks: row.clicks };
}
function engagement(row: LiveRow, platform: MetaPlatform): number | null {
  const metrics = platform === "instagram" ? [row.likes, row.comments, row.shares, row.saves]
    : [row.reactions, row.comments, row.shares];
  return sumReported(metrics, (v) => v);
}
function er(row: LiveRow, platform: MetaPlatform): number | null {
  const base = platform === "facebook" ? sumReported([engagement(row, platform), row.clicks], (x) => x)
    : engagement(row, platform);
  return base != null && row.views != null && row.views > 0 ? base / row.views * 100 : null;
}
function metricValue(row: LiveRow, metric: Metric, platform: MetaPlatform): number | null {
  return metric === "interactions" ? engagement(row, platform)
    : metric === "er" ? er(row, platform) : row[metric];
}
function cutoff(key: WindowKey) {
  // Explicit WIB boundary; browser/system locale must not shift the selected day.
  const nowWib = new Date(Date.now() + 7 * 60 * 60 * 1000);
  nowWib.setUTCDate(nowWib.getUTCDate() - (RANGES[key] - 1));
  return nowWib.toISOString().slice(0, 10);
}
function trendData(rows: LiveRow[], metric: Metric, platform: MetaPlatform, window: WindowKey) {
  const byDay = new Map<string, { total: number; count: number }>();
  rows.forEach((row) => {
    if (!row.date || row.date < cutoff(window)) return;
    const value = metricValue(row, metric, platform);
    if (value == null) return;
    const prev = byDay.get(row.date) || { total: 0, count: 0 };
    byDay.set(row.date, { total: prev.total + value, count: prev.count + 1 });
  });
  return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, value]) => ({
    date: day.slice(5).replace("-", "/"), value: metric === "er" ? value.total / value.count : value.total
  }));
}
function safeLink(url: string | null) { return url && /^https:\/\//.test(url) ? url : undefined; }
function label(metric: Metric, ig: boolean) {
  const base: Record<Metric, string> = { views: "Media Views", reach: ig ? "Reach" : "Unique Media Viewers",
    interactions: "Engagement", likes: "Likes", comments: "Comments", shares: "Shares", saves: "Saves",
    clicks: "Clicks", er: "Interaction Rate" };
  return base[metric];
}
function exportCsv(filename: string, headers: string[], rows: Array<Array<unknown>>) {
  const cell = (value: unknown) => {
    let text = value == null ? "" : String(value);
    if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  const csv = [headers, ...rows].map((line) => line.map(cell).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; document.body.appendChild(anchor);
  anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function sparkline(values: number[], color: string) {
  if (values.length < 2) return null;
  const max = Math.max(...values), min = Math.min(...values);
  const denom = max - min || 1;
  const points = values.map((v, i) => `${i / (values.length - 1) * 100},${92 - (v - min) / denom * 74}`).join(" ");
  return <svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={points} fill="none" stroke={color} strokeWidth="3" vectorEffect="non-scaling-stroke" /></svg>;
}
function snapshotNumber(v: number | null | undefined) { return typeof v === "number" && Number.isFinite(v) ? v : null; }
function snapshotPoints(rows: MetaSnapshot[], key: "followers" | "media_count" | "recent_media_views" | "recent_interactions" | "recent_posts_sample_count") {
  return rows.map((row) => snapshotNumber(row[key])).filter((x): x is number => x !== null);
}
function demographicRows(records: Array<Record<string, any>> | undefined) {
  const result: Array<{ name: string; value: number; share: number }> = [];
  if (!records) return result;
  for (const metric of records) {
    // Instagram Insights: total_value.breakdowns[].results[].dimension_values
    const breakdowns = metric?.total_value?.breakdowns;
    for (const breakdown of Array.isArray(breakdowns) ? breakdowns : []) {
      for (const row of Array.isArray(breakdown?.results) ? breakdown.results : []) {
        const name = Array.isArray(row.dimension_values) ? row.dimension_values.join(" · ") : "";
        if (name && typeof row.value === "number") result.push({ name, value: row.value, share: 0 });
      }
    }
    // Facebook Page Insights: values[].value is a map keyed by country/city/age.
    const values = Array.isArray(metric?.values) ? metric.values : [];
    const latest = values.length ? values[values.length - 1]?.value : null;
    if (latest && typeof latest === "object" && !Array.isArray(latest)) {
      for (const [name, value] of Object.entries(latest)) {
        if (typeof value === "number") result.push({ name, value, share: 0 });
      }
    }
  }
  const combined = new Map<string, number>();
  result.forEach(row => combined.set(row.name, (combined.get(row.name) || 0) + row.value));
  const total = [...combined.values()].reduce((a,b) => a+b, 0);
  return [...combined.entries()].map(([name,value]) => ({name,value,share:total>0?value/total*100:0}))
    .sort((a,b) => b.value-a.value).slice(0,10);
}

export default function MetaDashboardLive({ platform }: { platform: MetaPlatform }) {
  const live = useMetaLive();
  const ig = platform === "instagram";
  const p = ig ? "ig" : "fb";
  const theme = ig ? "#6d5cf5" : "#1877f2";
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [growthWindow, setGrowthWindow] = useState<WindowKey>("7D");
  const [trendWindow, setTrendWindow] = useState<WindowKey>("7D");
  const [contentWindow, setContentWindow] = useState<WindowKey>("7D");
  const [metric, setMetric] = useState<Metric>("views");
  const [contentMetric, setContentMetric] = useState<Metric>("views");
  const [audienceTab, setAudienceTab] = useState<AudienceTab>("demographic");
  const [csvMenu, setCsvMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [tablePage, setTablePage] = useState(1);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [syncingNow, setSyncingNow] = useState(false);
  const [syncNotice, setSyncNotice] = useState<{ status: "ok" | "error"; text: string } | null>(null);

  const allRows = useMemo(() => toRows(platform, live.instagramRows, live.facebookRows),
    [platform, live.instagramRows, live.facebookRows]);
  const filtered = useMemo(() => allRows.filter((row) => (!from || row.date >= from) && (!to || row.date <= to)), [allRows, from, to]);
  const tableRows = filtered.slice((tablePage - 1) * PER_PAGE, tablePage * PER_PAGE);
  const views = sumReported(filtered, (row) => row.views);
  const uniqueViewers = sumReported(filtered, (row) => row.reach);
  const interactions = sumReported(filtered, (row) => engagement(row, platform));
  const clicks = sumReported(filtered, (row) => row.clicks);
  const likes = sumReported(filtered, (row) => ig ? row.likes : row.reactions);
  const comments = sumReported(filtered, (row) => row.comments);
  const shares = sumReported(filtered, (row) => row.shares);
  const saves = sumReported(filtered, (row) => row.saves);
  const currentFollowers = ig ? live.account?.followers_count : (live.page?.followers_count ?? live.page?.fan_count);
  const title = ig ? (live.account?.name || "Indomobil eMotor") : (live.page?.name || "IM Indomobil");
  const engagementRate = formatLiveEr(sumReported([interactions, ig ? null : clicks], (n) => n), views);
  const supportedUnique = allRows.some((row) => row.reach !== null);
  const cards = ig ? [
    ["Followers (Current)", formatLiveNumber(currentFollowers)], ["Loaded Content", formatLiveNumber(filtered.length)],
    ["Content Views", formatLiveCompact(views)], ["Content Reach", formatLiveCompact(uniqueViewers)],
    ["Content Interactions", formatLiveCompact(interactions)], ["Saves", formatLiveCompact(saves)],
    ["Shares", formatLiveCompact(shares)], ["Interaction Rate", engagementRate]
  ] : [
    ["Followers (Current)", formatLiveNumber(currentFollowers)], ["Media Views", formatLiveCompact(views)],
    [supportedUnique ? "Unique Media Viewers" : "Interaction Rate", supportedUnique ? formatLiveCompact(uniqueViewers) : engagementRate],
    ["Post Engagement", formatLiveCompact(interactions)], ["Post Clicks", formatLiveCompact(clicks)],
    ["Comments", formatLiveCompact(comments)], ["Shares", formatLiveCompact(shares)],
    ["Loaded Posts", formatLiveNumber(filtered.length)]
  ];
  const metrics: Metric[] = ig ? ["views", "reach", "interactions", "likes", "comments", "shares", "saves", "er"]
    : supportedUnique ? ["views", "reach", "interactions", "comments", "shares", "clicks", "er"]
      : ["views", "interactions", "comments", "shares", "clicks", "er"];
  const activeMetric = metrics.includes(metric) ? metric : "views";
  const activeContentMetric = metrics.includes(contentMetric) ? contentMetric : "views";
  const chartMain = useMemo(() => trendData(filtered, activeMetric, platform, trendWindow), [filtered, activeMetric, platform, trendWindow]);
  const chartContent = useMemo(() => trendData(filtered, activeContentMetric, platform, contentWindow), [filtered, activeContentMetric, platform, contentWindow]);

  // Cache-ranked posts (from daily backfill) + currently loaded live posts.
  // Ranking is labelled complete only if the catalog or browser scan is complete.
  const allTimeTop = useMemo(() => {
    const dedup = new Map<string, LiveRow>();
    live.allTimeTop.forEach((row) => dedup.set(row.content_id, fromStored(row)));
    allRows.forEach((row) => dedup.set(row.id, row));
    return [...dedup.values()].filter((row) => row.views != null)
      .sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 5);
  }, [live.allTimeTop, allRows]);
  // Finishing all rows currently STORED in Supabase does not imply Graph backfill complete.
  const historyComplete = Boolean(live.coverage?.complete);

  const snapshots = live.history.filter((row) => row.snapshot_date >= cutoff(growthWindow));
  const followerPoints = snapshotPoints(snapshots, "followers");
  const latest = snapshots.length ? snapshots[snapshots.length - 1] : null;
  const latestFollowerChange = followerPoints.length >= 2 ? followerPoints[followerPoints.length - 1] - followerPoints[0] : null;
  const fallbackRecent = allRows.slice(0, 25);
  const latestSampleViews = sumReported(fallbackRecent, (row) => row.views);
  const latestSampleInteractions = sumReported(fallbackRecent, (row) => engagement(row, platform));
  const growthCards = [
    { title: "Follower Growth", value: latestFollowerChange == null ? "—" : `${latestFollowerChange > 0 ? "+" : ""}${formatLiveNumber(latestFollowerChange)}`, points: followerPoints },
    { title: "Followers Snapshot", value: formatLiveNumber(latest?.followers ?? currentFollowers), points: followerPoints },
    { title: "Recent 25 Media Views", value: formatLiveCompact(latest?.recent_media_views ?? latestSampleViews), points: snapshotPoints(snapshots, "recent_media_views") },
    { title: "Recent 25 Interactions", value: formatLiveCompact(latest?.recent_interactions ?? latestSampleInteractions), points: snapshotPoints(snapshots, "recent_interactions") },
    { title: "Posts Monitored", value: formatLiveNumber(latest?.recent_posts_sample_count ?? fallbackRecent.length), points: snapshotPoints(snapshots, "recent_posts_sample_count") }
  ];
  const historyNote = live.historyError ? "History setup pending: verify Supabase SQL migration and server variables."
    : live.coverage?.lastError ? "Historical scan had an error; check Vercel cron logs. Existing snapshots remain readable."
      : !live.history.length ? "First historical snapshot will be saved at the next successful 08:00 WIB sync."
        : `Stored daily snapshots: ${live.history.length}. Last snapshot: ${live.history[live.history.length - 1].snapshot_date} (WIB).`;

  const typeNames = ig ? ["Reel", "Post", "Carousel", "Story"] : ["Reel", "Video", "Photo", "Link", "Post"];
  const palette = ig ? ["#6d5cf5", "#d14fba", "#f59c55", "#a48aff"] : ["#1877f2", "#59a4ff", "#8bc2ff", "#b7d9ff", "#c4a8ef"];
  const formatGroups = typeNames.map((type) => ({
    label: type,
    count: filtered.filter((row) => row.type === type).length,
    views: sumReported(filtered.filter((row) => row.type === type), (row) => row.views) ?? 0
  }));
  const totalViewsByType = formatGroups.reduce((sum, row) => sum + row.views, 0);
  let cursorPercent = 0;
  const donut = totalViewsByType > 0 ? `conic-gradient(${formatGroups.map((row, index) => {
    const start = cursorPercent;
    cursorPercent += row.views / totalViewsByType * 100;
    return `${palette[index]} ${start}% ${cursorPercent}%`;
  }).join(",")})` : "#eef0f6";
  const interactionGroups: Array<[string, number | null]> = ig ? [
    ["Likes", likes], ["Comments", comments], ["Shares", shares], ["Saves", saves]
  ] : [
    ["Reactions", likes], ["Comments", comments], ["Shares", shares], ["Clicks", clicks]
  ];
  const engagementSum = sumReported(interactionGroups, (row) => row[1]) ?? 0;
  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekdayCounts = weekdayNames.map((name, day) => ({
    name, value: filtered.filter((row) => row.date && new Date(`${row.date}T00:00:00Z`).getUTCDay() === day).length
  }));
  const audienceField = (tab: AudienceTab) => tab === "demographic" ? (ig ? "age" : "gender_age")
    : tab === "cities" ? "city" : "country";
  const demographics = demographicRows(live.audience?.[audienceField(audienceTab)]);
  const genderRows = ig && audienceTab === "demographic" ? demographicRows(live.audience?.gender) : [];
  const hasRealDemo = demographics.length > 0 || genderRows.length > 0;

  const dateDescription = from || to ? `${from || "Start"} – ${to || "Latest"}` : "All loaded publish dates";
  const disabled = live.loading || live.loadingMore || exporting;
  const rowMetrics = (row: LiveRow) => ig ? [row.views, row.reach, row.likes, row.comments, row.shares, row.saves]
    : [row.views, supportedUnique ? row.reach : engagement(row, platform), row.reactions, row.comments, row.shares, row.clicks];
  const percent = (value: number | null, total: number) => typeof value === "number" && total > 0 ? `${(value / total * 100).toFixed(1)}%` : "—";

  const chart = (data: Array<{ date: string; value: number }>, color: string, chosen: Metric) => (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {!data.length && <p style={{ position: "absolute", top: "46%", width: "100%", textAlign: "center", color: "#8791a7", fontSize: 12 }}>No reported metrics for {label(chosen, ig)} in this date window.</p>}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e9edf5" />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#8b93a7", fontSize: 10 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8b93a7", fontSize: 10 }} width={52} tickFormatter={(value: number) => formatLiveCompact(value)} />
          <Tooltip formatter={(value: number | string) => [chosen === "er" ? `${Number(value).toFixed(2)}%` : formatLiveNumber(Number(value)), label(chosen, ig)]}
            contentStyle={{ border: "1px solid #e1e6ef", borderRadius: 10, fontSize: 11 }} />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={data.length <= 3 ? { r: 4 } : false} activeDot={{ r: 4 }} isAnimationActive />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  const csvHeaders = ["Date", "Content", "Type", "Media Views", ig ? "Reach" : supportedUnique ? "Unique Media Viewers" : "Post Engagement",
    ig ? "Likes" : "Reactions", "Comments", "Shares", ig ? "Saves" : "Clicks", "Interaction Rate %", "Permalink"];
  const csvRows = (rows: LiveRow[]) => rows.map((row) => [row.date, row.caption, row.type, ...rowMetrics(row),
    er(row, platform) == null ? null : `${er(row, platform)!.toFixed(2)}%`, row.permalink]);
  async function downloadCsv(mode: "all" | "filtered") {
    setCsvMenu(false); setCsvError(null); setExporting(true);
    try {
      const everything = await live.loadAllForCsv();
      const all = toRows(platform, everything.instagram, everything.facebook);
      const target = mode === "filtered" ? all.filter((row) => (!from || row.date >= from) && (!to || row.date <= to)) : all;
      exportCsv(`${platform}-content-${mode === "all" ? "all" : `filtered-${from || "start"}-to-${to || "latest"}`}.csv`, csvHeaders, csvRows(target));
    } catch (cause) { setCsvError(cause instanceof Error ? cause.message : "CSV export failed."); }
    finally { setExporting(false); }
  }
  async function nextPage() {
    if (disabled) return;
    const target = tablePage + 1;
    if (filtered.length > (target - 1) * PER_PAGE) { setTablePage(target); return; }
    if (!live.hasNext) return;
    if (from || to) {
      // Sparse historical filters require a complete cursor scan to avoid false empty pages.
      try {
        const scanned = await live.loadAllForCsv();
        const scannedRows = toRows(platform, scanned.instagram, scanned.facebook);
        const matchedCount = scannedRows.filter((row) => (!from || row.date >= from) && (!to || row.date <= to)).length;
        if (matchedCount > (target - 1) * PER_PAGE) setTablePage(target);
      } catch (cause) { setCsvError(cause instanceof Error ? cause.message : "Unable to load historical posts."); }
    } else {
      const loaded = await live.ensureLoaded(target * PER_PAGE);
      if (loaded) setTablePage(target);
    }
  }
  async function scanHistory() {
    if (disabled) return;
    setCsvError(null);
    try { await live.loadAllForCsv(); }
    catch (cause) { setCsvError(cause instanceof Error ? cause.message : "Unable to load all stored posts."); }
  }
  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const canNext = tablePage < pageCount || live.hasNext;
  const firstRow = filtered.length ? (tablePage - 1) * PER_PAGE + 1 : 0;
  const lastRow = Math.min(tablePage * PER_PAGE, filtered.length);
  const showPages = Array.from({ length: Math.min(7, pageCount + (live.hasNext ? 1 : 0)) }, (_, index) => index + Math.max(1, tablePage - 3))
    .filter((value) => value <= pageCount + (live.hasNext ? 1 : 0));

  async function resyncNow() {
    if (syncingNow || live.loading) return;
    setSyncingNow(true);
    setSyncNotice(null);
    try {
      const response = await fetch("/api/meta/manual-sync", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform })
      });
      const result = await response.json().catch(() => null) as {
        ok?: boolean; partial?: boolean; posts?: number; pages?: number; error?: string;
      } | null;
      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || `Sync request failed (HTTP ${response.status}).`);
      }
      // The dashboard only reads Supabase. Re-query it after the server finishes writing.
      live.refreshDashboard();
      setSyncNotice({
        status: "ok",
        text: `Supabase updated: ${result.posts ?? 0} content records processed for ${platform}.${result.partial ? " Some optional metrics could not be retrieved." : ""} Historical backfill continues with future syncs.`
      });
    } catch (error) {
      setSyncNotice({
        status: "error",
        text: error instanceof Error ? error.message : "Manual sync failed. Check Vercel Function Logs."
      });
    } finally {
      setSyncingNow(false);
    }
  }

  return (
    <main className={`${p}-main`}>
      <header className={`${p}-topbar`}>
        <div><h1>{ig ? "Instagram" : "Facebook"} Performance</h1><p>Stored organic insights served from Supabase. Meta is accessed only during Vercel sync.</p></div>
        <div className={`${p}-top-actions`} style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button
            type="button"
            title={`Sync ${ig ? "Instagram" : "Facebook"} Insights to Supabase now`}
            onClick={() => void resyncNow()}
            disabled={syncingNow || live.loading}
            aria-busy={syncingNow}
            style={{
              minHeight: 39, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
              padding: "0 14px", border: "none", borderRadius: 10,
              color: "white", backgroundColor: theme, fontWeight: 800, fontSize: 11,
              cursor: syncingNow || live.loading ? "wait" : "pointer",
              opacity: syncingNow || live.loading ? 0.72 : 1,
              boxShadow: "0 5px 13px rgba(40,48,96,.12)", whiteSpace: "nowrap"
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 17, lineHeight: 1 }}>↻</span>
            {syncingNow ? "Syncing to Supabase…" : "Resync Now"}
          </button>
          <div className={`${p}-status-pill`}>
            <span>{live.loading ? "CONNECTING" : live.error ? "API ERROR" : "SUPABASE DATA"}</span>
            <strong>{live.loading ? "Loading..." : live.error || `Last synced ${live.updatedAt ? live.updatedAt.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) + " WIB" : "pending"}`}</strong>
          </div>
          <div className={`${p}-avatar`}>{ig ? "IG" : "f"}</div>
        </div>
      </header>
      {syncNotice && (
        <div
          role={syncNotice.status === "error" ? "alert" : "status"}
          style={{
            marginBottom: 14, padding: "10px 14px", borderRadius: 10, fontSize: 12,
            border: `1px solid ${syncNotice.status === "error" ? "#f3b7bd" : "#b6dccc"}`,
            background: syncNotice.status === "error" ? "#fff4f4" : "#f1faf5",
            color: syncNotice.status === "error" ? "#a12836" : "#187647"
          }}
        >{syncNotice.text}</div>
      )}
      <section className={`${p}-banner`}>
        <div className={`${p}-banner-copy`}><p>{ig ? "INSTAGRAM PROFESSIONAL ACCOUNT" : "FACEBOOK BUSINESS PAGE"}</p>
          <h2>{title}</h2><span>{ig ? "@im.indomobil · " : ""}Organic Performance &amp; Content Intelligence</span></div>
        <div className={`${p}-banner-stats`}>
          <div><span>Followers</span><strong>{formatLiveNumber(currentFollowers)}</strong></div>
          <div><span>Media Views</span><strong>{formatLiveCompact(views)}</strong></div>
          <div><span>Interactions</span><strong>{formatLiveCompact(interactions)}</strong></div>
        </div>
        <button type="button" onClick={() => window.open(ig ? "https://www.instagram.com/im.indomobil/" : (live.page?.link || "https://www.facebook.com/559714640555920"), "_blank", "noopener,noreferrer")}>Open {ig ? "Instagram" : "Facebook"} ↗</button>
      </section>
      <section className={`${p}-panel ${p}-filter`}>
        <label><span>FROM DATE</span><input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label>
        <label><span>TO DATE</span><input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /></label>
        <button type="button" className="primary" onClick={() => {
          if (fromDate && toDate && fromDate > toDate) { setCsvError("From Date cannot exceed To Date."); return; }
          setFrom(fromDate); setTo(toDate); setTablePage(1); setCsvError(null); live.setPeriod(fromDate, toDate);
        }}>Apply Period</button>
        <button type="button" className="soft" onClick={() => {
          setFromDate(""); setToDate(""); setFrom(""); setTo(""); setTablePage(1); live.setPeriod("", ""); setCsvError(null);
        }}>Reset</button>
        <div className={`${p}-filter-meta`}>Selected content period: <strong>{dateDescription}</strong>
          <span>Metrics reflect loaded content; scan all history for complete historical date filters.</span></div>
      </section>
      <section className={`${p}-summary-grid`}>{cards.map(([key, value]) => <article key={key} className={`${p}-kpi`}><p>{key}</p><strong>{value}</strong></article>)}</section>

      <section className={`${p}-panel`}>
        <div className={`${p}-section-head`}><div><h2>{ig ? "Instagram" : "Facebook"} Growth</h2><p>{historyNote} Recent media metrics cover the latest 25 posts, not full account-wide daily traffic.</p></div>
          <div className={`${p}-range`}>{(Object.keys(RANGES) as WindowKey[]).map((key) => <button key={key} type="button" className={growthWindow === key ? "active" : ""} onClick={() => setGrowthWindow(key)}>{key}</button>)}</div></div>
        <div className={`${p}-growth-grid`}>{growthCards.map((card) => <article className={`${p}-growth-card`} key={card.title}>
          <p>{card.title}</p><strong>{card.value}</strong>
          {sparkline(card.points, theme) || <div style={{ minHeight: 110, marginTop: 10, color: "#9aa2b7", fontSize: 10, display: "grid", placeItems: "center" }}>{snapshots.length < 2 ? "First/second snapshot pending" : "Metric unavailable"}</div>}
        </article>)}</div>
      </section>

      <section className={`${p}-performance-grid`}>
        <article className={`${p}-panel`}>
          <div className={`${p}-section-head`}><div><h2>Performance Trend</h2><p>Published-post metrics · selected {trendWindow} window (not daily visitor traffic).</p></div>
            <div className={`${p}-range`}>{(Object.keys(RANGES) as WindowKey[]).map((key) => <button key={key} type="button" className={trendWindow === key ? "active" : ""} onClick={() => setTrendWindow(key)}>{key}</button>)}</div></div>
          <div className={`${p}-metric-tabs`}>{metrics.map((key) => <button key={key} type="button" className={activeMetric === key ? "active" : ""} onClick={() => setMetric(key)}>{label(key, ig)}</button>)}</div>
          <div className={`${p}-main-chart`}>{chart(chartMain, theme, activeMetric)}</div>
        </article>
        <article className={`${p}-panel ${p}-performance-summary`}>
          <div className={`${p}-section-head`}><div><h2>Content Activity</h2><p>Reported results for posts in the selected period.</p></div></div>
          {(ig ? [
            ["Media Views", views], ["Reach (Post Sum)", uniqueViewers], ["Likes", likes], ["Comments", comments], ["Shares", shares], ["Saves", saves]
          ] : [
            ["Media Views", views], [supportedUnique ? "Unique Media Viewers*" : "Reported Reactions", supportedUnique ? uniqueViewers : likes],
            ["Post Engagement", interactions], ["Post Clicks", clicks], ["Comments", comments], ["Shares", shares]
          ]).map(([key, value]) => <div className={`${p}-activity-row`} key={String(key)}><div><span>{key}</span><strong>{formatLiveCompact(value as number | null)}</strong></div></div>)}
          {!ig && supportedUnique && <p style={{ color: "#8a92a8", fontSize: 10 }}>* Summed unique viewers per post; not account-level unique reach.</p>}
        </article>
      </section>

      <section className={`${p}-two-column`}>
        <article className={`${p}-panel`}>
          <div className={`${p}-section-head`}><div><h2>{hasRealDemo ? "Audience" : "Content & Engagement"}</h2><p>{hasRealDemo ? "Stored audience demographics returned by Meta, when supported." : "Observed content data instead of unavailable audience demographics."}</p></div></div>
          <div className={`${p}-audience-tabs`}>{(["demographic", "cities", "countries"] as AudienceTab[]).map((key) => <button key={key} type="button" className={audienceTab === key ? "active" : ""} onClick={() => setAudienceTab(key)}>{demographicRows(live.audience?.[audienceField(key)]).length ?
            (key === "demographic" ? "Age & Gender" : key === "cities" ? "Top Cities" : "Top Countries") :
            (key === "demographic" ? "Format Mix" : key === "cities" ? "Interactions" : "Posting Days")}</button>)}</div>
          {hasRealDemo ? <div>
            {audienceTab === "demographic" && demographics.length > 0 && <p style={{ fontSize: 11, fontWeight: 800, color: "#59657a" }}>Age Breakdown</p>}
            <div className={`${p}-location-list`}>{demographics.map((row) => {
              const pct = row.share;
              return <div key={row.name} style={{ gridTemplateColumns: "minmax(100px, 1.2fr) minmax(90px, 2fr) 80px" }}><span>{row.name}</span><div><i style={{ width: `${pct}%` }} /></div><strong>{pct.toFixed(1)}%</strong></div>;
            })}</div>
            {audienceTab === "demographic" && genderRows.length > 0 && <>
              <p style={{ fontSize: 11, fontWeight: 800, marginTop: 16, color: "#59657a" }}>Gender Breakdown</p>
              <div className={`${p}-location-list`}>{genderRows.map((row) => <div key={row.name} style={{ gridTemplateColumns: "minmax(100px, 1.2fr) minmax(90px, 2fr) 80px" }}>
                <span>{row.name}</span><div><i style={{ width: `${row.share}%` }} /></div><strong>{row.share.toFixed(1)}%</strong>
              </div>)}</div>
            </>}
          </div> : <div className={`${p}-location-list`}>
            {(audienceTab === "demographic" ? formatGroups.map((row) => ({ name: row.label, value: row.count }))
              : audienceTab === "cities" ? interactionGroups.filter(([, value]) => value !== null).map(([name, value]) => ({ name, value: value as number }))
              : weekdayCounts).map((row) => {
              const pool = audienceTab === "demographic" ? filtered.length : audienceTab === "cities" ? engagementSum : filtered.length;
              const pct = pool ? row.value / pool * 100 : 0;
              return <div key={row.name} style={{ gridTemplateColumns: "minmax(100px, 1.2fr) minmax(90px, 2fr) 100px" }}><span>{row.name}</span><div><i style={{ width: `${pct}%` }} /></div><strong>{formatLiveNumber(row.value)} ({pct.toFixed(1)}%)</strong></div>;
            })}
          </div>}
        </article>
        <article className={`${p}-panel`}>
          <div className={`${p}-section-head`}><div><h2>Media Views by Content Type</h2><p>Distribution of reported media views among loaded posts.</p></div></div>
          <div className={`${p}-content-type-layout`}><div className={`${p}-donut`} style={{ background: donut }}>
            <div><strong>{formatLiveCompact(totalViewsByType || null)}</strong><span>Reported Views</span></div></div>
            <div className={`${p}-type-legend`}>{formatGroups.map((row, index) => <div key={row.label}>
              <i className={`c${Math.min(index + 1, 4)}`} style={{ background: palette[index] }} /><span>{row.label}</span>
              <strong>{percent(row.views, totalViewsByType)}</strong></div>)}</div></div>
          <div className={`${p}-reach-mix`}><h3>Coverage</h3><p style={{ color: "#8b93a7", fontSize: 11 }}>
            Loaded {allRows.length} posts. {live.coverage ? `${live.coverage.scanned} historical posts stored in Supabase. Remote backfill: ${live.coverage.complete ? "complete for supported sources" : "in progress"}.` : "Stored historical catalog not connected."}
          </p></div>
        </article>
      </section>

      <section className={`${p}-panel`}>
        <div className={`${p}-section-head`}><div><h2>{ig ? "Instagram" : "Facebook"} Content Performance Trend</h2><p>Post metrics grouped by publish date; default last 7 days.</p></div>
          <div className={`${p}-range`}>{(Object.keys(RANGES) as WindowKey[]).map((key) => <button key={key} type="button" className={contentWindow === key ? "active" : ""} onClick={() => setContentWindow(key)}>{key}</button>)}</div></div>
        <div className={`${p}-metric-tabs`}>{metrics.map((key) => <button key={key} type="button" className={activeContentMetric === key ? "active" : ""} onClick={() => setContentMetric(key)}>{label(key, ig)}</button>)}</div>
        <div className={`${p}-main-chart trend`}>{chart(chartContent, theme, activeContentMetric)}</div>
      </section>

      <section className={`${p}-panel ${p}-ai-card`}>
        <div className={`${p}-section-head`}><div><p className={`${p}-ai-label`}>CONTENT INTELLIGENCE</p><h2>Measured Content Summary</h2><p>Real calculations from loaded Meta data; AI-generated narratives are not enabled yet.</p></div></div>
        <div className={`${p}-ai-kpis`}>
          <div><span>LOADED POSTS</span><strong>{filtered.length}</strong></div>
          <div><span>MEDIA VIEWS</span><strong>{formatLiveCompact(views)}</strong></div>
          <div><span>INTERACTIONS</span><strong>{formatLiveCompact(interactions)}</strong></div>
          <div><span>INTERACTION RATE</span><strong>{engagementRate}</strong></div>
        </div>
        <div className={`${p}-ai-preview`}><div><span>DATA QUALITY</span><p>Unavailable metrics are not zero. Facebook Unique Media Viewers is an alternative to legacy reach, but is not the same metric. View trends are grouped by publication date, not daily impressions. All-time Top Content is marked complete only once all accessible pages have been scanned.</p></div>
          <article className="working"><h3>Highest Observed Views</h3><ul><li>{allTimeTop[0]?.caption || "No posts with reported views yet."}</li></ul></article>
          <article className="attention"><h3>Historical Data</h3><ul><li>{historyNote}</li></ul></article>
        </div>
      </section>

      <section className={`${p}-panel`}>
        <div className={`${p}-section-head`}><div><h2>Top Content — All-Time Views</h2><p>
          {historyComplete ? "Top five stored posts by reported views; Meta historical coverage is complete." :
            `Meta-to-Supabase historical ingestion is in progress. ${Math.max(live.coverage?.scanned ?? 0, live.scannedCount)} posts currently indexed or loaded; ranking is provisional.`}
        </p></div>
          {!historyComplete && <button type="button" className={`${p}-download`} onClick={() => void scanHistory()} disabled={disabled}>
            {live.loadingMore ? `Loading ${live.scannedCount} stored posts…` : "Load All Stored Content"}
          </button>}
        </div>
        {(live.error || csvError) && <p role="alert" style={{ fontSize: 11, color: "#bd2b45" }}>{live.error || csvError}</p>}
        <div className={`${p}-table-wrap`}><table className={`${p}-table`}>
          <thead><tr><th>#</th><th>CONTENT</th><th>TYPE</th><th>PUBLISH DATE</th><th>MEDIA VIEWS</th><th>{ig ? "REACH" : supportedUnique ? "UNIQUE VIEWERS" : "ENGAGEMENT"}</th><th>{ig ? "LIKES" : "REACTIONS"}</th><th>COMMENTS</th><th>SHARES</th><th>ER</th><th>LINK</th></tr></thead>
          <tbody>{allTimeTop.map((row, index) => <tr key={row.id}>
            <td>{index + 1}</td><td className="title">{row.caption}</td><td><span className={`${p}-badge ${row.type.toLowerCase()}`}>{row.type}</span></td><td>{row.date}</td>
            {[row.views, ig || supportedUnique ? row.reach : engagement(row, platform), ig ? row.likes : row.reactions, row.comments, row.shares].map((value, i) => <td key={i}>{formatLiveNumber(value)}</td>)}
            <td>{er(row, platform) == null ? "—" : `${er(row, platform)!.toFixed(2)}%`}</td>
            <td>{safeLink(row.permalink) ? <a href={safeLink(row.permalink)} target="_blank" rel="noopener noreferrer">Open ↗</a> : "—"}</td>
          </tr>)}</tbody>
        </table></div>
      </section>

      <section className={`${p}-panel`}>
        <div className={`${p}-section-head`}><div><h2>{ig ? "Instagram" : "Facebook"} Content</h2>
          <p>{filtered.length} matching of {allRows.length} loaded posts • 100 rows/page • {live.hasNext ? "More saved content available" : "All currently stored content loaded"}</p></div>
          <div style={{ position: "relative" }}>
            <button type="button" className={`${p}-download`} disabled={disabled} onClick={() => setCsvMenu((open) => !open)}>{exporting ? "Exporting..." : "↓ Download CSV ▾"}</button>
            {csvMenu && <div role="menu" style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 20, minWidth: 240, background: "#fff", border: "1px solid #e1e6ef", borderRadius: 12, boxShadow: "0 8px 26px #21315a33", padding: 8 }}>
              <button type="button" role="menuitem" onClick={() => void downloadCsv("filtered")} style={{ padding: 12, width: "100%", border: 0, background: "white", textAlign: "left", cursor: "pointer" }}>Download Filtered by Date CSV</button>
              <button type="button" role="menuitem" onClick={() => void downloadCsv("all")} style={{ padding: 12, width: "100%", border: 0, background: "white", textAlign: "left", cursor: "pointer" }}>Download All CSV</button>
            </div>}
          </div>
        </div>
        {(csvError || live.error) && <p role="alert" style={{ color: "#bd2b45", fontSize: 12 }}>{csvError || live.error}</p>}
        <div className={`${p}-table-wrap`}><table className={`${p}-table content`}>
          <thead><tr><th>#</th><th>DATE</th><th>CONTENT</th><th>TYPE</th><th>MEDIA VIEWS</th><th>{ig ? "REACH" : supportedUnique ? "UNIQUE VIEWERS" : "ENGAGEMENT"}</th><th>{ig ? "LIKES" : "REACTIONS"}</th><th>COMMENTS</th><th>SHARES</th><th>{ig ? "SAVES" : "CLICKS"}</th><th>ER</th><th>LINK</th></tr></thead>
          <tbody>{tableRows.map((row, index) => <tr key={row.id}>
            <td>{(tablePage - 1) * PER_PAGE + index + 1}</td><td>{row.date}</td><td className="title">{row.caption}</td>
            <td><span className={`${p}-badge ${row.type.toLowerCase()}`}>{row.type}</span></td>
            {rowMetrics(row).map((value, i) => <td key={i}>{formatLiveNumber(value)}</td>)}
            <td>{er(row, platform) == null ? "—" : `${er(row, platform)!.toFixed(2)}%`}</td>
            <td>{safeLink(row.permalink) ? <a href={safeLink(row.permalink)} target="_blank" rel="noopener noreferrer">Open ↗</a> : "—"}</td>
          </tr>)}</tbody>
        </table></div>
        <div className={`${p}-table-foot`} style={{ alignItems: "center", flexWrap: "wrap" }}>
          <span>Showing <strong>{firstRow}–{lastRow}</strong> of {filtered.length} currently loaded posts • 100/page</span>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            <button type="button" disabled={disabled || tablePage === 1} onClick={() => setTablePage((p) => Math.max(1, p - 1))} style={{ padding: "9px 13px", borderRadius: 24, border: "1px solid #d9e0ee", background: "white", cursor: "pointer" }}>‹</button>
            {showPages.map((num) => <button key={num} type="button" disabled={disabled || num > pageCount + 1}
              onClick={() => { if (num <= pageCount) setTablePage(num); else void nextPage(); }}
              style={{ width: 35, height: 35, borderRadius: 18, border: "1px solid #d9e0ee", background: num === tablePage ? theme : "white", color: num === tablePage ? "white" : "#56627a", cursor: "pointer", fontWeight: 800 }}>{num}</button>)}
            <button type="button" disabled={disabled || !canNext} onClick={() => void nextPage()}
              style={{ padding: "9px 13px", borderRadius: 24, border: "1px solid #d9e0ee", background: "white", cursor: "pointer" }}>›</button>
          </div>
        </div>
        {live.loadingMore && <p style={{ color: "#8791a7", fontSize: 11 }}>Loading more stored Supabase posts… {live.scannedCount} records scanned.</p>}
      </section>
      <footer className={`${p}-footer`}>{ig ? "Instagram" : "Facebook"} Analytics Dashboard • Supabase-first data • Daily sync at 08:00 WIB, background historical backfill every hour.</footer>
    </main>
  );
}
