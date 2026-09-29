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
type PerformanceMetric =
  | "views"
  | "reach"
  | "interactions"
  | "profileViews"
  | "linkTaps"
  | "follows";

type AudienceTab = "demographic" | "cities" | "countries";

type ContentRow = {
  id: number;
  date: string;
  caption: string;
  type: "Reel" | "Post" | "Carousel";
  views: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
};

const RANGE_DAYS: Record<RangeKey, number> = {
  "7D": 7,
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365
};

const PERFORMANCE_LABELS: Record<PerformanceMetric, string> = {
  views: "Views",
  reach: "Reach",
  interactions: "Interactions",
  profileViews: "Profile Views",
  linkTaps: "Link Taps",
  follows: "Follows"
};

const dailyData = [
  { date: "22 Aug", views: 18500, reach: 12000, interactions: 180, profileViews: 520, linkTaps: 0, follows: 40 },
  { date: "24 Aug", views: 8500, reach: 6100, interactions: 360, profileViews: 410, linkTaps: 0, follows: 35 },
  { date: "27 Aug", views: 2500, reach: 1800, interactions: 90, profileViews: 260, linkTaps: 0, follows: 280 },
  { date: "30 Aug", views: 9000, reach: 6500, interactions: 210, profileViews: 1400, linkTaps: 0, follows: 35 },
  { date: "02 Sep", views: 3500, reach: 2000, interactions: 120, profileViews: 320, linkTaps: 0, follows: 30 },
  { date: "04 Sep", views: 282000, reach: 258000, interactions: 630, profileViews: 2580, linkTaps: 430, follows: 2000 },
  { date: "05 Sep", views: 165000, reach: 126000, interactions: 760, profileViews: 1180, linkTaps: 380, follows: 70 },
  { date: "07 Sep", views: 22000, reach: 9500, interactions: 410, profileViews: 780, linkTaps: 135, follows: 490 },
  { date: "09 Sep", views: 3800, reach: 2100, interactions: 250, profileViews: 340, linkTaps: 0, follows: 45 },
  { date: "11 Sep", views: 4500, reach: 2600, interactions: 180, profileViews: 360, linkTaps: 0, follows: 35 },
  { date: "13 Sep", views: 7900, reach: 4300, interactions: 350, profileViews: 310, linkTaps: 0, follows: 60 },
  { date: "16 Sep", views: 6100, reach: 3600, interactions: 155, profileViews: 430, linkTaps: 0, follows: 40 },
  { date: "18 Sep", views: 11800, reach: 6800, interactions: 490, profileViews: 560, linkTaps: 0, follows: 65 }
];

const growthCards = [
  { title: "Follower Growth", value: "+6.9%", points: [2, 2.4, 2.8, 3.5, 4.6, 5.2, 6.9] },
  { title: "Views", value: "+942.7K", points: [12, 18, 24, 28, 60, 72, 94] },
  { title: "Reach", value: "+608.2K", points: [8, 11, 16, 22, 48, 54, 61] },
  { title: "Interactions", value: "+7.5K", points: [1, 2.2, 2.4, 3.1, 5.6, 6.4, 7.5] },
  { title: "Profile Activity", value: "+17.5K", points: [1, 1.3, 2.1, 4.2, 8.9, 13.8, 17.5] }
];

const contentRows: ContentRow[] = [
  { id: 1, date: "2026-09-18", caption: "Jalan licin? Tanjakan? Tetap pede! Motor listrik Indomobil eMotor...", type: "Reel", views: 82400, reach: 65100, likes: 923, comments: 31, shares: 144, saves: 88 },
  { id: 2, date: "2026-09-17", caption: "Daripada cuma jadi penghuni garasi, kenapa nggak di-upgrade...", type: "Reel", views: 62100, reach: 49300, likes: 704, comments: 26, shares: 121, saves: 75 },
  { id: 3, date: "2026-09-15", caption: "Siapa udah tau fitur TCS ini? Nggak perlu khawatir lagi...", type: "Carousel", views: 45500, reach: 38100, likes: 582, comments: 48, shares: 91, saves: 132 },
  { id: 4, date: "2026-09-13", caption: "Permisi yaa bu mau lewat ambil motor 😄", type: "Reel", views: 41200, reach: 33900, likes: 516, comments: 17, shares: 80, saves: 44 },
  { id: 5, date: "2026-09-12", caption: "Bawa banyak barang? Santai, bagasi Sprinto masih muat 😎", type: "Post", views: 38700, reach: 29600, likes: 438, comments: 39, shares: 76, saves: 120 },
  { id: 6, date: "2026-09-10", caption: "Nyuci motor listrik kena debu abu vulkanik? Gak perlu khawatir...", type: "Carousel", views: 35200, reach: 28100, likes: 401, comments: 42, shares: 69, saves: 143 },
  { id: 7, date: "2026-09-08", caption: "Nikmati Traction Control System, Hill Start Assist, dan Push Assist...", type: "Reel", views: 33100, reach: 26400, likes: 392, comments: 22, shares: 84, saves: 73 },
  { id: 8, date: "2026-09-06", caption: "Kami hadir di Indomobil Expo 2026 dengan berbagai pilihan...", type: "Post", views: 28600, reach: 21400, likes: 315, comments: 13, shares: 53, saves: 48 },
  { id: 9, date: "2026-09-03", caption: "Mulai dari memastikan motor mati, gunakan perlindungan diri...", type: "Carousel", views: 25400, reach: 19800, likes: 291, comments: 15, shares: 47, saves: 118 },
  { id: 10, date: "2026-09-01", caption: "Motor listrik untuk aktivitas sehari-hari, lebih praktis dan hemat...", type: "Reel", views: 23900, reach: 18400, likes: 276, comments: 18, shares: 45, saves: 39 },
  { id: 11, date: "2026-08-29", caption: "Tyranno untuk perjalanan jauh, cruise control bikin riding lebih santai...", type: "Reel", views: 21700, reach: 17100, likes: 252, comments: 11, shares: 41, saves: 32 },
  { id: 12, date: "2026-08-26", caption: "Adora Vibe untuk perjalanan harian dengan gaya yang lebih personal...", type: "Post", views: 19500, reach: 15100, likes: 231, comments: 9, shares: 33, saves: 54 }
];

