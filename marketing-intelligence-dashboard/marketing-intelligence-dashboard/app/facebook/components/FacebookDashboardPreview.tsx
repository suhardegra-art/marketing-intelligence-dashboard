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
type Metric = "reach" | "impressions" | "engagement" | "pageViews" | "linkClicks";
type AudienceTab = "age" | "cities" | "countries";

type PostRow = {
  id: number;
  date: string;
  title: string;
  type: "Photo" | "Video" | "Reel" | "Link";
  reach: number;
  impressions: number;
  reactions: number;
  comments: number;
  shares: number;
  clicks: number;
};

const RANGE_DAYS: Record<RangeKey, number> = {
  "7D": 7,
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365
};

const METRIC_LABELS: Record<Metric, string> = {
  reach: "Reach",
  impressions: "Impressions",
  engagement: "Engagement",
  pageViews: "Page Views",
  linkClicks: "Link Clicks"
};

const trendData = [
  { date: "22 Aug", reach: 8800, impressions: 12600, engagement: 310, pageViews: 420, linkClicks: 85 },
  { date: "25 Aug", reach: 9400, impressions: 13800, engagement: 355, pageViews: 460, linkClicks: 91 },
  { date: "28 Aug", reach: 12100, impressions: 17100, engagement: 510, pageViews: 540, linkClicks: 102 },
  { date: "31 Aug", reach: 15000, impressions: 22600, engagement: 670, pageViews: 690, linkClicks: 121 },
  { date: "03 Sep", reach: 17800, impressions: 26500, engagement: 810, pageViews: 740, linkClicks: 134 },
  { date: "06 Sep", reach: 24500, impressions: 36400, engagement: 1210, pageViews: 980, linkClicks: 176 },
  { date: "09 Sep", reach: 19600, impressions: 28800, engagement: 940, pageViews: 815, linkClicks: 149 },
  { date: "12 Sep", reach: 28600, impressions: 42100, engagement: 1480, pageViews: 1110, linkClicks: 201 },
  { date: "15 Sep", reach: 34200, impressions: 50800, engagement: 1810, pageViews: 1290, linkClicks: 234 },
  { date: "18 Sep", reach: 31100, impressions: 46900, engagement: 1640, pageViews: 1215, linkClicks: 219 }
];

const growthCards = [
  { title: "Follower Growth", value: "+4.8%", points: [2, 2.2, 2.6, 3.1, 3.4, 4.0, 4.8] },
  { title: "Reach", value: "+312.6K", points: [8, 12, 18, 21, 36, 44, 61] },
  { title: "Impressions", value: "+481.2K", points: [10, 16, 23, 32, 49, 70, 92] },
  { title: "Engagement", value: "+11.2K", points: [1, 1.6, 2.4, 3.2, 5.4, 7.8, 11.2] },
  { title: "Page Activity", value: "+8.9K", points: [1, 1.4, 2.1, 3.9, 5.7, 7.1, 8.9] }
];

const posts: PostRow[] = [
  { id: 1, date: "2026-09-18", title: "Tyranno untuk perjalanan harian dan adventure...", type: "Reel", reach: 56200, impressions: 81400, reactions: 1540, comments: 112, shares: 214, clicks: 390 },
  { id: 2, date: "2026-09-16", title: "Kenalan dengan fitur Cruise Control Tyranno...", type: "Video", reach: 43100, impressions: 65700, reactions: 1210, comments: 88, shares: 166, clicks: 302 },
  { id: 3, date: "2026-09-14", title: "Adora Vibe, pilihan warna untuk aktivitas harian...", type: "Photo", reach: 35800, impressions: 51200, reactions: 940, comments: 61, shares: 102, clicks: 245 },
  { id: 4, date: "2026-09-12", title: "Cari dealer Indomobil eMotor terdekat di kotamu...", type: "Link", reach: 29800, impressions: 44600, reactions: 510, comments: 74, shares: 89, clicks: 620 },
  { id: 5, date: "2026-09-10", title: "Sprinto: performa sporty untuk mobilitas kota...", type: "Reel", reach: 28400, impressions: 42100, reactions: 880, comments: 55, shares: 97, clicks: 238 },
  { id: 6, date: "2026-09-07", title: "QT untuk mobilitas praktis dan expressive...", type: "Photo", reach: 24100, impressions: 35600, reactions: 720, comments: 46, shares: 71, clicks: 184 },
  { id: 7, date: "2026-09-04", title: "Fast charging di dealer terpilih...", type: "Video", reach: 22100, impressions: 32100, reactions: 635, comments: 42, shares: 65, clicks: 177 },
  { id: 8, date: "2026-09-01", title: "Indomobil eMotor hadir lebih dekat dengan kamu...", type: "Link", reach: 19800, impressions: 28900, reactions: 488, comments: 36, shares: 51, clicks: 410 }
];

