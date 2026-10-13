"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type RangeKey = "7D" | "1M" | "3M" | "6M" | "1Y";
type PerformanceMetric = "reach" | "impressions" | "engagement" | "pageViews" | "linkClicks" | "follows";
type ContentMetric = "reach" | "impressions" | "reactions" | "comments" | "shares" | "clicks" | "er";
type AudienceTab = "demographic" | "cities" | "countries";
type ContentRow = {
  id: number;
  date: string;
  title: string;
  type: "Reel" | "Video" | "Photo" | "Link";
  reach: number;
  impressions: number;
  reactions: number;
  comments: number;
  shares: number;
  clicks: number;
};

const RANGE_DAYS: Record<RangeKey, number> = { "7D": 7, "1M": 30, "3M": 90, "6M": 180, "1Y": 365 };
const PERFORMANCE_LABELS: Record<PerformanceMetric, string> = {
  reach: "Reach",
  impressions: "Impressions",
  engagement: "Engagement",
  pageViews: "Page Views",
  linkClicks: "Link Clicks",
  follows: "Follows"
};
const CONTENT_LABELS: Record<ContentMetric, string> = {
  reach: "Reach",
  impressions: "Impressions",
  reactions: "Reactions",
  comments: "Comments",
  shares: "Shares",
  clicks: "Clicks",
  er: "ER"
};

const dailyData = [
  { date: "22 Aug", reach: 8400, impressions: 12800, engagement: 280, pageViews: 410, linkClicks: 72, follows: 28 },
  { date: "24 Aug", reach: 6900, impressions: 10100, engagement: 245, pageViews: 360, linkClicks: 64, follows: 22 },
  { date: "27 Aug", reach: 4600, impressions: 7200, engagement: 190, pageViews: 285, linkClicks: 51, follows: 20 },
  { date: "30 Aug", reach: 12100, impressions: 18500, engagement: 520, pageViews: 610, linkClicks: 98, follows: 44 },
  { date: "02 Sep", reach: 7300, impressions: 11200, engagement: 330, pageViews: 405, linkClicks: 76, follows: 31 },
  { date: "04 Sep", reach: 87600, impressions: 132400, engagement: 2860, pageViews: 2450, linkClicks: 740, follows: 690 },
  { date: "05 Sep", reach: 61500, impressions: 92100, engagement: 2240, pageViews: 1860, linkClicks: 520, follows: 410 },
  { date: "07 Sep", reach: 18200, impressions: 27400, engagement: 880, pageViews: 790, linkClicks: 185, follows: 96 },
  { date: "09 Sep", reach: 7900, impressions: 11800, engagement: 390, pageViews: 420, linkClicks: 88, follows: 38 },
  { date: "11 Sep", reach: 9100, impressions: 13700, engagement: 430, pageViews: 465, linkClicks: 95, follows: 41 },
  { date: "13 Sep", reach: 12800, impressions: 19400, engagement: 590, pageViews: 570, linkClicks: 122, follows: 56 },
  { date: "16 Sep", reach: 14300, impressions: 21600, engagement: 670, pageViews: 625, linkClicks: 138, follows: 61 },
  { date: "18 Sep", reach: 19800, impressions: 29800, engagement: 910, pageViews: 760, linkClicks: 166, follows: 74 }
];

const growthCards = [
  { title: "Follower Growth", value: "+4.8%", points: [2, 2.2, 2.6, 3.1, 3.4, 4.0, 4.8] },
  { title: "Reach", value: "+312.6K", points: [8, 12, 18, 21, 36, 44, 61] },
  { title: "Impressions", value: "+481.2K", points: [10, 16, 23, 32, 49, 70, 92] },
  { title: "Engagement", value: "+11.2K", points: [1, 1.6, 2.4, 3.2, 5.4, 7.8, 11.2] },
  { title: "Page Activity", value: "+8.9K", points: [1, 1.4, 2.1, 3.9, 5.7, 7.1, 8.9] }
];

