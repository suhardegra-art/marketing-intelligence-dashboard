import Sidebar from "@/components/Sidebar";
import { getTikTokLiveData } from "@/lib/tiktok-live";
import TikTokLiveKpiCard from "@/components/TikTokLiveKpiCard";
import TikTokLivePerformanceChart from "@/components/TikTokLivePerformanceChart";
import TikTokLiveEngagementChart from "@/components/TikTokLiveEngagementChart";
import TikTokLiveWatchTime from "@/components/TikTokLiveWatchTime";
import TikTokLiveSessionsTable from "@/components/TikTokLiveSessionsTable";
import TikTokLiveLeadKpi from "@/components/TikTokLiveLeadKpi";
import TikTokLiveLeadTable from "@/components/TikTokLiveLeadTable";
import TikTokLiveConversionFunnel from "@/components/TikTokLiveConversionFunnel";
import TikTokLiveProductInterest from "@/components/TikTokLiveProductInterest";
import TikTokLiveAISummary from "@/components/TikTokLiveAISummary";
import TikTokLiveAIRecommendation from "@/components/TikTokLiveAIRecommendation";
import TikTokLiveDateFilter from "@/components/TikTokLiveDateFilter";


export const dynamic = "force-dynamic";


export default async function TikTokLivePage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
  }>;
}) {


  const {
    from,
    to
  } = await searchParams;


  const {
    sessions,
    leads,
    previousSessions,
    previousLeads
  } = await getTikTokLiveData(
    from,
    to
  );


  const totalViews =
    sessions.reduce(
      (sum:number,item:any)=>
        sum + Number(item.views || 0),
      0
    );


  const previousViews =
    previousSessions.reduce(
      (sum:number,item:any)=>
        sum + Number(item.views || 0),
      0
    );


  const totalLikes =
    sessions.reduce(
      (sum:number,item:any)=>
        sum + Number(item.likes || 0),
      0
    );


  const previousLikes =
    previousSessions.reduce(
      (sum:number,item:any)=>
        sum + Number(item.likes || 0),
      0
    );


  const totalComments =
    sessions.reduce(
      (sum:number,item:any)=>
        sum + Number(item.comments || 0),
      0
    );


  const previousComments =
    previousSessions.reduce(
      (sum:number,item:any)=>
        sum + Number(item.comments || 0),
      0
    );


  const totalShares =
    sessions.reduce(
      (sum:number,item:any)=>
        sum + Number(item.shares || 0),
      0
    );


  const previousShares =
    previousSessions.reduce(
      (sum:number,item:any)=
        sum + Number(item.shares || 0),
      0
    );


  const totalNewFollowers =
    sessions.reduce(
      (sum:number,item:any)=>
        sum + Number(item.new_followers || 0),
      0
    );


  const previousFollowers =
    previousSessions.reduce(
      (sum:number,item:any)=>
        sum + Number(item.new_followers || 0),
      0
    );


  const totalLeads =
    leads.length;


  const previousLeadsCount =
    previousLeads.length;


  const qualifiedLeads =
    leads.filter(
      (item:any)=>
        item.status === "Qualified"
    ).length;


  const previousQualified =
    previousLeads.filter(
      (item:any)=>
        item.status === "Qualified"
    ).length;


  const spkGenerated =
    leads.filter(
      (item:any)=>
        item.status === "SPK"
    ).length;


  const previousSpk =
    previousLeads.filter(
      (item:any)=>
        item.status === "SPK"
    ).length;


  const peakViewers =
    sessions.length > 0
      ? Math.max(
          ...sessions.map(
            (item:any)=>
              Number(item.peak_viewers || 0)
          )
        )
      : 0;


  const totalWatchTime =
    sessions.reduce(
      (sum:number,item:any)=>
        sum + Number(item.watch_time || 0),
      0
    );


  const averageWatchTime =
    sessions.length > 0
      ? Math.round(
          sessions.reduce(
            (sum:number,item:any)=>
              sum + Number(item.average_watch_time || 0),
            0
          ) / sessions.length
        )
      : 0;


  const engagementRate =
    totalViews > 0
      ?
        (
          (
            totalLikes +
            totalComments +
            totalShares
          )
          /
          totalViews
        ) * 100
      :
        0;


  const chartData =
    sessions.map(
      (item:any)=>({
        live_date:item.live_date,
        views:Number(item.views || 0),
        peak_viewers:Number(item.peak_viewers || 0),
      })
    );


  const kpis = [
    {
      title:"Total Views",
      value:totalViews,
      icon:"👁",
      current:totalViews,
      previous:previousViews
    },
    {
      title:"Peak Viewers",
      value:peakViewers,
      icon:"👥"
    },
    {
      title:"Likes",
      value:totalLikes,
      icon:"❤️",
      current:totalLikes,
      previous:previousLikes
    },
    {
      title:"Comments",
      value:totalComments,
      icon:"💬",
      current:totalComments,
      previous:previousComments
    },
    {
      title:"Shares",
      value:totalShares,
      icon:"🔗",
      current:totalShares,
      previous:previousShares
    },
    {
      title:"New Followers",
      value:totalNewFollowers,
      icon:"👤",
      current:totalNewFollowers,
      previous:previousFollowers
    },
    {
      title:"Total Leads",
      value:totalLeads,
      icon:"📄",
      current:totalLeads,
      previous:previousLeadsCount
    }
  ];


  return (

    <div className="app-shell">

      <Sidebar activeItem="TikTok Live" />


      <main className="main-content">


        <header className="topbar">

          <div>
            <h1>
              TikTok Live Performance
            </h1>

            <p>
              Marketing Performance & Lead Generation Dashboard
            </p>
          </div>

        </header>


        <section
          style={{
            borderRadius:18,
            padding:"30px",
            marginBottom:16,
            background:
              "linear-gradient(120deg,#111827 0%,#4f46e5 55%,#7c3aed 100%)",
            color:"white"
          }}
        >

          <h2>
            LIVE BRINGS REAL IMPACT
          </h2>

          <p>
            More Viewers. More Engagement. More Leads.
          </p>

        </section>


        <TikTokLiveDateFilter />


        <section
          style={{
            display:"grid",
            gridTemplateColumns:"repeat(7,minmax(0,1fr))",
            gap:12
          }}
        >

          {
            kpis.map(
              (item)=>(
                <TikTokLiveKpiCard
                  key={item.title}
                  title={item.title}
                  value={item.value}
                  icon={item.icon}
                  current={item.current}
                  previous={item.previous}
                />
              )
            )
          }

        </section>


        <TikTokLivePerformanceChart
          data={chartData}
        />


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
          previousTotal={previousLeadsCount}
          previousQualified={previousQualified}
          previousSpk={previousSpk}
        />


        <TikTokLiveConversionFunnel
          views={totalViews}
          leads={totalLeads}
          qualified={qualifiedLeads}
          spk={spkGenerated}
          previousViews={previousViews}
          previousLeads={previousLeadsCount}
          previousQualified={previousQualified}
          previousSpk={previousSpk}
        />


        <TikTokLiveProductInterest
          leads={leads}
        />


        <TikTokLiveAISummary
          sessions={sessions}
          leads={leads}
        />


        <TikTokLiveAIRecommendation
          sessions={sessions}
          leads={leads}
        />


        <TikTokLiveLeadTable
          data={leads}
        />


      </main>

    </div>

  );
}