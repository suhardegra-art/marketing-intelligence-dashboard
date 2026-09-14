import Sidebar from "@/components/Sidebar";
import { getTikTokAnalyticsData } from "@/lib/tiktok-analytics";
import TikTokLiveKpiCard from "@/components/TikTokLiveKpiCard";
import TikTokLivePerformanceChart from "@/components/TikTokLivePerformanceChart";
import TikTokLiveEngagementChart from "@/components/TikTokLiveEngagementChart";
import TikTokLiveWatchTime from "@/components/TikTokLiveWatchTime";
import TikTokLiveDateFilter from "@/components/TikTokLiveDateFilter";
import TikTokGrowthComparison from "@/components/TikTokGrowthComparison";


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
    contents,
    metrics,
    accountMetrics,

    currentDaily,
    previousDaily,

    currentFollowers,
    previousFollowers,

    previousMetrics,
    previousAccountMetrics,

    from: currentFrom,
    to: currentTo,

    previousFrom,
    previousTo

  } = await getTikTokAnalyticsData(
    from,
    to
  );


  /*
   * CURRENT PERIOD KPI
   */

  const totalViews =
    metrics.reduce(
      (
        sum: number,
        item: any
      ) =>
        sum +
        Number(item.views || 0),
      0
    );


  const totalLikes =
    metrics.reduce(
      (
        sum: number,
        item: any
      ) =>
        sum +
        Number(item.likes || 0),
      0
    );


  const totalComments =
    metrics.reduce(
      (
        sum: number,
        item: any
      ) =>
        sum +
        Number(item.comments || 0),
      0
    );


  const totalShares =
    metrics.reduce(
      (
        sum: number,
        item: any
      ) =>
        sum +
        Number(item.shares || 0),
      0
    );


  const totalVideos =
    contents.length;


  /*
   * FOLLOWERS
   */

  const followerDates =
    Object.keys(
      currentFollowers
    ).sort();


  const latestFollowers =
    followerDates.length > 0
      ? Number(
          currentFollowers[
            followerDates[
              followerDates.length - 1
            ]
          ] || 0
        )
      : 0;


  /*
   * ENGAGEMENT
   */

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


  /*
   * PREVIOUS PERIOD KPI
   */

  const previousTotalViews =
    previousMetrics.reduce(
      (
        sum: number,
        item: any
      ) =>
        sum +
        Number(item.views || 0),
      0
    );


  const previousTotalLikes =
    previousMetrics.reduce(
      (
        sum: number,
        item: any
      ) =>
        sum +
        Number(item.likes || 0),
      0
    );


  const previousTotalComments =
    previousMetrics.reduce(
      (
        sum: number,
        item: any
      ) =>
        sum +
        Number(item.comments || 0),
      0
    );


  const previousTotalShares =
    previousMetrics.reduce(
      (
        sum: number,
        item: any
      ) =>
        sum +
        Number(item.shares || 0),
      0
    );


  /*
   * KPI CARDS
   */

  const kpis = [

    {
      title: "Total Views",
      value: totalViews,
      icon: "👁",
      current: totalViews,
      previous: previousTotalViews
    },

    {
      title: "Videos",
      value: totalVideos,
      icon: "🎬"
    },

    {
      title: "Likes",
      value: totalLikes,
      icon: "❤️",
      current: totalLikes,
      previous: previousTotalLikes
    },

    {
      title: "Comments",
      value: totalComments,
      icon: "💬",
      current: totalComments,
      previous: previousTotalComments
    },

    {
      title: "Shares",
      value: totalShares,
      icon: "🔗",
      current: totalShares,
      previous: previousTotalShares
    },

    {
      title: "Followers",
      value: latestFollowers,
      icon: "👤"
    }

  ];


  /*
   * PERFORMANCE CHART
   */

  const performanceChartData =
    Object.keys(
      currentDaily
    )
      .sort()
      .map(
        (date) => ({

          live_date: date,

          views:
            Number(
              currentDaily[
                date
              ]?.views || 0
            ),

          peak_viewers: 0

        })
      );


  /*
   * ENGAGEMENT CHART
   */

  const engagementChartData =
    Object.keys(
      currentDaily
    )
      .sort()
      .map(
        (date) => ({

          live_date: date,

          likes:
            Number(
              currentDaily[
                date
              ]?.likes || 0
            ),

          comments:
            Number(
              currentDaily[
                date
              ]?.comments || 0
            ),

          shares:
            Number(
              currentDaily[
                date
              ]?.shares || 0
            )

        })
      );


  return (

    <div className="app-shell">


      <Sidebar
        activeItem="TikTok Live"
      />


      <main className="main-content">


        {/* HEADER */}

        <header className="topbar">

          <div>

            <h1>
              TikTok Live Performance
            </h1>

            <p>
              TikTok API Marketing Performance Dashboard
            </p>

          </div>

        </header>


        {/* HERO */}

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

          <h2
            style={{
              margin: 0
            }}
          >
            TIKTOK PERFORMANCE
          </h2>


          <p
            style={{
              marginTop: 8,
              opacity: 0.8
            }}
          >
            Performance based on connected TikTok API data.
          </p>

        </section>


        {/* DATE FILTER */}

        <TikTokLiveDateFilter />


        {/* KPI */}

        <section
          style={{
            display: "grid",

            gridTemplateColumns:
              "repeat(6,minmax(0,1fr))",

            gap: 12
          }}
        >

          {
            kpis.map(
              (item) => (

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


        {/* GROWTH COMPARISON */}

        <TikTokGrowthComparison

          currentDaily={
            currentDaily
          }

          previousDaily={
            previousDaily
          }

          currentFollowers={
            currentFollowers
          }

          previousFollowers={
            previousFollowers
          }

          from={
            currentFrom
          }

          to={
            currentTo
          }

          previousFrom={
            previousFrom
          }

          previousTo={
            previousTo
          }

        />


        {/* PERFORMANCE TREND */}

        <TikTokLivePerformanceChart
          data={
            performanceChartData
          }
        />


        {/* ENGAGEMENT */}

        <TikTokLiveEngagementChart

          likes={
            totalLikes
          }

          comments={
            totalComments
          }

          shares={
            totalShares
          }

          engagementRate={
            engagementRate
          }

        />


        {/* WATCH TIME */}

        <TikTokLiveWatchTime

          totalWatchTime={0}

          averageWatchTime={0}

        />


      </main>

    </div>

  );

}