const contentRows: ContentRow[] = [
  { id: 1, date: "2026-09-18", title: "Jalan licin? Tanjakan? Tetap pede! Motor listrik Indomobil eMotor...", type: "Reel", reach: 56200, impressions: 81400, reactions: 1540, comments: 112, shares: 214, clicks: 390 },
  { id: 2, date: "2026-09-17", title: "Daripada cuma jadi penghuni garasi, kenapa nggak di-upgrade...", type: "Reel", reach: 49800, impressions: 72100, reactions: 1310, comments: 96, shares: 181, clicks: 344 },
  { id: 3, date: "2026-09-15", title: "Siapa udah tau fitur TCS ini? Nggak perlu khawatir lagi...", type: "Photo", reach: 40100, impressions: 58900, reactions: 1025, comments: 84, shares: 152, clicks: 276 },
  { id: 4, date: "2026-09-13", title: "Permisi yaa bu mau lewat ambil motor 😄", type: "Reel", reach: 36700, impressions: 52900, reactions: 970, comments: 71, shares: 144, clicks: 244 },
  { id: 5, date: "2026-09-12", title: "Bawa banyak barang? Santai, bagasi Sprinto masih muat 😎", type: "Photo", reach: 33200, impressions: 48600, reactions: 890, comments: 66, shares: 128, clicks: 215 },
  { id: 6, date: "2026-09-10", title: "Nyuci motor listrik kena debu abu vulkanik? Gak perlu khawatir...", type: "Video", reach: 30800, impressions: 45200, reactions: 812, comments: 58, shares: 116, clicks: 196 },
  { id: 7, date: "2026-09-08", title: "Nikmati Traction Control System, Hill Start Assist, dan Push Assist...", type: "Reel", reach: 28600, impressions: 42100, reactions: 785, comments: 55, shares: 109, clicks: 182 },
  { id: 8, date: "2026-09-06", title: "Kami hadir di Indomobil Expo 2026 dengan berbagai pilihan...", type: "Link", reach: 25200, impressions: 37400, reactions: 610, comments: 49, shares: 91, clicks: 438 },
  { id: 9, date: "2026-09-03", title: "Mulai dari memastikan motor mati, gunakan perlindungan diri...", type: "Photo", reach: 22900, impressions: 33800, reactions: 594, comments: 42, shares: 80, clicks: 163 },
  { id: 10, date: "2026-09-01", title: "Motor listrik untuk aktivitas sehari-hari, lebih praktis dan hemat...", type: "Reel", reach: 21100, impressions: 30900, reactions: 548, comments: 39, shares: 74, clicks: 151 },
  { id: 11, date: "2026-08-29", title: "Tyranno untuk perjalanan jauh, cruise control bikin riding lebih santai...", type: "Video", reach: 19200, impressions: 28400, reactions: 492, comments: 34, shares: 69, clicks: 137 },
  { id: 12, date: "2026-08-26", title: "Adora Vibe untuk perjalanan harian dengan gaya yang lebih personal...", type: "Photo", reach: 17100, impressions: 25300, reactions: 438, comments: 29, shares: 61, clicks: 121 }
];

const demographics = [
  { label: "18–24", male: 6.5, female: 4.2 },
  { label: "25–34", male: 20.1, female: 10.6 },
  { label: "35–44", male: 24.8, female: 8.9 },
  { label: "45–54", male: 13.8, female: 5.0 },
  { label: "55–64", male: 3.6, female: 1.7 },
  { label: "65+", male: 0.6, female: 0.2 }
];

const cities = [
  ["Jakarta", 21.4], ["Bekasi", 5.7], ["Bandung", 4.9], ["Surabaya", 4.1], ["Tangerang", 3.8],
  ["Depok", 3.5], ["Bogor", 2.9], ["Semarang", 2.4], ["Medan", 2.1], ["Palembang", 1.8]
] as const;

const countries = [
  ["Indonesia", 89.4], ["Malaysia", 2.8], ["Singapore", 1.5], ["India", 1.2], ["United States", 1.0],
  ["Thailand", 0.8], ["Philippines", 0.6], ["Australia", 0.5], ["Japan", 0.4], ["Other", 1.8]
] as const;

