import Sidebar from "@/components/Sidebar";
import KpiCard from "@/components/KpiCard";
import BarChart from "@/components/BarChart";
import { getSupabaseConnectionStatus } from "@/lib/supabase";

const onlineData = [
  { label: "Instagram", value: 61, display: "2.7M" },
  { label: "TikTok", value: 94, display: "4.2M" },
  { label: "Facebook", value: 29, display: "1.3M" },
  { label: "YouTube", value: 38, display: "1.7M" },
  { label: "Website", value: 44, display: "2.0M" }
];

const offlineData = [
  { label: "Launching", value: 64, display: "610" },
  { label: "Annual Event", value: 82, display: "780" },
  { label: "Side Event", value: 46, display: "440" },
  { label: "Regional Event", value: 71, display: "680" }
];

const content = [
  ["01", "Jelajah Kota Tanpa Batas", "TikTok", "1.2M", "7.8%", "92"],
  ["02", "Product Proof: Range Test", "Instagram", "940K", "8.5%", "88"],
  ["03", "Weekend Ride Highlights", "TikTok", "805K", "6.9%", "70"],
  ["04", "Feature Explainer", "YouTube", "530K", "5.8%", "41"]
];

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabaseStatus = await getSupabaseConnectionStatus();

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>Marketing Intelligence Dashboard</h1>
            <p>Turning Data Into Greater Impact</p>
          </div>
          <div className="topbar-actions">
            <div className="period-select"><span>Period</span><strong>September 2026</strong></div>
            <div className="period-select"><span>Comparison</span><strong>vs. August 2026</strong></div>
            <div className="avatar">IM</div>
            <form action="/api/logout" method="post"><button className="logout-button">Logout</button></form>
          </div>
        </header>

        <section className="hero-banner">
          <div>
            <p className="hero-overline">INDOMOBIL eMOTOR</p>
            <h2>Marketing Performance</h2>
            <p>One view for online, website, offline activities, leads, and management insights.</p>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-ring ring-a" />
            <div className="hero-ring ring-b" />
            <div className="vehicle-shape"><div className="wheel wheel-left"/><div className="wheel wheel-right"/><div className="vehicle-body"/></div>
          </div>
        </section>

        <section className={`connection-strip ${supabaseStatus.connected ? "connected" : "disconnected"}`}>
          <div className="connection-main">
            <span className="connection-dot" aria-hidden="true" />
            <div>
              <strong>{supabaseStatus.connected ? "Supabase Connected" : "Supabase Not Connected"}</strong>
              <p>{supabaseStatus.message}</p>
            </div>
          </div>
          <div className="connection-stat">
            <span>Social Accounts</span>
            <strong>{supabaseStatus.accountCount ?? "—"}</strong>
          </div>
        </section>

        <section className="kpi-grid">
          <KpiCard label="Total Views" value="12.8M" change="18.5%" accent="purple" />
          <KpiCard label="Reach" value="6.7M" change="12.2%" accent="blue" />
          <KpiCard label="Interactions" value="486K" change="9.8%" accent="pink" />
          <KpiCard label="Followers" value="82.4K" change="4.6%" accent="green" />
          <KpiCard label="Leads" value="1,245" change="24.2%" accent="orange" />
          <KpiCard label="SPK" value="386" change="13.7%" accent="indigo" />
          <KpiCard label="Marketing Spend" value="Rp 428M" change="5.4%" positive={false} accent="red" />
        </section>

        <section className="two-column">
          <article className="panel">
            <div className="panel-header"><div><h3>Online Performance</h3><p>Platform contribution by views</p></div><button>Views ▾</button></div>
            <BarChart data={onlineData} max={100} />
          </article>
          <article className="panel">
            <div className="panel-header"><div><h3>Offline Performance</h3><p>Lead contribution by event category</p></div><button>Leads ▾</button></div>
            <BarChart data={offlineData} max={100} />
          </article>
        </section>

        <section className="two-column lower-grid">
          <article className="panel">
            <div className="panel-header"><div><h3>Lead Funnel</h3><p>From total traffic to delivery order</p></div></div>
            <div className="funnel">
              <div className="funnel-row"><span>Total Traffic</span><div style={{width:"100%"}}>82,450</div></div>
              <div className="funnel-row"><span>Leads</span><div style={{width:"76%"}}>1,245</div></div>
              <div className="funnel-row"><span>Test Ride</span><div style={{width:"55%"}}>742</div></div>
              <div className="funnel-row"><span>SPK</span><div style={{width:"34%"}}>386</div></div>
              <div className="funnel-row"><span>Delivery Order</span><div style={{width:"24%"}}>271</div></div>
            </div>
          </article>

          <article className="panel event-card">
            <div className="event-visual"><span>EVENT HIGHLIGHT</span><strong>September Regional Activation</strong></div>
            <div className="event-metrics">
              <div><span>Foot Traffic</span><strong>12,480</strong></div>
              <div><span>Leads</span><strong>426</strong></div>
              <div><span>SPK</span><strong>128</strong></div>
              <div><span>Budget</span><strong>Rp 92M</strong></div>
            </div>
          </article>
        </section>

        <section className="panel table-panel">
          <div className="panel-header"><div><h3>Top Performing Content</h3><p>Highest-performing content for September 2026</p></div><button>View All</button></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Rank</th><th>Content</th><th>Platform</th><th>Views</th><th>ER</th><th>Leads</th></tr></thead>
              <tbody>{content.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={index}>{cell}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className="ai-section">
          <div className="section-heading"><div><span className="ai-icon">✦</span><div><h3>AI Marketing Insight</h3><p>Demo insights generated from the current dashboard metrics</p></div></div></div>
          <div className="insight-grid">
            <article className="insight success"><span>WHAT'S WORKING</span><h4>TikTok drives the largest view contribution</h4><p>Short-form video contributes the highest volume this period. Product Proof content is also outperforming the average engagement rate.</p></article>
            <article className="insight warning"><span>NEEDS ATTENTION</span><h4>Spend is increasing faster than SPK</h4><p>Marketing spend rose while SPK growth remained moderate. Review campaign-level CPL and cost per SPK before scaling budget.</p></article>
            <article className="insight opportunity"><span>OPPORTUNITY</span><h4>Connect high-view content to lead actions</h4><p>Add stronger Test Ride and dealer CTAs to top-performing content to improve the path from awareness to qualified leads.</p></article>
            <article className="insight recommendation"><span>RECOMMENDATION</span><h4>Prioritize measurable conversion content</h4><p>Increase Product Proof, Test & Prove, and CTA-led formats while maintaining entertainment content for reach growth.</p></article>
          </div>
        </section>

        <footer>Marketing Intelligence Dashboard • Personal Prototype V1</footer>
      </main>
    </div>
  );
}
