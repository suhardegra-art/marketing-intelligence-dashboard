"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import {
  useMetaLive, formatLiveCompact, formatLiveNumber, formatLiveEr, sumReported,
  type MetaPlatform, type InstagramLiveRow, type FacebookLiveRow
} from "@/components/MetaLiveProvider";

type LiveRow = {
  id: string; date: string; caption: string; type: string; permalink: string | null;
  views: number | null; reach: number | null; likes: number | null;
  reactions: number | null; comments: number | null; shares: number | null;
  saves: number | null; clicks: number | null;
};
type ChartMetric = "views" | "reach" | "interactions" | "likes" | "comments" | "shares" | "saves" | "clicks" | "er";
type WindowKey = "7D" | "1M" | "3M" | "6M" | "1Y";
type AudienceTab = "demographic" | "cities" | "countries";
const RANGES: Record<WindowKey, number> = { "7D": 7, "1M": 30, "3M": 90, "6M": 180, "1Y": 365 };
const LABELS: Record<ChartMetric, string> = {
  views: "Media Views", reach: "Reach", interactions: "Engagement", likes: "Likes",
  comments: "Comments", shares: "Shares", saves: "Saves", clicks: "Clicks", er: "ER"
};

function toLiveRows(platform: MetaPlatform, ig: InstagramLiveRow[], fb: FacebookLiveRow[]): LiveRow[] {
  return platform === "instagram"
    ? ig.map((row) => ({
        id: row.id, date: row.date, caption: row.caption, type: row.type,
        permalink: row.permalink, views: row.views, reach: row.reach,
        likes: row.likes, reactions: row.likes, comments: row.comments,
        shares: row.shares, saves: row.saves, clicks: null
      }))
    : fb.map((row) => ({
        id: row.id, date: row.date, caption: row.title, type: row.type,
        permalink: row.permalink, views: row.impressions, reach: row.reach,
        likes: null, reactions: row.reactions, comments: row.comments,
        shares: row.shares, saves: null, clicks: row.clicks
      }));
}
function engagement(row: LiveRow, platform: MetaPlatform): number | null {
  const metrics = platform === "instagram"
    ? [row.likes, row.comments, row.shares, row.saves]
    : [row.reactions, row.comments, row.shares];
  return sumReported(metrics, (metric) => metric);
}
function er(row: LiveRow, platform: MetaPlatform): number | null {
  const interactions = platform === "facebook"
    ? sumReported([row.reactions, row.comments, row.shares, row.clicks], (n) => n)
    : engagement(row, platform);
  return interactions != null && row.views != null && row.views > 0
    ? (interactions / row.views) * 100 : null;
}
function metricValue(row: LiveRow, metric: ChartMetric, platform: MetaPlatform) {
  if (metric === "er") return er(row, platform);
  if (metric === "interactions") return engagement(row, platform);
  return row[metric];
}
function cutoff(range: WindowKey): string {
  return new Date(Date.now() - RANGES[range] * 86400000).toISOString().slice(0, 10);
}
function exportCsv(filename: string, headers: string[], data: Array<Array<unknown>>) {
  const safe = (value: unknown) => {
    let text = value == null ? "" : String(value);
    if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`; // CSV formula injection protection.
    return `"${text.replace(/"/g, '""')}"`;
  };
  const csv = [headers, ...data].map((values) => values.map(safe).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function chartRows(rows: LiveRow[], metric: ChartMetric, platform: MetaPlatform, days: WindowKey) {
  const grouped = new Map<string, number | null>();
  const sampleCounts = new Map<string, number>();
  for (const row of rows) {
    if (!row.date || row.date < cutoff(days)) continue;
    const value = metricValue(row, metric, platform);
    if (value != null) {
      grouped.set(row.date, (grouped.get(row.date) ?? 0) + value);
      sampleCounts.set(row.date, (sampleCounts.get(row.date) ?? 0) + 1);
    } else if (!grouped.has(row.date)) grouped.set(row.date, null);
  }
  return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b))
    .map(([iso, value]) => ({
      date: iso.slice(5).replace("-", "/"),
      value: metric === "er" && value != null ? value / (sampleCounts.get(iso) || 1) : value
    }));
}
function socialLink(href: string | null) {
  return href && /^https:\/\//.test(href) ? href : undefined;
}