function compact(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}
function number(value: number) { return new Intl.NumberFormat("en-US").format(value); }
function er(row: ContentRow) {
  if (!row.reach) return 0;
  return ((row.reactions + row.comments + row.shares + row.clicks) / row.reach) * 100;
}
function miniPath(values: number[]) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);
  return values.map((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * 100;
    const y = 92 - ((value - min) / range) * 72;
    return `${x},${y}`;
  }).join(" ");
}
function csvCell(value: string | number) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export default function FacebookDashboardPreview() {
  const [range, setRange] = useState<RangeKey>("7D");
  const [metric, setMetric] = useState<PerformanceMetric>("reach");
  const [contentMetric, setContentMetric] = useState<ContentMetric>("reach");
  const [contentRange, setContentRange] = useState<RangeKey>("7D");
  const [audienceTab, setAudienceTab] = useState<AudienceTab>("demographic");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [aiGenerated, setAiGenerated] = useState(false);

  const filteredContent = useMemo(() => {
    if (!appliedFrom && !appliedTo) return contentRows;
    return contentRows.filter((row) => (appliedFrom ? row.date >= appliedFrom : true) && (appliedTo ? row.date <= appliedTo : true));
  }, [appliedFrom, appliedTo]);

  const summary = useMemo(() => filteredContent.reduce((acc, row) => {
    acc.reach += row.reach;
    acc.impressions += row.impressions;
    acc.engagement += row.reactions + row.comments + row.shares;
    acc.clicks += row.clicks;
    return acc;
  }, { reach: 0, impressions: 0, engagement: 0, clicks: 0 }), [filteredContent]);

  const topContent = useMemo(() => [...filteredContent].sort((a, b) => b.reach - a.reach).slice(0, 5), [filteredContent]);

  const contentTypeTotals = useMemo(() => {
    const totals = { Reel: 0, Video: 0, Photo: 0, Link: 0 };
    filteredContent.forEach((row) => { totals[row.type] += row.reach; });
    const total = Math.max(Object.values(totals).reduce((a, b) => a + b, 0), 1);
    return (Object.entries(totals) as Array<[keyof typeof totals, number]>).map(([label, value]) => ({ label, value, pct: (value / total) * 100 }));
  }, [filteredContent]);

  const contentTrend = useMemo(() => [...filteredContent].sort((a, b) => a.date.localeCompare(b.date)).map((row) => ({
    date: row.date.slice(5).replace("-", "/"),
    reach: row.reach,
    impressions: row.impressions,
    reactions: row.reactions,
    comments: row.comments,
    shares: row.shares,
    clicks: row.clicks,
    er: Number(er(row).toFixed(2))
  })), [filteredContent]);

  const totalContentReach = filteredContent.reduce((sum, row) => sum + row.reach, 0);
  const totalContentImpressions = filteredContent.reduce((sum, row) => sum + row.impressions, 0);
  const avgEngagement = filteredContent.length ? filteredContent.reduce((sum, row) => sum + er(row), 0) / filteredContent.length : 0;
  const periodLabel = appliedFrom || appliedTo ? `${appliedFrom || "Start"} – ${appliedTo || "Latest"}` : "All publish dates";

  const summaryCards = [
    ["Followers (Current)", "28,420"],
    ["Reach in Period", compact(appliedFrom || appliedTo ? summary.reach : 312600)],
    ["Impressions", compact(appliedFrom || appliedTo ? summary.impressions : 481200)],
    ["Engagement", compact(appliedFrom || appliedTo ? summary.engagement : 11200)],
    ["Page Views", "8.9K"],
    ["Link Clicks", compact(appliedFrom || appliedTo ? summary.clicks : 4200)],
    ["Follows", "1.9K"],
    ["Unfollows", "642"]
  ];

  function downloadCsv() {
    const rows = [
      ["Date", "Content", "Type", "Reach", "Impressions", "Reactions", "Comments", "Shares", "Clicks", "ER"],
      ...filteredContent.map((row) => [row.date, row.title, row.type, row.reach, row.impressions, row.reactions, row.comments, row.shares, row.clicks, `${er(row).toFixed(2)}%`])
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "facebook-content-preview.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(href);
  }

  return (
    <main className="fb-main">
      <header className="fb-topbar">
        <div><h1>Facebook Performance</h1><p>Organic page and content insights from the Meta Graph API.</p></div>
        <div className="fb-top-actions"><div className="fb-status-pill"><span>PREVIEW UI</span><strong>API not connected</strong></div><div className="fb-avatar">f</div></div>
      </header>

      <section className="fb-banner">
        <div className="fb-banner-copy"><p>FACEBOOK BUSINESS PAGE</p><h2>Indomobil eMotor</h2><span>Organic Performance & Audience Intelligence</span></div>
        <div className="fb-banner-stats"><div><span>Followers</span><strong>28.4K</strong></div><div><span>Reach</span><strong>312.6K</strong></div><div><span>Engagement</span><strong>11.2K</strong></div></div>
        <button type="button">Open Facebook ↗</button>
      </section>

      <section className="fb-panel fb-filter">
        <label><span>FROM DATE</span><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></label>
        <label><span>TO DATE</span><input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></label>
        <button type="button" className="primary" onClick={() => { setAppliedFrom(fromDate); setAppliedTo(toDate); }}>Apply Period</button>
        <button type="button" className="soft" onClick={() => { setFromDate(""); setToDate(""); setAppliedFrom(""); setAppliedTo(""); }}>Reset</button>
        <div className="fb-filter-meta">Selected content period: <strong>{periodLabel}</strong><span>Filter uses content publish date.</span></div>
      </section>

      <section className="fb-summary-grid">{summaryCards.map(([label, value]) => <article key={label} className="fb-kpi"><p>{label}</p><strong>{value}</strong></article>)}</section>

      <section className="fb-panel">
        <div className="fb-section-head"><div><h2>Facebook Growth</h2><p>Historical organic growth and page activity.</p></div><div className="fb-range">{(Object.keys(RANGE_DAYS) as RangeKey[]).map((key) => <button type="button" key={key} className={range === key ? "active" : ""} onClick={() => setRange(key)}>{key}</button>)}</div></div>
        <div className="fb-growth-grid">{growthCards.map((card) => <article className="fb-growth-card" key={card.title}><p>{card.title}</p><strong>{card.value}</strong><svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={miniPath(card.points)} fill="none" stroke="#1877f2" strokeWidth="3" vectorEffect="non-scaling-stroke" /></svg></article>)}</div>
      </section>

      <section className="fb-performance-grid">
        <article className="fb-panel">
          <div className="fb-section-head"><div><h2>Performance Trend</h2><p>Daily page performance · selected period</p></div></div>
          <div className="fb-metric-tabs">{(Object.keys(PERFORMANCE_LABELS) as PerformanceMetric[]).map((key) => <button type="button" key={key} className={metric === key ? "active" : ""} onClick={() => setMetric(key)}>{PERFORMANCE_LABELS[key]}</button>)}</div>
          <div className="fb-main-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={dailyData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e9edf5" /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#8b93a7", fontSize: 10 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#8b93a7", fontSize: 10 }} width={54} tickFormatter={(value) => compact(Number(value))} /><Tooltip formatter={(value: number | string) => [compact(Number(value)), PERFORMANCE_LABELS[metric]]} contentStyle={{ border: "1px solid #e1e6ef", borderRadius: 10, fontSize: 11 }} /><Line type="monotone" dataKey={metric} stroke="#1877f2" strokeWidth={3} dot={false} activeDot={{ r: 4 }} isAnimationActive animationDuration={550} /></LineChart></ResponsiveContainer></div>
        </article>
        <article className="fb-panel fb-performance-summary">
          <div className="fb-section-head"><div><h2>Page Activity</h2><p>Organic actions generated from Facebook.</p></div></div>
          {[["Reach", "312.6K", "+38.2%"], ["Impressions", "481.2K", "+42.6%"], ["Post Engagement", "11.2K", "+17.4%"], ["Page Views", "8.9K", "+21.1%"], ["Link Clicks", "4.2K", "+31.5%"], ["Net Follows", "+1,258", "+9.8%"]].map(([label, value, change]) => <div className="fb-activity-row" key={label}><div><span>{label}</span><strong>{value}</strong></div><b className={change.startsWith("-") ? "negative" : "positive"}>{change}</b></div>)}
        </article>
      </section>

      <section className="fb-two-column">
        <article className="fb-panel">
          <div className="fb-section-head"><div><h2>Audience</h2><p>Follower demographics and location.</p></div></div>
          <div className="fb-audience-tabs"><button type="button" className={audienceTab === "demographic" ? "active" : ""} onClick={() => setAudienceTab("demographic")}>Age & Gender</button><button type="button" className={audienceTab === "cities" ? "active" : ""} onClick={() => setAudienceTab("cities")}>Top Cities</button><button type="button" className={audienceTab === "countries" ? "active" : ""} onClick={() => setAudienceTab("countries")}>Top Countries</button></div>
          {audienceTab === "demographic" ? <><div className="fb-gender-summary"><div><i className="male" /><span>Male</span><strong>69.4%</strong></div><div><i className="female" /><span>Female</span><strong>30.6%</strong></div></div><div className="fb-demographic-bars">{demographics.map((row) => <div className="fb-demo-row" key={row.label}><span>{row.label}</span><div><i className="male" style={{ width: `${row.male * 2.2}%` }} /><i className="female" style={{ width: `${row.female * 2.2}%` }} /></div><strong>{(row.male + row.female).toFixed(1)}%</strong></div>)}</div></> : null}
          {audienceTab === "cities" ? <div className="fb-location-list">{cities.map(([label, pct]) => <div key={label}><span>{label}</span><div><i style={{ width: `${Math.max(2, pct * 4)}%` }} /></div><strong>{pct}%</strong></div>)}</div> : null}
          {audienceTab === "countries" ? <div className="fb-location-list">{countries.map(([label, pct]) => <div key={label}><span>{label}</span><div><i style={{ width: `${Math.max(2, pct)}%` }} /></div><strong>{pct}%</strong></div>)}</div> : null}
        </article>
        <article className="fb-panel">
          <div className="fb-section-head"><div><h2>Reach by Content Type</h2><p>Organic reach · selected period</p></div></div>
          <div className="fb-content-type-layout"><div className="fb-donut" style={{ background: `conic-gradient(#1877f2 0 ${contentTypeTotals[0].pct}%,#59a4ff ${contentTypeTotals[0].pct}% ${contentTypeTotals[0].pct + contentTypeTotals[1].pct}%,#8bc2ff ${contentTypeTotals[0].pct + contentTypeTotals[1].pct}% ${contentTypeTotals[0].pct + contentTypeTotals[1].pct + contentTypeTotals[2].pct}%,#b7d9ff ${contentTypeTotals[0].pct + contentTypeTotals[1].pct + contentTypeTotals[2].pct}% 100%)` }}><div><strong>{compact(totalContentReach)}</strong><span>Total Reach</span></div></div><div className="fb-type-legend">{contentTypeTotals.map((row, index) => <div key={row.label}><i className={`c${index + 1}`} /><span>{row.label}</span><strong>{row.pct.toFixed(1)}%</strong></div>)}</div></div>
          <div className="fb-reach-mix"><h3>Audience Source</h3><div><span>Followers</span><div><i style={{ width: "31%" }} /></div><strong>31%</strong></div><div><span>Non-followers</span><div><i style={{ width: "69%" }} /></div><strong>69%</strong></div></div>
        </article>
      </section>

      <section className="fb-panel">
        <div className="fb-section-head"><div><h2>Facebook Content Performance Trend</h2><p>Current performance of content grouped by publish date.</p></div><div className="fb-range">{(Object.keys(RANGE_DAYS) as RangeKey[]).map((key) => <button type="button" key={key} className={contentRange === key ? "active" : ""} onClick={() => setContentRange(key)}>{key}</button>)}</div></div>
        <div className="fb-metric-tabs">{(Object.keys(CONTENT_LABELS) as ContentMetric[]).map((key) => <button type="button" key={key} className={contentMetric === key ? "active" : ""} onClick={() => setContentMetric(key)}>{CONTENT_LABELS[key]}</button>)}</div>
        <div className="fb-main-chart trend"><ResponsiveContainer width="100%" height="100%"><LineChart data={contentTrend} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e9edf5" /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#8b93a7", fontSize: 10 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#8b93a7", fontSize: 10 }} width={54} tickFormatter={(value) => contentMetric === "er" ? `${Number(value).toFixed(1)}%` : compact(Number(value))} /><Tooltip formatter={(value: number | string) => [contentMetric === "er" ? `${Number(value).toFixed(2)}%` : compact(Number(value)), CONTENT_LABELS[contentMetric]]} contentStyle={{ border: "1px solid #e1e6ef", borderRadius: 10, fontSize: 11 }} /><Line type="monotone" dataKey={contentMetric} stroke="#1877f2" strokeWidth={3} dot={false} activeDot={{ r: 4 }} isAnimationActive animationDuration={550} /></LineChart></ResponsiveContainer></div>
      </section>

      <section className="fb-panel fb-ai-card">
        <div className="fb-section-head"><div><p className="fb-ai-label">GEMINI AI</p><h2>AI Content Performance Analysis</h2><p>Evidence-based analysis of the selected Facebook content trend period.</p></div><div className="fb-ai-action"><span>Period: {contentRange}</span><button type="button" onClick={() => setAiGenerated(true)}>✦ Generate AI Analysis</button></div></div>
        <div className="fb-ai-kpis"><div><span>CONTENTS</span><strong>{filteredContent.length}</strong></div><div><span>REACH</span><strong>{compact(totalContentReach)}</strong></div><div><span>IMPRESSIONS</span><strong>{compact(totalContentImpressions)}</strong></div><div><span>ENGAGEMENT</span><strong>{avgEngagement.toFixed(2)}%</strong></div></div>
        <div className="fb-ai-preview"><div><span>EXECUTIVE SUMMARY</span><p>{aiGenerated ? "Reels contribute the strongest reach and engagement efficiency in this preview period, while Link posts create disproportionately high click activity. Product-feature and practical-use content should remain the core organic content pillar." : "Preview UI only. After the Facebook API and Gemini endpoint are connected, this section will analyze the same content period shown in the chart above."}</p></div><article className="working"><h3>What's Working</h3><ul><li>Reels contribute the largest share of organic reach.</li><li>Feature-led and practical-use content generates stronger reactions and shares.</li><li>Dealer / website Link posts generate stronger click intent.</li></ul></article><article className="attention"><h3>Needs Attention</h3><ul><li>Compare high-reach posts against click and engagement quality.</li><li>Monitor whether non-follower reach converts into Page follows.</li><li>Test stronger calls-to-action on Photo and Video content.</li></ul></article></div>
      </section>

      <section className="fb-panel">
        <div className="fb-section-head"><div><h2>Top Content</h2><p>Best-performing Facebook content in the selected publish-date period.</p></div></div>
        <div className="fb-table-wrap"><table className="fb-table"><thead><tr><th>#</th><th>CONTENT</th><th>TYPE</th><th>PUBLISH DATE</th><th>REACH</th><th>IMPRESSIONS</th><th>REACTIONS</th><th>COMMENTS</th><th>SHARES</th><th>ER</th><th>LINK</th></tr></thead><tbody>{topContent.map((row, index) => <tr key={row.id}><td>{index + 1}</td><td className="title">{row.title}</td><td><span className={`fb-badge ${row.type.toLowerCase()}`}>{row.type}</span></td><td>{row.date}</td><td>{number(row.reach)}</td><td>{number(row.impressions)}</td><td>{number(row.reactions)}</td><td>{number(row.comments)}</td><td>{number(row.shares)}</td><td>{er(row).toFixed(2)}%</td><td><a href="#" onClick={(e) => e.preventDefault()}>Open ↗</a></td></tr>)}</tbody></table></div>
      </section>

      <section className="fb-panel">
        <div className="fb-section-head"><div><h2>Facebook Content</h2><p>{filteredContent.length} content items in selected period • Preview data</p></div><button type="button" className="fb-download" onClick={downloadCsv}>↓ Download CSV</button></div>
        <div className="fb-table-wrap"><table className="fb-table"><thead><tr><th>DATE</th><th>CONTENT</th><th>TYPE</th><th>REACH</th><th>IMPRESSIONS</th><th>REACTIONS</th><th>COMMENTS</th><th>SHARES</th><th>CLICKS</th><th>ER</th><th>LINK</th></tr></thead><tbody>{filteredContent.map((row) => <tr key={row.id}><td>{row.date}</td><td className="title">{row.title}</td><td><span className={`fb-badge ${row.type.toLowerCase()}`}>{row.type}</span></td><td>{number(row.reach)}</td><td>{number(row.impressions)}</td><td>{number(row.reactions)}</td><td>{number(row.comments)}</td><td>{number(row.shares)}</td><td>{number(row.clicks)}</td><td>{er(row).toFixed(2)}%</td><td><a href="#" onClick={(e) => e.preventDefault()}>Open ↗</a></td></tr>)}</tbody></table><div className="fb-table-foot"><span>Showing 1–{filteredContent.length} of {filteredContent.length} content items</span><strong>100 content / page</strong></div></div>
      </section>

      <footer className="fb-footer">Facebook Analytics Dashboard • Preview UI • Read-only organic insights</footer>

      <style jsx global>{`
        .fb-main{min-width:0;padding:24px 28px 36px;background:#f4f6fb}.fb-topbar{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:20px}.fb-topbar h1{margin:0;font-size:22px;letter-spacing:-.03em}.fb-topbar p{margin:5px 0 0;color:#7a839d;font-size:12px}.fb-top-actions{display:flex;align-items:center;gap:10px}.fb-status-pill{padding:8px 12px;border:1px solid #e1e5ef;border-radius:10px;background:white}.fb-status-pill span,.fb-status-pill strong{display:block}.fb-status-pill span{color:#a0a8bb;font-size:8px;font-weight:900;letter-spacing:.1em}.fb-status-pill strong{margin-top:2px;font-size:10px}.fb-avatar{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:#1877f2;color:white;font-size:18px;font-weight:900}
        .fb-banner{position:relative;overflow:hidden;min-height:150px;padding:26px 30px;margin-bottom:16px;border-radius:18px;display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:24px;color:white;background:radial-gradient(circle at 78% 24%,rgba(255,255,255,.14),transparent 26%),linear-gradient(120deg,#0c2f66 0%,#1257b7 52%,#1877f2 100%);box-shadow:0 12px 30px rgba(24,119,242,.13)}.fb-banner-copy p{margin:0 0 7px;color:#c7e2ff;font-size:10px;font-weight:900;letter-spacing:.13em}.fb-banner-copy h2{margin:0;font-size:30px;letter-spacing:-.04em}.fb-banner-copy span{display:block;margin-top:8px;color:rgba(255,255,255,.76);font-size:12px}.fb-banner-stats{display:flex;gap:14px}.fb-banner-stats div{min-width:90px;padding:11px 13px;border:1px solid rgba(255,255,255,.16);border-radius:12px;background:rgba(255,255,255,.07)}.fb-banner-stats span,.fb-banner-stats strong{display:block}.fb-banner-stats span{color:rgba(255,255,255,.64);font-size:9px}.fb-banner-stats strong{margin-top:4px;font-size:18px}.fb-banner>button{min-height:40px;border:1px solid rgba(255,255,255,.22);border-radius:10px;padding:0 14px;background:rgba(255,255,255,.06);color:white;font-size:11px;font-weight:800}
        .fb-panel{min-width:0;margin-bottom:16px;padding:18px;border:1px solid #e2e7ef;border-radius:15px;background:white;box-shadow:0 7px 18px rgba(39,48,92,.045)}.fb-filter{display:grid;grid-template-columns:1fr 1fr auto auto;gap:12px;align-items:end}.fb-filter label{display:grid;gap:6px}.fb-filter label>span{color:#7a839d;font-size:9px;font-weight:800;letter-spacing:.08em}.fb-filter input{min-height:40px;border:1px solid #dce1ef;border-radius:10px;padding:0 12px;background:#fbfcff;color:#141b34}.fb-filter button,.fb-download{min-height:40px;border-radius:10px;padding:0 16px;font-size:11px;font-weight:900}.fb-filter button.primary{border:0;background:#1877f2;color:white}.fb-filter button.soft,.fb-download{border:1px solid #dce1ef;background:white;color:#59617a}.fb-filter-meta{grid-column:1/-1;display:flex;justify-content:space-between;gap:12px;color:#59617a;font-size:10px}.fb-filter-meta span{color:#9aa2b7}
        .fb-summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px}.fb-kpi{position:relative;overflow:hidden;padding:16px;border:1px solid #e2e7ef;border-radius:14px;background:white;box-shadow:0 7px 18px rgba(39,48,92,.045)}.fb-kpi:before{content:"";position:absolute;left:0;top:0;width:100%;height:3px;background:linear-gradient(90deg,#1877f2,#5ca7ff)}.fb-kpi p{margin:0 0 8px;color:#8a92a8;font-size:10px;font-weight:700}.fb-kpi strong{display:block;font-size:22px;letter-spacing:-.04em}.fb-section-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:16px}.fb-section-head h2{margin:0;font-size:18px;letter-spacing:-.025em}.fb-section-head p{margin:4px 0 0;color:#8b93a7;font-size:11px}
        .fb-range,.fb-metric-tabs,.fb-audience-tabs{display:flex;flex-wrap:wrap;gap:5px}.fb-range{padding:4px;border:1px solid #e6eaf1;border-radius:10px;background:#f2f4f9}.fb-range button,.fb-metric-tabs button,.fb-audience-tabs button{min-height:32px;border:0;border-radius:8px;padding:0 11px;background:#f2f5f9;color:#66728a;font-size:10px;font-weight:900}.fb-range button.active,.fb-metric-tabs button.active,.fb-audience-tabs button.active{background:white;color:#1877f2;box-shadow:0 3px 10px rgba(42,56,105,.07)}.fb-audience-tabs button.active{background:#1877f2;color:white}.fb-growth-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}.fb-growth-card{min-width:0;padding:14px;border:1px solid #e7eaf2;border-radius:14px;background:#fff}.fb-growth-card p{margin:0;color:#54617a;font-size:11px;font-weight:700}.fb-growth-card strong{display:block;margin-top:8px;font-size:24px;letter-spacing:-.04em}.fb-growth-card svg{width:100%;height:110px;margin-top:10px}
        .fb-performance-grid{display:grid;grid-template-columns:minmax(0,1.8fr) minmax(320px,.8fr);gap:16px}.fb-main-chart{width:100%;height:300px}.fb-main-chart.trend{height:320px;margin-top:8px}.fb-metric-tabs{margin-bottom:10px}.fb-performance-summary{display:flex;flex-direction:column}.fb-activity-row{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:11px 0;border-bottom:1px solid #edf0f6}.fb-activity-row:last-child{border-bottom:0}.fb-activity-row span,.fb-activity-row strong{display:block}.fb-activity-row span{color:#7d879b;font-size:10px}.fb-activity-row strong{margin-top:3px;font-size:17px}.fb-activity-row b{font-size:10px}.positive{color:#18a46f}.negative{color:#e45763}.fb-two-column{display:grid;grid-template-columns:1fr 1fr;gap:16px}.fb-audience-tabs{margin-bottom:16px}.fb-gender-summary{display:flex;gap:18px;margin-bottom:16px}.fb-gender-summary>div{display:flex;align-items:center;gap:7px;color:#59657a;font-size:10px}.fb-gender-summary i,.fb-type-legend i{width:9px;height:9px;border-radius:50%;flex:0 0 auto}.fb-gender-summary i.male,.fb-demo-row i.male{background:#73baff}.fb-gender-summary i.female,.fb-demo-row i.female{background:#1877f2}.fb-demographic-bars,.fb-location-list{display:grid;gap:11px}.fb-demo-row{display:grid;grid-template-columns:70px 1fr 44px;gap:10px;align-items:center;color:#59657a;font-size:10px}.fb-demo-row>div{display:flex;gap:3px;height:11px;align-items:stretch}.fb-demo-row i{display:block;height:100%;border-radius:4px}.fb-demo-row strong{text-align:right;font-size:10px}.fb-location-list>div{display:grid;grid-template-columns:190px 1fr 42px;gap:10px;align-items:center;color:#59657a;font-size:10px}.fb-location-list>div>div,.fb-reach-mix>div>div{height:9px;border-radius:999px;background:#eef0f6;overflow:hidden}.fb-location-list i,.fb-reach-mix i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#1877f2,#67a9ff)}.fb-location-list strong{text-align:right;font-size:10px}
        .fb-content-type-layout{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:center}.fb-donut{width:150px;height:150px;margin:0 auto;border-radius:50%;display:grid;place-items:center;position:relative}.fb-donut:after{content:"";position:absolute;inset:22px;border-radius:50%;background:white}.fb-donut>div{position:relative;z-index:2;text-align:center}.fb-donut strong,.fb-donut span{display:block}.fb-donut strong{font-size:22px}.fb-donut span{margin-top:3px;color:#8b93a7;font-size:9px}.fb-type-legend{display:grid;gap:13px}.fb-type-legend>div{display:grid;grid-template-columns:12px 1fr auto;gap:8px;align-items:center;color:#59657a;font-size:10px}.fb-type-legend .c1{background:#1877f2}.fb-type-legend .c2{background:#59a4ff}.fb-type-legend .c3{background:#8bc2ff}.fb-type-legend .c4{background:#b7d9ff}.fb-reach-mix{margin-top:22px;padding-top:16px;border-top:1px solid #edf0f6}.fb-reach-mix h3{margin:0 0 12px;font-size:12px}.fb-reach-mix>div{display:grid;grid-template-columns:92px 1fr 42px;gap:10px;align-items:center;margin-top:9px;color:#59657a;font-size:10px}.fb-reach-mix strong{text-align:right;font-size:10px}
        .fb-ai-card{border-color:#cfe2ff;background:linear-gradient(180deg,#fff,#fbfdff)}.fb-ai-label{margin:0 0 5px!important;color:#1877f2!important;font-size:9px!important;font-weight:900;letter-spacing:.12em}.fb-ai-action{display:flex;align-items:center;gap:8px}.fb-ai-action span{padding:8px 11px;border-radius:999px;background:#eef5ff;color:#69718a;font-size:10px;font-weight:800}.fb-ai-action button{min-height:40px;border:0;border-radius:10px;padding:0 15px;background:#1877f2;color:white;font-size:11px;font-weight:900}.fb-ai-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}.fb-ai-kpis>div{padding:12px 14px;border:1px solid #edf0f7;border-radius:12px;background:#f8f9fd}.fb-ai-kpis span,.fb-ai-kpis strong{display:block}.fb-ai-kpis span{color:#8b93a7;font-size:9px;font-weight:800;letter-spacing:.06em}.fb-ai-kpis strong{margin-top:5px;font-size:20px}.fb-ai-preview{display:grid;grid-template-columns:1fr 1fr;gap:12px}.fb-ai-preview>div{grid-column:1/-1;padding:15px 17px;border:1px solid #e6e9f3;border-radius:12px;background:#fbfcff}.fb-ai-preview>div>span{color:#1877f2;font-size:9px;font-weight:900;letter-spacing:.08em}.fb-ai-preview p{margin:8px 0 0;color:#55627b;font-size:11px;line-height:1.6}.fb-ai-preview article{padding:15px 17px;border-radius:12px}.fb-ai-preview article.working{border:1px solid #ccefe0;background:#f4fcf8}.fb-ai-preview article.attention{border:1px solid #ffe0b7;background:#fffaf2}.fb-ai-preview h3{margin:0;font-size:11px}.fb-ai-preview ul{margin:9px 0 0;padding-left:18px;color:#59657a;font-size:10px;line-height:1.65}
        .fb-table-wrap{overflow-x:auto}.fb-table{width:100%;min-width:1180px;border-collapse:collapse;font-size:10px}.fb-table th{padding:10px;background:#f7f8fc;border-bottom:1px solid #e7eaf2;color:#8791a7;font-size:9px;text-align:left}.fb-table td{padding:12px 10px;border-bottom:1px solid #eef1f6;color:#56627a;font-weight:600}.fb-table td.title{max-width:360px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fb-table a{color:#1877f2;text-decoration:none;font-weight:900}.fb-badge{display:inline-flex;padding:5px 8px;border-radius:999px;font-size:9px;font-weight:900}.fb-badge.reel{background:#eef4ff;color:#1877f2}.fb-badge.video{background:#edf7ff;color:#3379b7}.fb-badge.photo{background:#eefaf3;color:#16865a}.fb-badge.link{background:#fff5e8;color:#ce7a29}.fb-table-foot{display:flex;justify-content:space-between;gap:12px;padding:16px 2px 2px;color:#8b93a7;font-size:10px}.fb-footer{padding:20px 0 0;text-align:center;color:#a0a7b9;font-size:9px}
        @media(max-width:1220px){.fb-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.fb-growth-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.fb-performance-grid,.fb-two-column{grid-template-columns:1fr}.fb-banner{grid-template-columns:1fr auto}.fb-banner-stats{display:none}}@media(max-width:720px){.fb-main{padding:18px}.fb-topbar{display:block}.fb-top-actions{margin-top:12px}.fb-banner{grid-template-columns:1fr;padding:22px}.fb-banner>button{justify-self:start}.fb-filter{grid-template-columns:1fr}.fb-filter-meta{display:block}.fb-filter-meta span{display:block;margin-top:5px}.fb-summary-grid,.fb-growth-grid,.fb-ai-kpis,.fb-ai-preview{grid-template-columns:1fr}.fb-content-type-layout{grid-template-columns:1fr}.fb-location-list>div{grid-template-columns:130px 1fr 38px}}
      `}</style>
    </main>
  );
}