const audience = [
  { label: "18–24", male: 6.5, female: 4.2 },
  { label: "25–34", male: 20.1, female: 10.6 },
  { label: "35–44", male: 24.8, female: 8.9 },
  { label: "45–54", male: 13.8, female: 5.0 },
  { label: "55–64", male: 3.6, female: 1.7 },
  { label: "65+", male: 0.6, female: 0.2 }
];

const cities = [
  ["Jakarta", 21.4],
  ["Bekasi", 5.7],
  ["Bandung", 4.9],
  ["Surabaya", 4.1],
  ["Tangerang", 3.8],
  ["Depok", 3.5],
  ["Bogor", 2.9],
  ["Semarang", 2.4],
  ["Medan", 2.1],
  ["Palembang", 1.8]
] as const;

const countries = [
  ["Indonesia", 89.4],
  ["Malaysia", 2.8],
  ["Singapore", 1.5],
  ["India", 1.2],
  ["United States", 1.0],
  ["Thailand", 0.8],
  ["Philippines", 0.6],
  ["Australia", 0.5],
  ["Japan", 0.4],
  ["Other", 1.8]
] as const;

function compact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
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

export default function FacebookDashboardPreview() {
  const [range, setRange] = useState<RangeKey>("7D");
  const [metric, setMetric] = useState<Metric>("reach");
  const [audienceTab, setAudienceTab] = useState<AudienceTab>("age");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const filteredPosts = useMemo(() => {
    if (!appliedFrom && !appliedTo) return posts;

    return posts.filter((row) => {
      const fromOk = appliedFrom ? row.date >= appliedFrom : true;
      const toOk = appliedTo ? row.date <= appliedTo : true;
      return fromOk && toOk;
    });
  }, [appliedFrom, appliedTo]);

  const totals = useMemo(() => {
    return filteredPosts.reduce(
      (acc, row) => {
        acc.reach += row.reach;
        acc.impressions += row.impressions;
        acc.engagement += row.reactions + row.comments + row.shares;
        acc.clicks += row.clicks;
        return acc;
      },
      { reach: 0, impressions: 0, engagement: 0, clicks: 0 }
    );
  }, [filteredPosts]);

  const periodLabel =
    appliedFrom || appliedTo
      ? `${appliedFrom || "Start"} – ${appliedTo || "Latest"}`
      : "All publish dates";

  const summaryCards = [
    ["Followers (Current)", "28,420"],
    ["Reach in Period", compact(appliedFrom || appliedTo ? totals.reach : 312600)],
    ["Impressions", compact(appliedFrom || appliedTo ? totals.impressions : 481200)],
    ["Engagement", compact(appliedFrom || appliedTo ? totals.engagement : 11200)],
    ["Page Views", "8.9K"],
    ["Link Clicks", compact(appliedFrom || appliedTo ? totals.clicks : 4200)],
    ["New Followers", "1.9K"],
    ["Unfollows", "642"]
  ];

  return (
    <main className="fb-main">
      <header className="fb-topbar">
        <div>
          <h1>Facebook Performance</h1>
          <p>Organic page and content insights from the Meta Graph API.</p>
        </div>

        <div className="fb-top-actions">
          <div className="fb-status-pill">
            <span>PREVIEW UI</span>
            <strong>API not connected</strong>
          </div>
          <div className="fb-avatar">f</div>
        </div>
      </header>

      <section className="fb-banner">
        <div className="fb-banner-copy">
          <p>FACEBOOK BUSINESS PAGE</p>
          <h2>Indomobil eMotor</h2>
          <span>Organic Performance & Audience Intelligence</span>
        </div>

        <div className="fb-banner-stats">
          <div><span>Followers</span><strong>28.4K</strong></div>
          <div><span>Reach</span><strong>312.6K</strong></div>
          <div><span>Engagement</span><strong>11.2K</strong></div>
        </div>

        <button type="button">Open Facebook ↗</button>
      </section>

      <section className="fb-panel fb-filter">
        <label>
          <span>FROM DATE</span>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </label>

        <label>
          <span>TO DATE</span>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
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

        <div className="fb-filter-meta">
          Selected content period: <strong>{periodLabel}</strong>
          <span>Filter uses content publish date.</span>
        </div>
      </section>

      <section className="fb-summary-grid">
        {summaryCards.map(([label, value]) => (
          <article key={label} className="fb-kpi">
            <p>{label}</p>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="fb-panel">
        <div className="fb-section-head">
          <div>
            <h2>Facebook Growth</h2>
            <p>Historical organic growth and page activity.</p>
          </div>

          <div className="fb-range">
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

        <div className="fb-growth-grid">
          {growthCards.map((card) => (
            <article className="fb-growth-card" key={card.title}>
              <p>{card.title}</p>
              <strong>{card.value}</strong>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline
                  points={miniPath(card.points)}
                  fill="none"
                  stroke="#1877f2"
                  strokeWidth="3"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </article>
          ))}
        </div>
      </section>

      <section className="fb-performance-grid">
        <article className="fb-panel">
          <div className="fb-section-head">
            <div>
              <h2>Performance Trend</h2>
              <p>Daily Facebook page performance · selected period</p>
            </div>
          </div>

          <div className="fb-metric-tabs">
            {(Object.keys(METRIC_LABELS) as Metric[]).map((key) => (
              <button
                type="button"
                key={key}
                className={metric === key ? "active" : ""}
                onClick={() => setMetric(key)}
              >
                {METRIC_LABELS[key]}
              </button>
            ))}
          </div>

          <div className="fb-main-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e9edf5" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#8b93a7", fontSize: 10 }} />
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
                    METRIC_LABELS[metric]
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
                  stroke="#1877f2"
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

        <article className="fb-panel fb-performance-summary">
          <div className="fb-section-head">
            <div>
              <h2>Page Activity</h2>
              <p>Organic actions generated from Facebook.</p>
            </div>
          </div>

          {[
            ["Reach", "312.6K", "+38.2%"],
            ["Impressions", "481.2K", "+42.6%"],
            ["Post Engagement", "11.2K", "+17.4%"],
            ["Page Views", "8.9K", "+21.1%"],
            ["Link Clicks", "4.2K", "+31.5%"],
            ["Net Followers", "+1,258", "+9.8%"]
          ].map(([label, value, change]) => (
            <div className="fb-activity-row" key={label}>
              <div>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
              <b>{change}</b>
            </div>
          ))}
        </article>
      </section>

      <section className="fb-two-column">
        <article className="fb-panel">
          <div className="fb-section-head">
            <div>
              <h2>Audience</h2>
              <p>Facebook follower demographics and location.</p>
            </div>
          </div>

          <div className="fb-audience-tabs">
            <button className={audienceTab === "age" ? "active" : ""} onClick={() => setAudienceTab("age")}>Age & Gender</button>
            <button className={audienceTab === "cities" ? "active" : ""} onClick={() => setAudienceTab("cities")}>Top Cities</button>
            <button className={audienceTab === "countries" ? "active" : ""} onClick={() => setAudienceTab("countries")}>Top Countries</button>
          </div>

          {audienceTab === "age" ? (
            <>
              <div className="fb-gender-summary">
                <div><i className="male" /><span>Male</span><strong>69.4%</strong></div>
                <div><i className="female" /><span>Female</span><strong>30.6%</strong></div>
              </div>

              <div className="fb-demographic-bars">
                {audience.map((row) => (
                  <div className="fb-demo-row" key={row.label}>
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
            <div className="fb-location-list">
              {cities.map(([label, pct]) => (
                <div key={label}>
                  <span>{label}</span>
                  <div><i style={{ width: `${Math.max(2, pct * 4)}%` }} /></div>
                  <strong>{pct}%</strong>
                </div>
              ))}
            </div>
          ) : null}

          {audienceTab === "countries" ? (
            <div className="fb-location-list">
              {countries.map(([label, pct]) => (
                <div key={label}>
                  <span>{label}</span>
                  <div><i style={{ width: `${Math.max(2, pct)}%` }} /></div>
                  <strong>{pct}%</strong>
                </div>
              ))}
            </div>
          ) : null}
        </article>

        <article className="fb-panel">
          <div className="fb-section-head">
            <div>
              <h2>Content Mix</h2>
              <p>Reach contribution by Facebook content type.</p>
            </div>
          </div>

          <div className="fb-content-bars">
            {[
              ["Reels", 42],
              ["Videos", 27],
              ["Photos", 19],
              ["Links", 12]
            ].map(([label, pct]) => (
              <div key={String(label)}>
                <span>{label}</span>
                <div><i style={{ width: `${pct}%` }} /></div>
                <strong>{pct}%</strong>
              </div>
            ))}
          </div>

          <div className="fb-ai-note">
            <strong>Preview only</strong>
            <p>Data shown on this page is sample data. It will be replaced with live Facebook Page Insights after Meta Graph API is connected.</p>
          </div>
        </article>
      </section>

      <section className="fb-panel">
        <div className="fb-section-head">
          <div>
            <h2>Content Performance</h2>
            <p>Post and Reel performance · selected period</p>
          </div>
        </div>

        <div className="fb-table-wrap">
          <table className="fb-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Content</th>
                <th>Type</th>
                <th>Reach</th>
                <th>Impressions</th>
                <th>Reactions</th>
                <th>Comments</th>
                <th>Shares</th>
                <th>Clicks</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map((row) => (
                <tr key={row.id}>
                  <td>{row.date}</td>
                  <td className="title">{row.title}</td>
                  <td><span className={`fb-badge ${row.type.toLowerCase()}`}>{row.type}</span></td>
                  <td>{compact(row.reach)}</td>
                  <td>{compact(row.impressions)}</td>
                  <td>{compact(row.reactions)}</td>
                  <td>{compact(row.comments)}</td>
                  <td>{compact(row.shares)}</td>
                  <td>{compact(row.clicks)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="fb-footer">
        Facebook Analytics Dashboard • Preview UI • Read-only organic insights
      </footer>

      <style jsx global>{`
        .fb-main{min-width:0;padding:24px 28px 36px;background:#f4f6fb}
        .fb-topbar{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:20px}
        .fb-topbar h1{margin:0;font-size:22px;letter-spacing:-.03em}.fb-topbar p{margin:5px 0 0;color:#7a839d;font-size:12px}
        .fb-top-actions{display:flex;align-items:center;gap:10px}.fb-status-pill{padding:8px 12px;border:1px solid #e1e5ef;border-radius:10px;background:white}
        .fb-status-pill span,.fb-status-pill strong{display:block}.fb-status-pill span{color:#a0a8bb;font-size:8px;font-weight:900;letter-spacing:.1em}.fb-status-pill strong{margin-top:2px;font-size:10px}
        .fb-avatar{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:#1877f2;color:white;font-size:18px;font-weight:900}
        .fb-banner{position:relative;overflow:hidden;min-height:150px;padding:26px 30px;margin-bottom:16px;border-radius:18px;display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:24px;color:white;background:radial-gradient(circle at 78% 24%,rgba(255,255,255,.14),transparent 26%),linear-gradient(120deg,#0f2f5f 0%,#1259b9 52%,#1877f2 100%);box-shadow:0 12px 30px rgba(24,119,242,.14)}
        .fb-banner-copy p{margin:0 0 7px;color:#b8dcff;font-size:10px;font-weight:900;letter-spacing:.13em}.fb-banner-copy h2{margin:0;font-size:30px;letter-spacing:-.04em}.fb-banner-copy span{display:block;margin-top:8px;color:rgba(255,255,255,.76);font-size:12px}
        .fb-banner-stats{display:flex;gap:14px}.fb-banner-stats div{min-width:90px;padding:11px 13px;border:1px solid rgba(255,255,255,.16);border-radius:12px;background:rgba(255,255,255,.07)}
        .fb-banner-stats span,.fb-banner-stats strong{display:block}.fb-banner-stats span{color:rgba(255,255,255,.65);font-size:9px}.fb-banner-stats strong{margin-top:4px;font-size:18px}
        .fb-banner>button{min-height:40px;border:1px solid rgba(255,255,255,.22);border-radius:10px;padding:0 14px;background:rgba(255,255,255,.08);color:white;font-size:11px;font-weight:800}
        .fb-panel{min-width:0;margin-bottom:16px;padding:18px;border:1px solid #e2e7ef;border-radius:15px;background:white;box-shadow:0 7px 18px rgba(39,48,92,.045)}
        .fb-filter{display:grid;grid-template-columns:1fr 1fr auto auto;gap:12px;align-items:end}.fb-filter label{display:grid;gap:6px}.fb-filter label>span{color:#7a839d;font-size:9px;font-weight:800;letter-spacing:.08em}
        .fb-filter input{min-height:40px;border:1px solid #dce1ef;border-radius:10px;padding:0 12px;background:#fbfcff;color:#141b34}.fb-filter button{min-height:40px;border-radius:10px;padding:0 16px;font-size:11px;font-weight:900}
        .fb-filter button.primary{border:0;background:#1877f2;color:white}.fb-filter button.soft{border:1px solid #dce1ef;background:white;color:#59617a}
        .fb-filter-meta{grid-column:1/-1;display:flex;justify-content:space-between;gap:12px;color:#59617a;font-size:10px}.fb-filter-meta span{color:#9aa2b7}
        .fb-summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px}.fb-kpi{position:relative;overflow:hidden;padding:16px;border:1px solid #e2e7ef;border-radius:14px;background:white;box-shadow:0 7px 18px rgba(39,48,92,.045)}
        .fb-kpi:before{content:"";position:absolute;left:0;top:0;width:100%;height:3px;background:linear-gradient(90deg,#1877f2,#4f9df8)}.fb-kpi p{margin:0 0 8px;color:#8a92a8;font-size:10px;font-weight:700}.fb-kpi strong{display:block;font-size:22px;letter-spacing:-.04em}
        .fb-section-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:16px}.fb-section-head h2{margin:0;font-size:18px;letter-spacing:-.025em}.fb-section-head p{margin:4px 0 0;color:#8b93a7;font-size:11px}
        .fb-range,.fb-metric-tabs,.fb-audience-tabs{display:flex;flex-wrap:wrap;gap:5px}.fb-range{padding:4px;border:1px solid #e6eaf1;border-radius:10px;background:#f2f4f9}
        .fb-range button,.fb-metric-tabs button,.fb-audience-tabs button{min-height:32px;border:0;border-radius:8px;padding:0 11px;background:#f2f5f9;color:#66728a;font-size:10px;font-weight:900}
        .fb-range button.active,.fb-metric-tabs button.active,.fb-audience-tabs button.active{background:white;color:#1877f2;box-shadow:0 3px 10px rgba(42,56,105,.07)}.fb-audience-tabs button.active{background:#1877f2;color:white}
        .fb-growth-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}.fb-growth-card{min-width:0;padding:14px;border:1px solid #e7eaf2;border-radius:14px;background:#fff}
        .fb-growth-card p{margin:0;color:#54617a;font-size:11px;font-weight:700}.fb-growth-card strong{display:block;margin-top:8px;font-size:24px;letter-spacing:-.04em}.fb-growth-card svg{width:100%;height:110px;margin-top:10px}
        .fb-performance-grid{display:grid;grid-template-columns:minmax(0,1.8fr) minmax(320px,.8fr);gap:16px}.fb-main-chart{width:100%;height:300px}.fb-metric-tabs{margin-bottom:10px}
        .fb-performance-summary{display:flex;flex-direction:column}.fb-activity-row{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:11px 0;border-bottom:1px solid #edf0f6}.fb-activity-row:last-child{border-bottom:0}
        .fb-activity-row span,.fb-activity-row strong{display:block}.fb-activity-row span{color:#7d879b;font-size:10px}.fb-activity-row strong{margin-top:3px;font-size:17px}.fb-activity-row b{font-size:10px;color:#18a46f}
        .fb-two-column{display:grid;grid-template-columns:1fr 1fr;gap:16px}.fb-audience-tabs{margin-bottom:16px}.fb-gender-summary{display:flex;gap:18px;margin-bottom:16px}
        .fb-gender-summary>div{display:flex;align-items:center;gap:7px;color:#59657a;font-size:10px}.fb-gender-summary i{width:9px;height:9px;border-radius:50%;flex:0 0 auto}.fb-gender-summary i.male,.fb-demo-row i.male{background:#78b7ff}.fb-gender-summary i.female,.fb-demo-row i.female{background:#1877f2}
        .fb-demographic-bars,.fb-location-list,.fb-content-bars{display:grid;gap:11px}.fb-demo-row{display:grid;grid-template-columns:70px 1fr 44px;gap:10px;align-items:center;color:#59657a;font-size:10px}.fb-demo-row>div{display:flex;gap:3px;height:11px;align-items:stretch}.fb-demo-row i{display:block;height:100%;border-radius:4px}.fb-demo-row strong{text-align:right;font-size:10px}
        .fb-location-list>div,.fb-content-bars>div{display:grid;grid-template-columns:120px 1fr 42px;gap:10px;align-items:center;color:#59657a;font-size:10px}.fb-location-list>div>div,.fb-content-bars>div>div{height:9px;border-radius:999px;background:#eef0f6;overflow:hidden}.fb-location-list i,.fb-content-bars i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#1877f2,#67a9ff)}.fb-location-list strong,.fb-content-bars strong{text-align:right;font-size:10px}
        .fb-ai-note{margin-top:22px;padding:14px;border:1px solid #d9e9ff;border-radius:12px;background:#f7fbff}.fb-ai-note strong{font-size:11px;color:#1259b9}.fb-ai-note p{margin:6px 0 0;color:#647087;font-size:10px;line-height:1.55}
        .fb-table-wrap{overflow-x:auto}.fb-table{width:100%;min-width:1050px;border-collapse:collapse;font-size:10px}.fb-table th{padding:10px;background:#f7f8fc;border-bottom:1px solid #e7eaf2;color:#8791a7;font-size:9px;text-align:left}
        .fb-table td{padding:12px 10px;border-bottom:1px solid #eef1f6;color:#56627a;font-weight:600}.fb-table td.title{max-width:360px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fb-badge{display:inline-flex;padding:5px 8px;border-radius:999px;font-size:9px;font-weight:900}
        .fb-badge.reel{background:#eef4ff;color:#1877f2}.fb-badge.video{background:#edf7ff;color:#3379b7}.fb-badge.photo{background:#eefaf3;color:#16865a}.fb-badge.link{background:#fff5e8;color:#ce7a29}
        .fb-footer{padding:20px 0 0;text-align:center;color:#a0a7b9;font-size:9px}
        @media(max-width:1220px){.fb-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.fb-growth-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.fb-performance-grid,.fb-two-column{grid-template-columns:1fr}.fb-banner{grid-template-columns:1fr auto}.fb-banner-stats{display:none}}
        @media(max-width:720px){.fb-main{padding:18px}.fb-topbar{display:block}.fb-top-actions{margin-top:12px}.fb-banner{grid-template-columns:1fr;padding:22px}.fb-banner>button{justify-self:start}.fb-filter{grid-template-columns:1fr}.fb-filter-meta{display:block}.fb-filter-meta span{display:block;margin-top:5px}.fb-summary-grid,.fb-growth-grid{grid-template-columns:1fr}.fb-location-list>div,.fb-content-bars>div{grid-template-columns:105px 1fr 38px}}
      `}</style>
    </main>
  );
}
