import Sidebar from "@/components/Sidebar";
import { getTikTokLiveData } from "@/lib/tiktok-live";
import TikTokLiveKpiCard from "@/components/TikTokLiveKpiCard";
import TikTokLivePerformanceChart from "@/components/TikTokLivePerformanceChart";
import TikTokLiveEngagementChart from "@/components/TikTokLiveEngagementChart";
import TikTokLiveWatchTime from "@/components/TikTokLiveWatchTime";
import TikTokLiveSessionsTable from "@/components/TikTokLiveSessionsTable";
import TikTokLiveLeadKpi from "@/components/TikTokLiveLeadKpi";
import TikTokLiveLeadTable from "@/components/TikTokLiveLeadTable";

export const dynamic = "force-dynamic";

export default async function TikTokLivePage() {
  const { sessions, leads } = await getTikTokLiveData();

  const totalViews = sessions.reduce(
    (sum: number, item: any) => sum + Number(item.views || 0),
    0
  );

  const peakViewers =
    sessions.length > 0
      ? Math.max(
          ...sessions.map((item: any) =>
            Number(item.peak_viewers || 0)
          )
        )
      : 0;

  const totalLikes = sessions.reduce(
    (sum: number, item: any) => sum + Number(item.likes || 0),
    0
  );

  const totalComments = sessions.reduce(
    (sum: number, item: any) => sum + Number(item.comments || 0),
    0
  );

  const totalShares = sessions.reduce(
    (sum: number, item: any) => sum + Number(item.shares || 0),
    0
  );

  const totalLeads = leads.length;

  const qualifiedLeads = leads.filter(
    (item: any) => item.status === "Qualified"
  ).length;

  const spkGenerated = leads.filter(
    (item: any) => item.status === "SPK"
  ).length;

  const totalWatchTime = sessions.reduce(
    (sum: number, item: any) =>
      sum + Number(item.watch_time || 0),
    0
  );

  const averageWatchTime =
    sessions.length > 0
      ? Math.round(
          sessions.reduce(
            (sum: number, item: any) =>
              sum + Number(item.average_watch_time || 0),
            0
          ) / sessions.length
        )
      : 0;

  const engagementRate =
    totalViews > 0
      ? ((totalLikes + totalComments + totalShares) / totalViews) * 100
      : 0;

  const chartData = sessions.map((item: any) => ({
    live_date: item.live_date,
    views: Number(item.views || 0),
    peak_viewers: Number(item.peak_viewers || 0),
  }));

  const kpis = [
    {
      title: "Total Views",
      value: totalViews,
      icon: "👁"
    },
    {
      title: "Peak Viewers",
      value: peakViewers,
      icon: "👥"
    },
    {
      title: "Likes",
      value: totalLikes,
      icon: "❤️"
    },
    {
      title: "Comments",
      value: totalComments,
      icon: "💬"
    },
    {
      title: "Shares",
      value: totalShares,
      icon: "🔗"
    },
    {
      title: "Total Leads",
      value: totalLeads,
      icon: "📄"
    }
  ];

  return (
    <div className="app-shell">
      <Sidebar activeItem="TikTok Live" />

      <main className="main-content">

        <header className="topbar">
          <div>
            <h1>TikTok Live Performance</h1>
            <p>
              Marketing Performance & Lead Generation Dashboard
            </p>
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
          {kpis.map((item) => (
            <TikTokLiveKpiCard
              key={item.title}
              title={item.title}
              value={item.value}
              icon={item.icon}
            />
          ))}
        </section>


        <TikTokLivePerformanceChart data={chartData} />


        <TikTokLiveEngagementChart
          likes={totalLikes}
          comments={totalComments}
          shares={totalShares}
          engagementRate={engagementRate}
        />


        <TikTokLiveWatchTime
          totalWatchTime={totalWatchTime}
          averageWatchTime={averageWatchTime}
        />


        <TikTokLiveSessionsTable
          data={sessions}
        />


        <TikTokLiveLeadKpi
          total={totalLeads}
          qualified={qualifiedLeads}
          spk={spkGenerated}
        />


        <TikTokLiveLeadTable
          data={leads}
        />

      </main>
    </div>
  );
}