export default function MetaDashboardLive({ platform }: { platform: MetaPlatform }) {
  const live = useMetaLive();
  const ig = platform === "instagram";
  const p = ig ? "ig" : "fb";
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [windowKey, setWindowKey] = useState<WindowKey>("1M");
  const [contentWindow, setContentWindow] = useState<WindowKey>("1M");
  const [metric, setMetric] = useState<ChartMetric>("views");
  const [contentMetric, setContentMetric] = useState<ChartMetric>("views");
  const [audience, setAudience] = useState<AudienceTab>("demographic");
  const [csvMenu, setCsvMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);

  const allRows = useMemo(() => toLiveRows(platform, live.instagramRows, live.facebookRows),
    [platform, live.instagramRows, live.facebookRows]);
  const filtered = useMemo(() => allRows.filter((row) =>
    (!from || row.date >= from) && (!to || row.date <= to)), [allRows, from, to]);
  const views = sumReported(filtered, (row) => row.views);
  const reach = sumReported(filtered, (row) => row.reach);
  const engagements = sumReported(filtered, (row) => engagement(row, platform));
  const clicks = sumReported(filtered, (row) => row.clicks);
  const followerCount = ig ? live.account?.followers_count : (live.page?.followers_count ?? live.page?.fan_count);
  const bannerTitle = ig ? (live.account?.name || "Indomobil eMotor") : (live.page?.name || "IM Indomobil");
  const summaryCards = ig
    ? [["Followers (Current)", formatLiveNumber(followerCount)], ["Σ Content Views", formatLiveCompact(views)],
       ["Σ Post Reach", formatLiveCompact(reach)], ["Interactions", formatLiveCompact(engagements)],
       ["Profile Views", "—"], ["Profile Link Taps", "—"], ["Follows", "—"], ["Unfollows", "—"]]
    : [["Followers (Current)", formatLiveNumber(followerCount)], ["Reach (Unavailable)", "—"],
       ["Media Views", formatLiveCompact(views)], ["Post Engagement", formatLiveCompact(engagements)],
       ["Page Views", "—"], ["Post Clicks", formatLiveCompact(clicks)], ["Follows", "—"], ["Unfollows", "—"]];
  const topRows = useMemo(() => [...filtered].filter((row) => row.views != null)
    .sort((a, b) => (b.views ?? -1) - (a.views ?? -1)).slice(0, 5), [filtered]);
  const trendRows = useMemo(() => chartRows(filtered, metric, platform, windowKey), [filtered, metric, platform, windowKey]);
  const contentTrend = useMemo(() => chartRows(filtered, contentMetric, platform, contentWindow),
    [filtered, contentMetric, platform, contentWindow]);
  const chartMetrics: ChartMetric[] = ig
    ? ["views", "reach", "interactions", "likes", "comments", "shares", "saves"]
    : ["views", "reach", "interactions", "comments", "shares", "clicks"];
  const contentMetrics: ChartMetric[] = ig
    ? ["views", "reach", "likes", "comments", "shares", "saves", "er"]
    : ["views", "reach", "interactions", "comments", "shares", "clicks", "er"];
  const contentTypes = ig ? ["Reel", "Post", "Carousel"] : ["Reel", "Video", "Photo", "Link", "Post"];
  const byType = contentTypes.map((type) => ({
    type, value: sumReported(filtered.filter((row) => row.type === type), (row) => row.views) ?? 0
  }));
  const availableViews = byType.reduce((total, item) => total + item.value, 0);
  const colors = ig ? ["#6d5cf5", "#d14fba", "#f59c55"] : ["#1877f2", "#59a4ff", "#8bc2ff", "#b7d9ff", "#c4a8ef"];
  let currentPercent = 0;
  const donut = views == null || availableViews <= 0 ? "#eef0f6" : `conic-gradient(${byType.map((part, index) => {
    const start = currentPercent;
    currentPercent += part.value / availableViews * 100;
    return `${colors[index]} ${start}% ${currentPercent}%`;
  }).join(",")})`;

  const headers = ig
    ? ["Date", "Content", "Type", "Views", "Reach", "Likes", "Comments", "Shares", "Saves", "ER", "Permalink"]
    : ["Date", "Content", "Type", "Media Views", "Reach (unavailable)", "Reactions", "Comments", "Shares", "Clicks", "ER", "Permalink"];
  const makeCsvRows = (rows: LiveRow[]) => rows.map((row) => [
    row.date, row.caption, row.type, row.views, row.reach,
    ig ? row.likes : row.reactions, row.comments, row.shares,
    ig ? row.saves : row.clicks, er(row, platform) == null ? null : `${er(row, platform)!.toFixed(2)}%`, row.permalink
  ]);
  async function downloadCsv(mode: "all" | "filtered") {
    setCsvMenu(false);
    setCsvError(null);
    setExporting(true);
    try {
      // CSV is complete across Meta cursor pages, not merely the first 25 visible rows.
      const everything = await live.loadAllForCsv();
      const all = toLiveRows(platform, everything.instagram, everything.facebook);
      const rows = mode === "filtered" ? all.filter((row) =>
        (!from || row.date >= from) && (!to || row.date <= to)) : all;
      exportCsv(`${platform}-content-${mode === "all" ? "all" : `filtered-${from || "start"}-to-${to || "latest"}`}.csv`,
        headers, makeCsvRows(rows));
    } catch (cause) {
      setCsvError(cause instanceof Error ? cause.message : "CSV export failed.");
    } finally {
      setExporting(false);
    }
  }

  const displayMetrics = (row: LiveRow) => ig
    ? [row.views, row.reach, row.likes, row.comments, row.shares, row.saves]
    : [row.views, row.reach, row.reactions, row.comments, row.shares, row.clicks];
  const datePeriod = from || to ? `${from || "Start"} – ${to || "Latest"}` : "All loaded publish dates";
  const disabledBecauseLoading = live.loading || exporting || live.loadingMore;
  const chart = (data: Array<{ date: string; value: number | null }>, color: string, label: string) => (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e9edf5" />
        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#8b93a7", fontSize: 10 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8b93a7", fontSize: 10 }} width={55} tickFormatter={(v) => formatLiveCompact(Number(v))} />
        <Tooltip formatter={(v: number | string) => [Number(v).toLocaleString("en-US"), label]} contentStyle={{ border: "1px solid #e1e6ef", borderRadius: 10, fontSize: 11 }} />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={false} activeDot={{ r: 4 }} isAnimationActive />
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <main className={`${p}-main`}>
      <header className={`${p}-topbar`}>
        <div><h1>{ig ? "Instagram" : "Facebook"} Performance</h1><p>Live organic content analytics from Meta Graph API.</p></div>
        <div className={`${p}-top-actions`}>
          <div className={`${p}-status-pill`}>
            <span>{live.loading ? "CONNECTING" : live.error ? "API ERROR" : "LIVE META API"}</span>
            <strong>{live.loading ? "Loading..." : live.error || `Updated ${live.updatedAt?.toLocaleTimeString() || "now"}`}</strong>
          </div><div className={`${p}-avatar`}>{ig ? "IG" : "f"}</div>
        </div>
      </header>
      <section className={`${p}-banner`}>
        <div className={`${p}-banner-copy`}><p>{ig ? "INSTAGRAM PROFESSIONAL ACCOUNT" : "FACEBOOK BUSINESS PAGE"}</p>
          <h2>{bannerTitle}</h2><span>{ig ? "@im.indomobil · " : ""}Organic Performance &amp; Audience Intelligence</span></div>
        <div className={`${p}-banner-stats`}>
          <div><span>Followers</span><strong>{formatLiveNumber(followerCount)}</strong></div>
          <div><span>Media Views</span><strong>{formatLiveCompact(views)}</strong></div>
          <div><span>{ig ? "Σ Post Reach" : "Engagement"}</span><strong>{formatLiveCompact(ig ? reach : engagements)}</strong></div>
        </div>
        <button type="button" onClick={() => window.open(ig ? "https://www.instagram.com/im.indomobil/" : (live.page?.link || "https://www.facebook.com/559714640555920"), "_blank", "noopener,noreferrer")}>Open {ig ? "Instagram" : "Facebook"} ↗</button>
      </section>
      <section className={`${p}-panel ${p}-filter`}>
        <label><span>FROM DATE</span><input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label>
        <label><span>TO DATE</span><input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /></label>
        <button type="button" className="primary" onClick={() => {
          if (fromDate && toDate && fromDate > toDate) { setCsvError("From Date cannot be later than To Date."); return; }
          setCsvError(null); setFrom(fromDate); setTo(toDate); live.setPeriod(fromDate, toDate);
        }}>Apply Period</button>
        <button type="button" className="soft" onClick={() => {
          setFromDate(""); setToDate(""); setFrom(""); setTo(""); live.setPeriod("", ""); setCsvError(null);
        }}>Reset</button>
        <div className={`${p}-filter-meta`}>Selected content period: <strong>{datePeriod}</strong><span>Publish-date filter • visible totals cover loaded content.</span></div>
      </section>
      <section className={`${p}-summary-grid`}>
        {summaryCards.map(([title, value]) => <article key={title} className={`${p}-kpi`}><p>{title}</p><strong>{value}</strong></article>)}
      </section>
      <section className={`${p}-panel`}>
        <div className={`${p}-section-head`}><div><h2>{ig ? "Instagram" : "Facebook"} Growth</h2><p>Historical follower growth is not available from the connected endpoint.</p></div>
          <div className={`${p}-range`}>{(Object.keys(RANGES) as WindowKey[]).map((key) =>
            <button type="button" key={key} className={windowKey === key ? "active" : ""} onClick={() => setWindowKey(key)}>{key}</button>)}</div></div>
        <div className={`${p}-growth-grid`}>
          {["Follower Growth", "Media Views Change", "Reach Change", "Engagement Change", "Profile Activity Change"].map((title) =>
            <article className={`${p}-growth-card`} key={title}><p>{title}</p><strong>—</strong><div style={{ height: 110, marginTop: 10, fontSize: 10, color: "#9aa2b7", display: "flex", alignItems: "center" }}>Historical snapshots needed</div></article>)}
        </div>
      </section>
      <section className={`${p}-performance-grid`}>
        <article className={`${p}-panel`}>
          <div className={`${p}-section-head`}><div><h2>Performance Trend</h2><p>Current content metrics grouped by publish date—not daily audience traffic.</p></div></div>
          <div className={`${p}-metric-tabs`}>{chartMetrics.map((key) =>
            <button type="button" key={key} className={metric === key ? "active" : ""} onClick={() => setMetric(key)}>{LABELS[key]}</button>)}</div>
          <div className={`${p}-main-chart`}>{chart(trendRows, ig ? "#5c6df1" : "#1877f2", LABELS[metric])}</div>
        </article>
        <article className={`${p}-panel ${p}-performance-summary`}>
          <div className={`${p}-section-head`}><div><h2>{ig ? "Profile" : "Page"} Activity</h2><p>Measured results for currently loaded content.</p></div></div>
          {[["Media Views", views], ["Σ Post Reach", reach], ["Reported Interactions", engagements],
            [ig ? "Profile Views" : "Page Views", null], [ig ? "Link Taps" : "Post Clicks", ig ? null : clicks], ["Net Follows", null]].map(([label, value]) =>
            <div className={`${p}-activity-row`} key={String(label)}><div><span>{label}</span><strong>{formatLiveCompact(value as number | null)}</strong></div><b>—</b></div>)}
        </article>
      </section>
      <section className={`${p}-two-column`}>
        <article className={`${p}-panel`}>
          <div className={`${p}-section-head`}><div><h2>Audience</h2><p>Follower demographics and location.</p></div></div>
          <div className={`${p}-audience-tabs`}>
            {(["demographic", "cities", "countries"] as AudienceTab[]).map((key) =>
              <button type="button" key={key} className={audience === key ? "active" : ""} onClick={() => setAudience(key)}>
                {key === "demographic" ? "Age & Gender" : key === "cities" ? "Top Cities" : "Top Countries"}
              </button>)}
          </div>
          <p style={{ minHeight: 140, display: "grid", placeItems: "center", fontSize: 12, color: "#8b93a7", textAlign: "center" }}>Audience {audience} metrics have not been returned by this API. No sample percentages are shown.</p>
        </article>
        <article className={`${p}-panel`}>
          <div className={`${p}-section-head`}><div><h2>Media Views by Content Type</h2><p>Sum of reported media views for loaded posts.</p></div></div>
          <div className={`${p}-content-type-layout`}>
            <div className={`${p}-donut`} style={{ background: donut }}><div><strong>{formatLiveCompact(views)}</strong><span>Total Views</span></div></div>
            <div className={`${p}-type-legend`}>{byType.map((entry, index) =>
              <div key={entry.type}><i className={`c${Math.min(index + 1, 4)}`} style={{ background: colors[index] }} /><span>{entry.type}</span><strong>{availableViews > 0 ? `${(entry.value / availableViews * 100).toFixed(1)}%` : "—"}</strong></div>)}</div>
          </div>
          <div className={`${p}-reach-mix`}><h3>Audience Source</h3><p style={{ fontSize: 11, color: "#8b93a7" }}>Follower and non-follower breakdown not available in this response.</p></div>
        </article>
      </section>
      <section className={`${p}-panel`}>
        <div className={`${p}-section-head`}><div><h2>{ig ? "Instagram" : "Facebook"} Content Performance Trend</h2><p>Current media metrics by publish date.</p></div>
          <div className={`${p}-range`}>{(Object.keys(RANGES) as WindowKey[]).map((key) =>
            <button type="button" key={key} className={contentWindow === key ? "active" : ""} onClick={() => setContentWindow(key)}>{key}</button>)}</div></div>
        <div className={`${p}-metric-tabs`}>{contentMetrics.map((key) =>
          <button type="button" key={key} className={contentMetric === key ? "active" : ""} onClick={() => setContentMetric(key)}>{LABELS[key]}</button>)}</div>
        <div className={`${p}-main-chart trend`}>{chart(contentTrend, ig ? "#6d5cf5" : "#1877f2", LABELS[contentMetric])}</div>
      </section>
      <section className={`${p}-panel ${p}-ai-card`}>
        <div className={`${p}-section-head`}><div><p className={`${p}-ai-label`}>GEMINI AI</p><h2>AI Content Performance Analysis</h2><p>Gemini integration is a separate step. No fictional AI analysis is displayed.</p></div>
          <div className={`${p}-ai-action`}><span>Period: {contentWindow}</span><button type="button" disabled title="Gemini endpoint is not connected">✦ Generate AI Analysis</button></div></div>
        <div className={`${p}-ai-kpis`}>
          <div><span>CONTENTS</span><strong>{filtered.length}</strong></div>
          <div><span>MEDIA VIEWS</span><strong>{formatLiveCompact(views)}</strong></div>
          <div><span>INTERACTIONS</span><strong>{formatLiveCompact(engagements)}</strong></div>
          <div><span>ENGAGEMENT RATE</span><strong>{formatLiveEr(engagements, views)}</strong></div>
        </div>
        <div className={`${p}-ai-preview`}><div><span>EXECUTIVE SUMMARY</span><p>Live reporting is enabled. Automated AI commentary is not active.</p></div>
          <article className="working"><h3>Highest reported views</h3><ul><li>{topRows[0]?.caption || "No reported content in this period"}</li></ul></article>
          <article className="attention"><h3>Metric coverage</h3><ul><li>Values marked — are unavailable, not zero. Some insights may be unsupported or permission-limited.</li></ul></article>
        </div>
      </section>
      <section className={`${p}-panel`}>
        <div className={`${p}-section-head`}><div><h2>Top Content</h2><p>Top five posts by currently reported media views.</p></div></div>
        <div className={`${p}-table-wrap`}><table className={`${p}-table`}>
          <thead><tr><th>#</th><th>CONTENT</th><th>TYPE</th><th>PUBLISH DATE</th><th>MEDIA VIEWS</th><th>REACH</th><th>{ig ? "LIKES" : "REACTIONS"}</th><th>COMMENTS</th><th>SHARES</th><th>ER</th><th>LINK</th></tr></thead>
          <tbody>{topRows.map((row, index) => <tr key={row.id}><td>{index + 1}</td><td className="title">{row.caption}</td><td><span className={`${p}-badge ${row.type.toLowerCase()}`}>{row.type}</span></td><td>{row.date}</td>
            {displayMetrics(row).slice(0, 5).map((value, i) => <td key={i}>{formatLiveNumber(value)}</td>)}
            <td>{formatLiveEr(er(row, platform), 100)}</td><td>{socialLink(row.permalink) ? <a href={socialLink(row.permalink)} target="_blank" rel="noopener noreferrer">Open ↗</a> : "—"}</td></tr>)}</tbody>
        </table></div>
      </section>
      <section className={`${p}-panel`}>
        <div className={`${p}-section-head`}><div><h2>{ig ? "Instagram" : "Facebook"} Content</h2><p>{filtered.length} matching posts out of {allRows.length} loaded • Live data</p></div>
          <div style={{ position: "relative" }}>
            <button className={`${p}-download`} type="button" onClick={() => setCsvMenu((state) => !state)} disabled={disabledBecauseLoading}>{exporting ? "Exporting all content…" : "↓ Download CSV ▾"}</button>
            {csvMenu && <div role="menu" style={{ position: "absolute", right: 0, zIndex: 20, top: "calc(100% + 8px)", width: 244, padding: 8, background: "white", borderRadius: 10, boxShadow: "0 8px 26px #21315a33", border: "1px solid #e1e6ef" }}>
              <button type="button" role="menuitem" onClick={() => void downloadCsv("filtered")} style={{ display: "block", width: "100%", padding: 12, textAlign: "left", border: 0, background: "white", cursor: "pointer" }}>Download Filtered by Date CSV</button>
              <button type="button" role="menuitem" onClick={() => void downloadCsv("all")} style={{ display: "block", width: "100%", padding: 12, textAlign: "left", border: 0, background: "white", cursor: "pointer" }}>Download All CSV</button>
            </div>}
          </div>
        </div>
        {(csvError || live.error) && <p role="alert" style={{ color: "#bd2b45", fontSize: 12 }}>{csvError || live.error}</p>}
        <div className={`${p}-table-wrap`}><table className={`${p}-table content`}>
          <thead><tr><th>DATE</th><th>CONTENT</th><th>TYPE</th><th>MEDIA VIEWS</th><th>REACH</th><th>{ig ? "LIKES" : "REACTIONS"}</th><th>COMMENTS</th><th>SHARES</th><th>{ig ? "SAVES" : "CLICKS"}</th><th>ER</th><th>LINK</th></tr></thead>
          <tbody>{filtered.map((row) => <tr key={row.id}><td>{row.date}</td><td className="title">{row.caption}</td><td><span className={`${p}-badge ${row.type.toLowerCase()}`}>{row.type}</span></td>
            {displayMetrics(row).map((value, i) => <td key={i}>{formatLiveNumber(value)}</td>)}
            <td>{er(row, platform) == null ? "—" : `${er(row, platform)!.toFixed(2)}%`}</td>
            <td>{socialLink(row.permalink) ? <a href={socialLink(row.permalink)} target="_blank" rel="noopener noreferrer">Open ↗</a> : "—"}</td></tr>)}</tbody>
        </table></div>
        <div className={`${p}-table-foot`}><span>Showing {filtered.length} rows (loaded {allRows.length})</span><strong>{live.hasNext ? "More historical content available" : "All pages loaded"}</strong></div>
        {live.hasNext && <button type="button" disabled={disabledBecauseLoading} onClick={() => void live.loadMore()} style={{ padding: 12, marginTop: 12, borderRadius: 10, border: "1px solid #dce1ef", cursor: "pointer" }}>{live.loadingMore ? "Loading older content..." : "Load more content"}</button>}
      </section>
      <footer className={`${p}-footer`}>{ig ? "Instagram" : "Facebook"} Analytics Dashboard • Live Meta API • Read-only organic insights. Metrics are cumulative per post, grouped by publish date.</footer>
    </main>
  );
}