const demographics = [
  { label: "18–24", male: 8.0, female: 5.0 },
  { label: "25–34", male: 24.3, female: 11.1 },
  { label: "35–44", male: 28.2, female: 7.0 },
  { label: "45–54", male: 11.0, female: 2.5 },
  { label: "55–64", male: 2.0, female: 0.6 },
  { label: "65+", male: 0.8, female: 0.2 }
];

const cities = [
  ["Daerah Khusus Ibukota Jakarta", 15.9],
  ["Kota Depok, Jawa Barat", 3.1],
  ["Kota Bekasi, Jawa Barat", 3.0],
  ["Kota Surabaya, Jawa Timur", 1.9],
  ["Kota Tangerang, Banten", 1.9],
  ["Kota Bandung, Jawa Barat", 1.7],
  ["Kota Palembang, Sumatera Selatan", 0.8],
  ["Kota Medan, Sumatera Utara", 0.8],
  ["Kota Bogor, Jawa Barat", 0.8],
  ["Kota Semarang, Jawa Tengah", 0.8]
] as const;

const countries = [
  ["Indonesia", 66.3],
  ["India", 21.0],
  ["Bangladesh", 2.5],
  ["Brazil", 2.0],
  ["United States", 1.0],
  ["Pakistan", 0.3],
  ["Nigeria", 0.2],
  ["China", 0.1],
  ["Uzbekistan", 0.1],
  ["United Kingdom", 0.1]
] as const;

function compact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function er(row: ContentRow) {
  if (!row.views) return 0;
  return ((row.likes + row.comments + row.shares + row.saves) / row.views) * 100;
}

function miniPath(values: number[]) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);
  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 92 - ((value - min) / range) * 72;
      return `${x},${y}`;
    })
    .join(" ");
}

