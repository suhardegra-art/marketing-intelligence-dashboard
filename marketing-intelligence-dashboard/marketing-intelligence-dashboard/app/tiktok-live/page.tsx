import Sidebar from "@/components/Sidebar";

export const dynamic = "force-dynamic";

export default function TikTokLivePage() {
  return (
    <div className="app-shell">
      <Sidebar activeItem="TikTok Live" />

      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>TikTok Live Performance</h1>
            <p>Marketing Performance & Lead Generation Dashboard</p>
          </div>
        </header>

        <section
          style={{
            borderRadius: 18,
            padding: "30px",
            marginBottom: 16,
            background:
              "linear-gradient(120deg,#111827 0%,#4f46e5 55%,#7c3aed 100%)",
            color: "white"
          }}
        >
          <h2 style={{ margin: 0 }}>
            LIVE BRINGS REAL IMPACT
          </h2>
          <p style={{ marginTop: 8, opacity: 0.8 }}>
            More Viewers. More Engagement. More Leads.
          </p>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6,minmax(0,1fr))",
            gap: 12
          }}
        >
          {[
            "Total Views",
            "Peak Viewers",
            "Likes",
            "Comments",
            "Shares",
            "Total Leads"
          ].map((item) => (
            <article className="kpi-card" key={item}>
              <p>{item}</p>
              <strong>—</strong>
            </article>
          ))}
        </section>

        <section className="panel" style={{ marginTop: 16 }}>
          <h3>TikTok Live Dashboard</h3>
          <p>
            Database connection will use tiktok_live_sessions and
            tiktok_live_leads.
          </p>
        </section>
      </main>
    </div>
  );
}
