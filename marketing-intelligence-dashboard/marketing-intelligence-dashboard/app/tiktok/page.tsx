import Sidebar from "@/components/Sidebar";
import SyncAllTikTokButton from "@/app/tiktok/SyncAllTikTokButton";
import TikTokGrowthComparison from "@/components/TikTokGrowthComparison";
import { getTikTokDashboardData } from "@/lib/tiktok-dashboard";
import { getTikTokHistory } from "@/lib/tiktok-history";
import { getTikTokGrowthData } from "@/lib/tiktok-growth";
import TikTokExportButton from "@/components/TikTokExportButton";
import TikTokSyncMonitoring from "@/components/TikTokSyncMonitoring";

export const dynamic = "force-dynamic";

type TikTokPageProps = {
  searchParams: Promise<{
    from?: string;
    to?: string;
  }>;
};

type DailyMetric = {
  views: number;
  likes: number;
  comments: number;
  shares: number;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function engagementRate(item: {
  views: number;
  likes: number;
  comments: number;
  shares: number;
}) {
  if (!item.views) return 0;

  return (
    (
      item.likes +
      item.comments +
      item.shares
    ) /
    item.views
  ) * 100;
}

function periodLabel(
  from: string | null,
  to: string | null
) {
  if (from && to) {
    return `${formatDate(from)} – ${formatDate(to)}`;
  }

  if (from) {
    return `From ${formatDate(from)}`;
  }

  if (to) {
    return `Until ${formatDate(to)}`;
  }

  return "All publish dates";
}


/*
 * Convert the existing TikTokGrowthData
 * into the props required by TikTokGrowthComparison.
 */
function buildGrowthComparisonData(
  growthData: any
) {

  const emptyDaily: Record<
    string,
    DailyMetric
  > = {};

  const emptyFollowers: Record<
    string,
    number
  > = {};


  if (!growthData) {

    return {
      currentDaily: emptyDaily,
      previousDaily: emptyDaily,
      currentFollowers: emptyFollowers,
      previousFollowers: emptyFollowers,
      from: "",
      to: "",
      previousFrom: "",
      previousTo: ""
    };

  }


  const currentDaily: Record<
    string,
    DailyMetric
  > = {};


  const previousDaily: Record<
    string,
    DailyMetric
  > = {};


  const currentFollowers: Record<
    string,
    number
  > = {};


  const previousFollowers: Record<
    string,
    number
  > = {};


  const metrics =
    growthData.metrics || [];


  /*
   * FOLLOWER SERIES
   */

  const followerMetric =
    metrics.find(
      (item: any) =>
        item.key === "followers"
    );


  if (followerMetric) {

    (
      followerMetric.currentSeries ||
      []
    ).forEach(
      (point: any) => {

        currentFollowers[
          point.date
        ] = Number(
          point.value || 0
        );

      }
    );


    (
      followerMetric.previousSeries ||
      []
    ).forEach(
      (point: any) => {

        previousFollowers[
          point.date
        ] = Number(
          point.value || 0
        );

      }
    );

  }


  /*
   * VIEWS
   */

  const viewsMetric =
    metrics.find(
      (item: any) =>
        item.key === "views"
    );


  if (viewsMetric) {

    (
      viewsMetric.currentSeries ||
      []
    ).forEach(
      (point: any) => {

        if (!currentDaily[point.date]) {

          currentDaily[
            point.date
          ] = {
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0
          };

        }


        currentDaily[
          point.date
        ].views =
          Number(
            point.value || 0
          );

      }
    );


    (
      viewsMetric.previousSeries ||
      []
    ).forEach(
      (point: any) => {

        if (!previousDaily[point.date]) {

          previousDaily[
            point.date
          ] = {
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0
          };

        }


        previousDaily[
          point.date
        ].views =
          Number(
            point.value || 0
          );

      }
    );

  }


  /*
   * LIKES
   */

  const likesMetric =
    metrics.find(
      (item: any) =>
        item.key === "likes"
    );


  if (likesMetric) {

    (
      likesMetric.currentSeries ||
      []
    ).forEach(
      (point: any) => {

        if (!currentDaily[point.date]) {

          currentDaily[
            point.date
          ] = {
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0
          };

        }


        currentDaily[
          point.date
        ].likes =
          Number(
            point.value || 0
          );

      }
    );


    (
      likesMetric.previousSeries ||
      []
    ).forEach(
      (point: any) => {

        if (!previousDaily[point.date]) {

          previousDaily[
            point.date
          ] = {
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0
          };

        }


        previousDaily[
          point.date
        ].likes =
          Number(
            point.value || 0
          );

      }
    );

  }


  /*
   * COMMENTS + SHARES
   *
   * TikTokGrowthData already combines
   * comments and shares into one metric.
   *
   * Therefore we store the combined value
   * in comments and leave shares as 0.
   */

  const commentsSharesMetric =
    metrics.find(
      (item: any) =>
        item.key === "commentsShares"
    );


  if (commentsSharesMetric) {

    (
      commentsSharesMetric.currentSeries ||
      []
    ).forEach(
      (point: any) => {

        if (!currentDaily[point.date]) {

          currentDaily[
            point.date
          ] = {
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0
          };

        }


        currentDaily[
          point.date
        ].comments =
          Number(
            point.value || 0
          );

      }
    );


    (
      commentsSharesMetric.previousSeries ||
      []
    ).forEach(
      (point: any) => {

        if (!previousDaily[point.date]) {

          previousDaily[
            point.date
          ] = {
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0
          };

        }


        previousDaily[
          point.date
        ].comments =
          Number(
            point.value || 0
          );

      }
    );

  }


  return {

    currentDaily,

    previousDaily,

    currentFollowers,

    previousFollowers,

    from:
      growthData.currentFrom ||
      "",

    to:
      growthData.currentTo ||
      "",

    previousFrom:
      growthData.previousFrom ||
      "",

    previousTo:
      growthData.previousTo ||
      ""

  };

}


export default async function TikTokPage({
  searchParams
}: TikTokPageProps) {

  const params =
    await searchParams;


  const [
    data,
    history,
    growthData
  ] =
    await Promise.all([

      getTikTokDashboardData({
        from: params.from,
        to: params.to
      }),

      getTikTokHistory({
        from: params.from,
        to: params.to
      }),

      getTikTokGrowthData({
        from: params.from,
        to: params.to
      })

    ]);


  const growthComparison =
    buildGrowthComparisonData(
      growthData
    );


  const topContent =
    [...data.content]
      .sort(
        (a, b) =>
          b.views - a.views
      )
      .slice(0, 5);


  const avgViews =
    data.periodVideos > 0
      ? Math.round(
          data.totalViews /
          data.periodVideos
        )
      : 0;


  const firstHistory =
    history[0];


  const latestHistory =
    history[
      history.length - 1
    ];


  const followerGrowth =
    firstHistory &&
    latestHistory
      ? latestHistory.followers -
        firstHistory.followers
      : 0;


  const maxFollowers =
    Math.max(
      ...history.map(
        (row) =>
          row.followers
      ),
      1
    );


  const minFollowers =
    history.length > 0
      ? Math.min(
          ...history.map(
            (row) =>
              row.followers
          )
        )
      : 0;


  const followerRange =
    Math.max(
      maxFollowers -
      minFollowers,
      1
    );


  return (

    <div className="app-shell">

      <Sidebar
        activeItem="TikTok"
      />


      <main className="main-content">


        <header className="topbar">

          <div>

            <h1>
              TikTok Performance
            </h1>

            <p>
              Live account and content data from the TikTok API
            </p>

          </div>


          <div className="topbar-actions">

            <div className="period-select">

              <span>
                Snapshot
              </span>

              <strong>
                {data.snapshotDate ||
                  "No data"}
              </strong>

            </div>


            <div className="avatar">
              TT
            </div>


            <form
              action="/api/logout"
              method="post"
            >

              <button className="logout-button">
                Logout
              </button>

            </form>

          </div>

        </header>


        <section
          style={{
            borderRadius: 18,
            padding: "26px 30px",
            marginBottom: 16,
            background:
              "linear-gradient(120deg,#101010 0%,#17151f 55%,#29213e 100%)",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            gap: 24,
            alignItems: "center",
            boxShadow:
              "0 12px 30px rgba(20,20,40,.12)"
          }}
        >

          <div>

            <p
              style={{
                margin: "0 0 7px",
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: ".14em",
                color: "#8ef3ec"
              }}
            >
              TIKTOK ACCOUNT
            </p>


            <h2
              style={{
                margin: 0,
                fontSize: 30
              }}
            >
              {data.accountName}
            </h2>


            <p
              style={{
                margin: "8px 0 0",
                color:
                  "rgba(255,255,255,.68)",
                fontSize: 13
              }}
            >
              {data.username
                ? `@${data.username}`
                : "Connected TikTok account"}
            </p>

          </div>


          {data.profileUrl ? (

            <a
              href={data.profileUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                color: "#fff",
                textDecoration: "none",
                border:
                  "1px solid rgba(255,255,255,.22)",
                padding: "10px 14px",
                borderRadius: 10,
                fontWeight: 800,
                fontSize: 12
              }}
            >
              Open TikTok Profile ↗
            </a>

          ) : null}

        </section>


        <section
          className="panel"
          style={{
            marginBottom: 16,
            padding: 16
          }}
        >

          <form
            action="/tiktok"
            method="get"
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr auto auto",
              gap: 12,
              alignItems: "end"
            }}
          >

            <label
              style={{
                display: "grid",
                gap: 6
              }}
            >

              <span
                style={{
                  color: "#7a839d",
                  fontSize: 9,
                  fontWeight: 800,
                  textTransform:
                    "uppercase",
                  letterSpacing: ".08em"
                }}
              >
                From Date
              </span>


              <input
                type="date"
                name="from"
                defaultValue={
                  data.fromDate ?? ""
                }
                max={
                  data.toDate ??
                  undefined
                }
                style={{
                  minHeight: 40,
                  border:
                    "1px solid #dce1ef",
                  borderRadius: 10,
                  padding: "0 12px",
                  background:
                    "#fbfcff",
                  color: "#141b34"
                }}
              />

            </label>


            <label
              style={{
                display: "grid",
                gap: 6
              }}
            >

              <span
                style={{
                  color: "#7a839d",
                  fontSize: 9,
                  fontWeight: 800,
                  textTransform:
                    "uppercase",
                  letterSpacing: ".08em"
                }}
              >
                To Date
              </span>


              <input
                type="date"
                name="to"
                defaultValue={
                  data.toDate ?? ""
                }
                min={
                  data.fromDate ??
                  undefined
                }
                style={{
                  minHeight: 40,
                  border:
                    "1px solid #dce1ef",
                  borderRadius: 10,
                  padding: "0 12px",
                  background:
                    "#fbfcff",
                  color: "#141b34"
                }}
              />

            </label>


            <button
              type="submit"
              style={{
                minHeight: 40,
                border: 0,
                borderRadius: 10,
                padding: "0 18px",
                background:
                  "#4059d7",
                color: "white",
                fontWeight: 800,
                fontSize: 12
              }}
            >
              Apply Period
            </button>


            <a
              href="/tiktok"
              style={{
                minHeight: 40,
                display: "inline-flex",
                alignItems: "center",
                justifyContent:
                  "center",
                border:
                  "1px solid #dce1ef",
                borderRadius: 10,
                padding: "0 16px",
                background: "white",
                color: "#59617a",
                fontWeight: 800,
                fontSize: 12,
                textDecoration:
                  "none"
              }}
            >
              Reset
            </a>

          </form>


          <div
            style={{
              marginTop: 10,
              display: "flex",
              justifyContent:
                "space-between",
              gap: 12,
              flexWrap: "wrap"
            }}
          >

            <span
              style={{
                color: "#59617a",
                fontSize: 10
              }}
            >
              Selected content period:{" "}
              <strong>
                {periodLabel(
                  data.fromDate,
                  data.toDate
                )}
              </strong>
            </span>


            <span
              style={{
                color: "#9aa2b7",
                fontSize: 10
              }}
            >
              Filter uses video publish date.
            </span>

          </div>

        </section>


        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4,minmax(0,1fr))",
            gap: 12,
            marginBottom: 16
          }}
        >

          {[
            [
              "Followers