export default function InstagramDashboardPreview() {
  const [range, setRange] = useState<RangeKey>("7D");
  const [metric, setMetric] = useState<PerformanceMetric>("views");
  const [audienceTab, setAudienceTab] = useState<AudienceTab>("demographic");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const filteredContent = useMemo(() => {
    if (!appliedFrom && !appliedTo) return contentRows;
    return contentRows.filter((row) => {
      const fromOk = appliedFrom ? row.date >= appliedFrom : true;
      const toOk = appliedTo ? row.date <= appliedTo : true;
      return fromOk && toOk;
    });
  }, [appliedFrom, appliedTo]);

  const summary = useMemo(() => {
    const views = filteredContent.reduce((sum, row) => sum + row.views, 0);
    const reach = filteredContent.reduce((sum, row) => sum + row.reach, 0);
    const interactions = filteredContent.reduce(
      (sum, row) => sum + row.likes + row.comments + row.shares + row.saves,
      0
    );
    return { views, reach, interactions };
  }, [filteredContent]);

  const topContent = useMemo(
    () => [...filteredContent].sort((a, b) => b.views - a.views).slice(0, 5),
    [filteredContent]
  );

  const contentTypeTotals = useMemo(() => {
    const totals = { Reel: 0, Post: 0, Carousel: 0 };
    filteredContent.forEach((row) => {
      totals[row.type] += row.views;
    });
    const total = Math.max(Object.values(totals).reduce((a, b) => a + b, 0), 1);
    return (Object.entries(totals) as Array<[keyof typeof totals, number]>).map(
      ([label, value]) => ({ label, value, pct: (value / total) * 100 })
    );
  }, [filteredContent]);

  const periodLabel =
    appliedFrom || appliedTo
      ? `${appliedFrom || "Start"} – ${appliedTo || "Latest"}`
      : "All publish dates";

  const summaryCards = [
    ["Followers (Current)", "31,015"],
    ["Views in Period", compact(appliedFrom || appliedTo ? summary.views : 939692)],
    ["Reach in Period", compact(appliedFrom || appliedTo ? summary.reach : 608200)],
    ["Interactions", compact(appliedFrom || appliedTo ? summary.interactions : 7500)],
    ["Profile Views", "15.5K"],
    ["Profile Link Taps", "2K"],
    ["Follows", "4.3K"],
    ["Unfollows", "2,152"]
  ];

  return (
    <main className="ig-main">
      <header className="ig-topbar">
        <div>
          <h1>Instagram Performance</h1>
          <p>Organic account and content insights from the Instagram API.</p>
        </div>

        <div className="ig-top-actions">
          <div className="ig-status-pill">
            <span>PREVIEW UI</span>
            <strong>API not connected</strong>
          </div>
          <div className="ig-avatar">IG</div>
        </div>
      </header>

      <section className="ig-banner">
        <div className="ig-banner-copy">
          <p>INSTAGRAM PROFESSIONAL ACCOUNT</p>
          <h2>Indomobil eMotor</h2>
          <span>@im.indomobil • Organic Performance & Audience Intelligence</span>
        </div>

        <div className="ig-banner-stats">
          <div><span>Followers</span><strong>31K</strong></div>
          <div><span>Views</span><strong>939.7K</strong></div>
          <div><span>Reach</span><strong>608.2K</strong></div>
        </div>

        <button type="button">Open Instagram ↗</button>
      </section>

      <section className="ig-panel ig-filter">
        <label>
          <span>FROM DATE</span>
          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
          />
        </label>

        <label>
          <span>TO DATE</span>
          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
          />
        </label>

        <button
          type="button"
          className="primary"
          onClick={() => {
            setAppliedFrom(fromDate);
            setAppliedTo(toDate);
          }}
        >
          Apply Period
        </button>

        <button
          type="button"
          className="soft"
          onClick={() => {
            setFromDate("");
            setToDate("");
            setAppliedFrom("");
            setAppliedTo("");
          }}
        >
          Reset
        </button>

        <div className="ig-filter-meta">
          Selected content period: <strong>{periodLabel}</strong>
          <span>Filter uses content publish date.</span>
        </div>
      </section>

      <section className="ig-summary-grid">
        {summaryCards.map(([label, value]) => (
          <article key={label} className="ig-kpi">
            <p>{label}</p>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="ig-panel">
        <div className="ig-section-head">
          <div>
            <h2>Instagram Growth</h2>
            <p>Historical organic growth and profile activity.</p>
          </div>

          <div className="ig-range">
            {(Object.keys(RANGE_DAYS) as RangeKey[]).map((key) => (
              <button
                type="button"
                key={key}
                className={range === key ? "active" : ""}
                onClick={() => setRange(key)}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        <div className="ig-growth-grid">
          {growthCards.map((card) => (
            <article className="ig-growth-card" key={card.title}>
              <p>{card.title}</p>
              <strong>{card.value}</strong>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline
                  points={miniPath(card.points)}
                  fill="none"
                  stroke="#5c6df1"
                  strokeWidth="3"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </article>
          ))}
        </div>
      </section>

      <section className="ig-performance-grid">
        <article className="ig-panel">
          <div className="ig-section-head">
            <div>
              <h2>Performance Trend</h2>
              <p>Daily account performance · selected period</p>
            </div>
          </div>

          <div className="ig-metric-tabs">
            {(Object.keys(PERFORMANCE_LABELS) as PerformanceMetric[]).map((key) => (
              <button
                type="button"
                key={key}
                className={metric === key ? "active" : ""}
                onClick={() => setMetric(key)}
              >
                {PERFORMANCE_LABELS[key]}
              </button>
            ))}
          </div>

          <div className="ig-main-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e9edf5" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8b93a7", fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8b93a7", fontSize: 10 }}
                  width={54}
                  tickFormatter={(value) => compact(Number(value))}
                />
                <Tooltip
                  formatter={(value: number | string) => [
                    compact(Number(value)),
                    PERFORMANCE_LABELS[metric]
                  ]}
                  contentStyle={{
                    border: "1px solid #e1e6ef",
                    borderRadius: 10,
                    fontSize: 11
                  }}
                />
                <Line
                  type="monotone"
                  dataKey={metric}
                  stroke="#5c6df1"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive
                  animationDuration={550}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="ig-panel ig-performance-summary">
          <div className="ig-section-head">
            <div>
              <h2>Profile Activity</h2>
              <p>Organic actions generated from Instagram.</p>
            </div>
          </div>

          {[
            ["Views", "939.7K", "+192.5%"],
            ["Reach", "608.2K", "+1.4K%"],
            ["Content Interactions", "7.5K", "-7.5%"],
            ["Profile Views", "15.5K", "+42%"],
            ["Link Taps", "2K", "+100%"],
            ["Net Follows", "+2,148", "+130.9%"]
          ].map(([label, value, change]) => (
            <div className="ig-activity-row" key={label}>
              <div>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
              <b className={change.startsWith("-") ? "negative" : "positive"}>
                {change}
              </b>
            </div>
          ))}
        </article>
      </section>

      <section className="ig-two-column">
        <article className="ig-panel">
          <div className="ig-section-head">
            <div>
              <h2>Audience</h2>
              <p>Follower demographics and location.</p>
            </div>
          </div>

          <div className="ig-audience-tabs">
            <button
              type="button"
              className={audienceTab === "demographic" ? "active" : ""}
              onClick={() => setAudienceTab("demographic")}
            >
              Age & Gender
            </button>
            <button
              type="button"
              className={audienceTab === "cities" ? "active" : ""}
              onClick={() => setAudienceTab("cities")}
            >
              Top Cities
            </button>
            <button
              type="button"
              className={audienceTab === "countries" ? "active" : ""}
              onClick={() => setAudienceTab("countries")}
            >
              Top Countries
            </button>
          </div>

          {audienceTab === "demographic" ? (
            <>
              <div className="ig-gender-summary">
                <div><i className="male" /><span>Male</span><strong>74.3%</strong></div>
                <div><i className="female" /><span>Female</span><strong>25.7%</strong></div>
              </div>

              <div className="ig-demographic-bars">
                {demographics.map((row) => (
                  <div className="ig-demo-row" key={row.label}>
                    <span>{row.label}</span>
                    <div>
                      <i className="male" style={{ width: `${row.male * 2.2}%` }} />
                      <i className="female" style={{ width: `${row.female * 2.2}%` }} />
                    </div>
                    <strong>{(row.male + row.female).toFixed(1)}%</strong>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {audienceTab === "cities" ? (
            <div className="ig-location-list">
              {cities.map(([label, pct]) => (
                <div key={label}>
                  <span>{label}</span>
                  <div><i style={{ width: `${Math.max(2, pct * 5.5)}%` }} /></div>
                  <strong>{pct}%</strong>
                </div>
              ))}
            </div>
          ) : null}

          {audienceTab === "countries" ? (
            <div className="ig-location-list">
              {countries.map(([label, pct]) => (
                <div key={label}>
                  <span>{label}</span>
                  <div><i style={{ width: `${Math.max(2, pct * 1.45)}%` }} /></div>
                  <strong>{pct}%</strong>
                </div>
              ))}
            </div>
          ) : null}
        </article>

        <article className="ig-panel">
          <div className="ig-section-head">
            <div>
              <h2>Views by Content Type</h2>
              <p>Organic views · selected period</p>
            </div>
          </div>

          <div className="ig-content-type-layout">
            <div
              className="ig-donut"
              style={{
                background: `conic-gradient(
                  #6d5cf5 0 ${contentTypeTotals[0].pct}%,
                  #d14fba ${contentTypeTotals[0].pct}% ${contentTypeTotals[0].pct + contentTypeTotals[1].pct}%,
                  #f59c55 ${contentTypeTotals[0].pct + contentTypeTotals[1].pct}% 100%
                )`
              }}
            >
              <div>
                <strong>{compact(summary.views || 1)}</strong>
                <span>Total Views</span>
              </div>
            </div>

            <div className="ig-type-legend">
              {contentTypeTotals.map((row, index) => (
                <div key={row.label}>
                  <i className={`c${index + 1}`} />
                  <span>{row.label}</span>
                  <strong>{row.pct.toFixed(1)}%</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="ig-reach-mix">
            <h3>Audience Source</h3>
            <div>
              <span>Followers</span>
              <div><i style={{ width: "17.8%" }} /></div>
              <strong>17.8%</strong>
            </div>
            <div>
              <span>Non-followers</span>
              <div><i style={{ width: "82.2%" }} /></div>
              <strong>82.2%</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="ig-panel">
        <div className="ig-section-head">
          <div>
            <h2>Instagram Content Performance Trend</h2>
            <p>Current performance of content grouped by publish date.</p>
          </div>
          <div className="ig-range">
            {(Object.keys(RANGE_DAYS) as RangeKey[]).map((key) => (
              <button
                type="button"
                key={key}
                className={range === key ? "active" : ""}
                onClick={() => setRange(key)}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        <div className="ig-metric-tabs">
          {["Views", "Reach", "Likes", "Comments", "Shares", "Saves", "ER"].map(
            (label, index) => (
              <button type="button" key={label} className={index === 0 ? "active" : ""}>
                {label}
              </button>
            )
          )}
        </div>

        <div className="ig-main-chart trend">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={filteredContent.map((row) => ({
                date: row.date.slice(5).replace("-", "/"),
                value: row.views
              }))}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e9edf5" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8b93a7", fontSize: 10 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8b93a7", fontSize: 10 }}
                width={54}
                tickFormatter={(value) => compact(Number(value))}
              />
              <Tooltip
                formatter={(value: number | string) => [compact(Number(value)), "Views"]}
                contentStyle={{
                  border: "1px solid #e1e6ef",
                  borderRadius: 10,
                  fontSize: 11
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#6d5cf5"
                strokeWidth={3}
                dot={false}
                isAnimationActive
                animationDuration={550}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="ig-panel ig-ai-card">
        <div className="ig-section-head">
          <div>
            <p className="ig-ai-label">GEMINI AI</p>
            <h2>AI Content Performance Analysis</h2>
            <p>Evidence-based analysis of the selected Instagram content trend period.</p>
          </div>
          <div className="ig-ai-action">
            <span>Period: {range}</span>
            <button type="button">✦ Generate AI Analysis</button>
          </div>
        </div>

        <div className="ig-ai-kpis">
          <div><span>CONTENTS</span><strong>{filteredContent.length}</strong></div>
          <div><span>VIEWS</span><strong>{compact(summary.views)}</strong></div>
          <div><span>REACH</span><strong>{compact(summary.reach)}</strong></div>
          <div>
            <span>ENGAGEMENT</span>
            <strong>
              {summary.views
                ? `${((summary.interactions / summary.views) * 100).toFixed(2)}%`
                : "0.00%"}
            </strong>
          </div>
        </div>

        <div className="ig-ai-preview">
          <div>
            <span>EXECUTIVE SUMMARY</span>
            <p>
              Preview UI only. After the Instagram API and Gemini endpoint are connected,
              this section will analyze the same {range} content period shown in the chart above.
            </p>
          </div>

          <article className="working">
            <h3>What's Working</h3>
            <ul>
              <li>Reels contribute the largest share of views and non-follower reach.</li>
              <li>Content around practical product use generates stronger save and share signals.</li>
            </ul>
          </article>

          <article className="attention">
            <h3>Needs Attention</h3>
            <ul>
              <li>Monitor whether reach converts into profile visits and follows.</li>
              <li>Compare high-view content with engagement quality before scaling.</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="ig-panel">
        <div className="ig-section-head">
          <div>
            <h2>Top Content</h2>
            <p>Best-performing Instagram content in the selected publish-date period.</p>
          </div>
        </div>

        <div className="ig-table-wrap">
          <table className="ig-table">
            <thead>
              <tr>
                <th>#</th>
                <th>CONTENT</th>
                <th>TYPE</th>
                <th>PUBLISH DATE</th>
                <th>VIEWS</th>
                <th>REACH</th>
                <th>LIKES</th>
                <th>COMMENTS</th>
                <th>SAVES</th>
                <th>ER</th>
                <th>LINK</th>
              </tr>
            </thead>
            <tbody>
              {topContent.map((row, index) => (
                <tr key={row.id}>
                  <td>{index + 1}</td>
                  <td className="title">{row.caption}</td>
                  <td><span className={`ig-badge ${row.type.toLowerCase()}`}>{row.type}</span></td>
                  <td>{row.date}</td>
                  <td><strong>{number(row.views)}</strong></td>
                  <td>{number(row.reach)}</td>
                  <td>{number(row.likes)}</td>
                  <td>{number(row.comments)}</td>
                  <td>{number(row.saves)}</td>
                  <td>{er(row).toFixed(2)}%</td>
                  <td><a href="#" onClick={(event) => event.preventDefault()}>Open ↗</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ig-panel">
        <div className="ig-section-head">
          <div>
            <h2>Instagram Content</h2>
            <p>{filteredContent.length} content items in selected period • Preview data</p>
          </div>
          <button type="button" className="ig-download">↓ Download CSV ▾</button>
        </div>

        <div className="ig-table-wrap">
          <table className="ig-table content">
            <thead>
              <tr>
                <th>DATE</th>
                <th>CONTENT</th>
                <th>TYPE</th>
                <th>VIEWS</th>
                <th>REACH</th>
                <th>LIKES</th>
                <th>COMMENTS</th>
                <th>SHARES</th>
                <th>SAVES</th>
                <th>ER</th>
                <th>LINK</th>
              </tr>
            </thead>
            <tbody>
              {filteredContent.map((row) => (
                <tr key={row.id}>
                  <td>{row.date}</td>
                  <td className="title">{row.caption}</td>
                  <td><span className={`ig-badge ${row.type.toLowerCase()}`}>{row.type}</span></td>
                  <td><strong>{number(row.views)}</strong></td>
                  <td>{number(row.reach)}</td>
                  <td>{number(row.likes)}</td>
                  <td>{number(row.comments)}</td>
                  <td>{number(row.shares)}</td>
                  <td>{number(row.saves)}</td>
                  <td>{er(row).toFixed(2)}%</td>
                  <td><a href="#" onClick={(event) => event.preventDefault()}>Open ↗</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ig-table-foot">
          <span>Showing 1–{filteredContent.length} of {filteredContent.length} content items</span>
          <strong>100 content / page</strong>
        </div>
      </section>

      <footer className="ig-footer">
        Instagram Analytics Dashboard • Preview UI • Read-only organic insights
      </footer>

      <style jsx global>{`
        .ig-main {
          min-width: 0;
          padding: 24px 28px 36px;
          background: #f4f6fb;
        }

        .ig-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 20px;
        }

        .ig-topbar h1 {
          margin: 0;
          font-size: 22px;
          letter-spacing: -.03em;
        }

        .ig-topbar p {
          margin: 5px 0 0;
          color: #7a839d;
          font-size: 12px;
        }

        .ig-top-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ig-status-pill {
          padding: 8px 12px;
          border: 1px solid #e1e5ef;
          border-radius: 10px;
          background: white;
        }

        .ig-status-pill span,
        .ig-status-pill strong {
          display: block;
        }

        .ig-status-pill span {
          color: #a0a8bb;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: .1em;
        }

        .ig-status-pill strong {
          margin-top: 2px;
          font-size: 10px;
        }

        .ig-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #f58529, #dd2a7b 45%, #8134af 70%, #515bd4);
          color: white;
          font-size: 10px;
          font-weight: 900;
        }

        .ig-banner {
          position: relative;
          overflow: hidden;
          min-height: 150px;
          padding: 26px 30px;
          margin-bottom: 16px;
          border-radius: 18px;
          display: grid;
          grid-template-columns: 1fr auto auto;
          align-items: center;
          gap: 24px;
          color: white;
          background:
            radial-gradient(circle at 78% 24%, rgba(255,255,255,.12), transparent 26%),
            linear-gradient(120deg, #241129 0%, #3b163d 52%, #7a2358 100%);
          box-shadow: 0 12px 30px rgba(40,20,50,.12);
        }

        .ig-banner-copy p {
          margin: 0 0 7px;
          color: #ffb5d6;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .13em;
        }

        .ig-banner-copy h2 {
          margin: 0;
          font-size: 30px;
          letter-spacing: -.04em;
        }

        .ig-banner-copy span {
          display: block;
          margin-top: 8px;
          color: rgba(255,255,255,.72);
          font-size: 12px;
        }

        .ig-banner-stats {
          display: flex;
          gap: 14px;
        }

        .ig-banner-stats div {
          min-width: 90px;
          padding: 11px 13px;
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 12px;
          background: rgba(255,255,255,.06);
        }

        .ig-banner-stats span,
        .ig-banner-stats strong {
          display: block;
        }

        .ig-banner-stats span {
          color: rgba(255,255,255,.62);
          font-size: 9px;
        }

        .ig-banner-stats strong {
          margin-top: 4px;
          font-size: 18px;
        }

        .ig-banner > button {
          min-height: 40px;
          border: 1px solid rgba(255,255,255,.22);
          border-radius: 10px;
          padding: 0 14px;
          background: rgba(255,255,255,.05);
          color: white;
          font-size: 11px;
          font-weight: 800;
        }

        .ig-panel {
          min-width: 0;
          margin-bottom: 16px;
          padding: 18px;
          border: 1px solid #e2e7ef;
          border-radius: 15px;
          background: white;
          box-shadow: 0 7px 18px rgba(39,48,92,.045);
        }

        .ig-filter {
          display: grid;
          grid-template-columns: 1fr 1fr auto auto;
          gap: 12px;
          align-items: end;
        }

        .ig-filter label {
          display: grid;
          gap: 6px;
        }

        .ig-filter label > span {
          color: #7a839d;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .08em;
        }

        .ig-filter input {
          min-height: 40px;
          border: 1px solid #dce1ef;
          border-radius: 10px;
          padding: 0 12px;
          background: #fbfcff;
          color: #141b34;
        }

        .ig-filter button,
        .ig-download {
          min-height: 40px;
          border-radius: 10px;
          padding: 0 16px;
          font-size: 11px;
          font-weight: 900;
        }

        .ig-filter button.primary {
          border: 0;
          background: #4059d7;
          color: white;
        }

        .ig-filter button.soft,
        .ig-download {
          border: 1px solid #dce1ef;
          background: white;
          color: #59617a;
        }

        .ig-filter-meta {
          grid-column: 1 / -1;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          color: #59617a;
          font-size: 10px;
        }

        .ig-filter-meta span {
          color: #9aa2b7;
        }

        .ig-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .ig-kpi {
          position: relative;
          overflow: hidden;
          padding: 16px;
          border: 1px solid #e2e7ef;
          border-radius: 14px;
          background: white;
          box-shadow: 0 7px 18px rgba(39,48,92,.045);
        }

        .ig-kpi:before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, #dd2a7b, #8134af);
        }

        .ig-kpi p {
          margin: 0 0 8px;
          color: #8a92a8;
          font-size: 10px;
          font-weight: 700;
        }

        .ig-kpi strong {
          display: block;
          font-size: 22px;
          letter-spacing: -.04em;
        }

        .ig-section-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
        }

        .ig-section-head h2 {
          margin: 0;
          font-size: 18px;
          letter-spacing: -.025em;
        }

        .ig-section-head p {
          margin: 4px 0 0;
          color: #8b93a7;
          font-size: 11px;
        }

        .ig-range,
        .ig-metric-tabs,
        .ig-audience-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .ig-range {
          padding: 4px;
          border: 1px solid #e6eaf1;
          border-radius: 10px;
          background: #f2f4f9;
        }

        .ig-range button,
        .ig-metric-tabs button,
        .ig-audience-tabs button {
          min-height: 32px;
          border: 0;
          border-radius: 8px;
          padding: 0 11px;
          background: #f2f5f9;
          color: #66728a;
          font-size: 10px;
          font-weight: 900;
        }

        .ig-range button.active,
        .ig-metric-tabs button.active,
        .ig-audience-tabs button.active {
          background: white;
          color: #6d5cf5;
          box-shadow: 0 3px 10px rgba(42,56,105,.07);
        }

        .ig-audience-tabs button.active {
          background: #6d5cf5;
          color: white;
        }

        .ig-growth-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 12px;
        }

        .ig-growth-card {
          min-width: 0;
          padding: 14px;
          border: 1px solid #e7eaf2;
          border-radius: 14px;
          background: #fff;
        }

        .ig-growth-card p {
          margin: 0;
          color: #54617a;
          font-size: 11px;
          font-weight: 700;
        }

        .ig-growth-card strong {
          display: block;
          margin-top: 8px;
          font-size: 24px;
          letter-spacing: -.04em;
        }

        .ig-growth-card svg {
          width: 100%;
          height: 110px;
          margin-top: 10px;
        }

        .ig-performance-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.8fr) minmax(320px, .8fr);
          gap: 16px;
        }

        .ig-main-chart {
          width: 100%;
          height: 300px;
        }

        .ig-main-chart.trend {
          height: 320px;
          margin-top: 8px;
        }

        .ig-metric-tabs {
          margin-bottom: 10px;
        }

        .ig-performance-summary {
          display: flex;
          flex-direction: column;
        }

        .ig-activity-row {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: center;
          padding: 11px 0;
          border-bottom: 1px solid #edf0f6;
        }

        .ig-activity-row:last-child {
          border-bottom: 0;
        }

        .ig-activity-row span,
        .ig-activity-row strong {
          display: block;
        }

        .ig-activity-row span {
          color: #7d879b;
          font-size: 10px;
        }

        .ig-activity-row strong {
          margin-top: 3px;
          font-size: 17px;
        }

        .ig-activity-row b {
          font-size: 10px;
        }

        .positive { color: #18a46f; }
        .negative { color: #e45763; }

        .ig-two-column {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .ig-audience-tabs {
          margin-bottom: 16px;
        }

        .ig-gender-summary {
          display: flex;
          gap: 18px;
          margin-bottom: 16px;
        }

        .ig-gender-summary > div {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #59657a;
          font-size: 10px;
        }

        .ig-gender-summary i,
        .ig-type-legend i {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          flex: 0 0 auto;
        }

        .ig-gender-summary i.male,
        .ig-demo-row i.male {
          background: #7ec8ee;
        }

        .ig-gender-summary i.female,
        .ig-demo-row i.female {
          background: #3f95c7;
        }

        .ig-demographic-bars,
        .ig-location-list {
          display: grid;
          gap: 11px;
        }

        .ig-demo-row {
          display: grid;
          grid-template-columns: 70px 1fr 44px;
          gap: 10px;
          align-items: center;
          color: #59657a;
          font-size: 10px;
        }

        .ig-demo-row > div {
          display: flex;
          gap: 3px;
          height: 11px;
          align-items: stretch;
        }

        .ig-demo-row i {
          display: block;
          height: 100%;
          border-radius: 4px;
        }

        .ig-demo-row strong {
          text-align: right;
          font-size: 10px;
        }

        .ig-location-list > div {
          display: grid;
          grid-template-columns: 190px 1fr 42px;
          gap: 10px;
          align-items: center;
          color: #59657a;
          font-size: 10px;
        }

        .ig-location-list > div > div,
        .ig-reach-mix > div > div {
          height: 9px;
          border-radius: 999px;
          background: #eef0f6;
          overflow: hidden;
        }

        .ig-location-list i,
        .ig-reach-mix i {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #dd2a7b, #8134af);
        }

        .ig-location-list strong {
          text-align: right;
          font-size: 10px;
        }

        .ig-content-type-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          align-items: center;
        }

        .ig-donut {
          width: 150px;
          height: 150px;
          margin: 0 auto;
          border-radius: 50%;
          display: grid;
          place-items: center;
          position: relative;
        }

        .ig-donut:after {
          content: "";
          position: absolute;
          inset: 22px;
          border-radius: 50%;
          background: white;
        }

        .ig-donut > div {
          position: relative;
          z-index: 2;
          text-align: center;
        }

        .ig-donut strong,
        .ig-donut span {
          display: block;
        }

        .ig-donut strong {
          font-size: 22px;
        }

        .ig-donut span {
          margin-top: 3px;
          color: #8b93a7;
          font-size: 9px;
        }

        .ig-type-legend {
          display: grid;
          gap: 13px;
        }

        .ig-type-legend > div {
          display: grid;
          grid-template-columns: 12px 1fr auto;
          gap: 8px;
          align-items: center;
          color: #59657a;
          font-size: 10px;
        }

        .ig-type-legend .c1 { background: #6d5cf5; }
        .ig-type-legend .c2 { background: #d14fba; }
        .ig-type-legend .c3 { background: #f59c55; }

        .ig-reach-mix {
          margin-top: 22px;
          padding-top: 16px;
          border-top: 1px solid #edf0f6;
        }

        .ig-reach-mix h3 {
          margin: 0 0 12px;
          font-size: 12px;
        }

        .ig-reach-mix > div {
          display: grid;
          grid-template-columns: 92px 1fr 42px;
          gap: 10px;
          align-items: center;
          margin-top: 9px;
          color: #59657a;
          font-size: 10px;
        }

        .ig-reach-mix strong {
          text-align: right;
          font-size: 10px;
        }

        .ig-ai-card {
          border-color: #ded9ff;
          background: linear-gradient(180deg, #fff, #fcfbff);
        }

        .ig-ai-label {
          margin: 0 0 5px !important;
          color: #7259dc !important;
          font-size: 9px !important;
          font-weight: 900;
          letter-spacing: .12em;
        }

        .ig-ai-action {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ig-ai-action span {
          padding: 8px 11px;
          border-radius: 999px;
          background: #f1effa;
          color: #69718a;
          font-size: 10px;
          font-weight: 800;
        }

        .ig-ai-action button {
          min-height: 40px;
          border: 0;
          border-radius: 10px;
          padding: 0 15px;
          background: #4059d7;
          color: white;
          font-size: 11px;
          font-weight: 900;
        }

        .ig-ai-kpis {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 14px;
        }

        .ig-ai-kpis > div {
          padding: 12px 14px;
          border: 1px solid #edf0f7;
          border-radius: 12px;
          background: #f8f9fd;
        }

        .ig-ai-kpis span,
        .ig-ai-kpis strong {
          display: block;
        }

        .ig-ai-kpis span {
          color: #8b93a7;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .06em;
        }

        .ig-ai-kpis strong {
          margin-top: 5px;
          font-size: 20px;
        }

        .ig-ai-preview {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .ig-ai-preview > div {
          grid-column: 1 / -1;
          padding: 15px 17px;
          border: 1px solid #e6e9f3;
          border-radius: 12px;
          background: #fbfcff;
        }

        .ig-ai-preview > div > span {
          color: #7259dc;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .08em;
        }

        .ig-ai-preview p {
          margin: 8px 0 0;
          color: #55627b;
          font-size: 11px;
          line-height: 1.6;
        }

        .ig-ai-preview article {
          padding: 15px 17px;
          border-radius: 12px;
        }

        .ig-ai-preview article.working {
          border: 1px solid #ccefe0;
          background: #f4fcf8;
        }

        .ig-ai-preview article.attention {
          border: 1px solid #ffe0b7;
          background: #fffaf2;
        }

        .ig-ai-preview h3 {
          margin: 0;
          font-size: 11px;
        }

        .ig-ai-preview ul {
          margin: 9px 0 0;
          padding-left: 18px;
          color: #59657a;
          font-size: 10px;
          line-height: 1.65;
        }

        .ig-table-wrap {
          overflow-x: auto;
        }

        .ig-table {
          width: 100%;
          min-width: 1100px;
          border-collapse: collapse;
          font-size: 10px;
        }

        .ig-table th {
          padding: 10px;
          background: #f7f8fc;
          border-bottom: 1px solid #e7eaf2;
          color: #8791a7;
          font-size: 9px;
          text-align: left;
        }

        .ig-table td {
          padding: 12px 10px;
          border-bottom: 1px solid #eef1f6;
          color: #56627a;
          font-weight: 600;
        }

        .ig-table td.title {
          max-width: 360px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ig-table a {
          color: #4059d7;
          text-decoration: none;
          font-weight: 900;
        }

        .ig-badge {
          display: inline-flex;
          padding: 5px 8px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 900;
        }

        .ig-badge.reel {
          background: #fff0f6;
          color: #c62977;
        }

        .ig-badge.post {
          background: #eef4ff;
          color: #4165cf;
        }

        .ig-badge.carousel {
          background: #fff5e8;
          color: #ce7a29;
        }

        .ig-table-foot {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 16px 2px 2px;
          color: #8b93a7;
          font-size: 10px;
        }

        .ig-footer {
          padding: 20px 0 0;
          text-align: center;
          color: #a0a7b9;
          font-size: 9px;
        }

        @media (max-width: 1220px) {
          .ig-summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .ig-growth-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .ig-performance-grid,
          .ig-two-column {
            grid-template-columns: 1fr;
          }

          .ig-banner {
            grid-template-columns: 1fr auto;
          }

          .ig-banner-stats {
            display: none;
          }
        }

        @media (max-width: 720px) {
          .ig-main {
            padding: 18px;
          }

          .ig-topbar {
            display: block;
          }

          .ig-top-actions {
            margin-top: 12px;
          }

          .ig-banner {
            grid-template-columns: 1fr;
            padding: 22px;
          }

          .ig-banner > button {
            justify-self: start;
          }

          .ig-filter {
            grid-template-columns: 1fr;
          }

          .ig-filter-meta {
            display: block;
          }

          .ig-filter-meta span {
            display: block;
            margin-top: 5px;
          }

          .ig-summary-grid,
          .ig-growth-grid,
          .ig-ai-kpis,
          .ig-ai-preview {
            grid-template-columns: 1fr;
          }

          .ig-content-type-layout {
            grid-template-columns: 1fr;
          }

          .ig-location-list > div {
            grid-template-columns: 130px 1fr 38px;
          }
        }
      `}</style>
    </main>
  );
}
