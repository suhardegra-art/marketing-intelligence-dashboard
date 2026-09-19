import YouTubeConnectionActions from "./components/YouTubeConnectionActions";
import YouTubeContentPerformanceAI from "./components/YouTubeContentPerformanceAI";
import YouTubeContentTable from "./components/YouTubeContentTable";
import YouTubeContentTrend from "./components/YouTubeContentTrend";
import YouTubeGrowthComparison from "./components/YouTubeGrowthComparison";
import YouTubePerformanceTrend from "./components/YouTubePerformanceTrend";
import YouTubePeriodSummary from "./components/YouTubePeriodSummary";
import YouTubeAudiencePanel from "./components/YouTubeAudiencePanel";
import {
  youtubePreviewContent,
  youtubeEngagementRate,
  type YouTubePreviewContent
} from "./youtubePreviewData";
import {
  getYouTubeDashboardData,
  type YouTubeDashboardData,
  type YouTubeDailyPoint
} from "@/lib/youtube-dashboard";

export const dynamic = "force-dynamic";

type YouTubeOverviewProps = {
  searchParams: Promise<{
    from?: string;
    to?: string;
    youtube_error?: string;
    youtube_connected?: string;
    youtube_disconnected?: string;
  }>;
};

const ALL_TIME_FROM = "2005-02-14";

function yesterdayDate() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`));
}

function changePercent(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function buildFallbackDaily(fromDate: string, toDate: string): YouTubeDailyPoint[] {
  const start = new Date(`${fromDate}T00:00:00Z`);
  const end = new Date(`${toDate}T00:00:00Z`);
  const rows: YouTubeDailyPoint[] = [];
  let index = 0;

  for (
    let current = new Date(start);
    current <= end;
    current.setUTCDate(current.getUTCDate() + 1)
  ) {
    const spike = index === 20 ? 2.8 : 1;
    const views = Math.round(
      (2200 + Math.sin(index / 2.7) * 650 + (index % 5) * 120) * spike
    );

    rows.push({
      date: current.toISOString().slice(0, 10),
      views: Math.max(300, views),
      watchMinutes: Math.round(Math.max(300, views) * 0.22),
      subscribersGained: index % 3 === 0 ? 3 : 1,
      subscribersLost: index % 11 === 0 ? 1 : 0,
      likes: Math.round(Math.max(300, views) * 0.035),
      comments: Math.round(Math.max(300, views) * 0.003),
      shares: Math.round(Math.max(300, views) * 0.004)
    });

    index += 1;
  }

  return rows;
}

const FALLBACK_TRAFFIC = [
  { label: "YouTube search", percentage: 43.0 },
  { label: "Shorts feed", percentage: 34.3 },
  { label: "Browse features", percentage: 10.5 },
  { label: "Suggested videos", percentage: 6.8 },
  { label: "Channel pages", percentage: 2.8 },
  { label: "External", percentage: 2.5 },
  { label: "Others", percentage: 0.1 }
];

const FALLBACK_AGES = [
  { label: "13–17 years", percentage: 0.3 },
  { label: "18–24 years", percentage: 3.9 },
  { label: "25–34 years", percentage: 34.1 },
  { label: "35–44 years", percentage: 38.3 },
  { label: "45–54 years", percentage: 18.3 },
  { label: "55–64 years", percentage: 4.5 },
  { label: "65+ years", percentage: 0.6 }
];

const FALLBACK_GENDERS = [
  { label: "female", percentage: 17.5 },
  { label: "male", percentage: 82.5 },
  { label: "userSpecified", percentage: 0.0 }
];

const FALLBACK_DEVICES = [
  { label: "Mobile phone", views: 0, percentage: 84.3 },
  { label: "Computer", views: 0, percentage: 7.5 },
  { label: "TV", views: 0, percentage: 4.7 },
  { label: "Tablet", views: 0, percentage: 3.5 }
];

const FALLBACK_GEOGRAPHIES = [
  { label: "ID", views: 0, percentage: 96.0 },
  { label: "MY", views: 0, percentage: 0.8 },
  { label: "IN", views: 0, percentage: 0.0 }
];

const FALLBACK_CONTENT_TYPES = [
  { label: "Shorts", percentage: 86.2 },
  { label: "Videos", percentage: 13.1 },
  { label: "Live", percentage: 0.7 }
];

function sortTopContent(rows: YouTubePreviewContent[]) {
  return [...rows].sort((a, b) => b.views - a.views).slice(0, 5);
}

export default async function YouTubeOverviewPage({
  searchParams
}: YouTubeOverviewProps) {
  const params = await searchParams;

  const hasCustomPeriod = Boolean(params.from || params.to);
  const requestedFrom = params.from || ALL_TIME_FROM;
  const requestedTo = params.to || yesterdayDate();

  const result = await getYouTubeDashboardData({
    from: requestedFrom,
    to: requestedTo
  });

  const live = result.connected;
  const liveData = live ? (result as YouTubeDashboardData) : null;

  const fromDate = liveData?.fromDate || requestedFrom;
  const toDate = liveData?.toDate || requestedTo;

  const fallbackFiltered = hasCustomPeriod
    ? youtubePreviewContent.filter((item) => {
        const date = item.publishedAt.slice(0, 10);
        const fromOk = params.from ? date >= params.from : true;
        const toOk = params.to ? date <= params.to : true;
        return fromOk && toOk;
      })
    : youtubePreviewContent;

  const content = liveData?.content || fallbackFiltered;
  const allContent = liveData?.content || youtubePreviewContent;

  const fallbackDailyFrom = hasCustomPeriod
    ? fromDate
    : youtubePreviewContent
        .map((item) => item.publishedAt.slice(0, 10))
        .sort()[0] || requestedTo;

  const daily =
    liveData?.daily || buildFallbackDaily(fallbackDailyFrom, toDate);

  const growthDaily = liveData?.growthDaily || daily;

  const fallbackViews = content.reduce(
    (sum, row) => sum + row.views,
    0
  );

  const fallbackInteractions = content.reduce(
    (sum, row) =>
      sum + row.likes + row.comments + row.shares,
    0
  );

  const overview = liveData?.overview || {
    views: fallbackViews || 78200,
    watchHours: 287.3,
    subscribersNet: 49,
    likes: content.reduce((sum, row) => sum + row.likes, 0),
    comments: content.reduce((sum, row) => sum + row.comments, 0),
    shares: content.reduce((sum, row) => sum + row.shares, 0),
    engagementRate: fallbackViews
      ? (fallbackInteractions / fallbackViews) * 100
      : 5.3,
    averageViewDuration: 23,
    averageViewPercentage: content.length
      ? content.reduce((sum, row) => sum + row.avgViewed, 0) /
        content.length
      : 0
  };

  const previous = liveData?.previousOverview || {
    views: overview.views / 1.12,
    watchHours: overview.watchHours / 0.99,
    subscribersNet: 67,
    engagementRate: overview.engagementRate / 1.18
  };

  const channel = liveData?.channel || {
    id: "preview",
    title: "Indomobil eMotor",
    handle: "@indomobilemotor",
    channelUrl: "https://www.youtube.com/",
    thumbnailUrl: null,
    subscribers: 1140,
    totalViews: 0,
    totalVideos: allContent.length,
    uploadsPlaylistId: null
  };

  const trafficSources = liveData?.trafficSources.length
    ? liveData.trafficSources
    : FALLBACK_TRAFFIC.map((row) => ({ ...row, views: 0 }));

  const ages = liveData?.ages.length
    ? liveData.ages
    : FALLBACK_AGES;

  const genders = liveData?.genders.length
    ? liveData.genders
    : FALLBACK_GENDERS;

  const devices = liveData?.devices.length
    ? liveData.devices
    : FALLBACK_DEVICES;

  const geographies = liveData?.geographies.length
    ? liveData.geographies
    : FALLBACK_GEOGRAPHIES;

  const contentTypes = liveData?.contentTypes.length
    ? liveData.contentTypes
    : FALLBACK_CONTENT_TYPES.map((row) => ({
        ...row,
        views: 0
      }));

  const topContent = sortTopContent(content);

  const viewChange = changePercent(
    overview.views,
    previous.views
  );

  const watchChange = changePercent(
    overview.watchHours,
    previous.watchHours
  );

  const subscriberChange = changePercent(
    overview.subscribersNet,
    previous.subscribersNet
  );

  const engagementChange = changePercent(
    overview.engagementRate,
    previous.engagementRate
  );

  const fortyEightHourEstimate = daily
    .slice(-2)
    .reduce((sum, row) => sum + row.views, 0);

  const aiScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        50 +
          Math.max(-15, Math.min(15, viewChange / 2)) +
          Math.max(
            -10,
            Math.min(
              10,
              overview.averageViewPercentage / 10 - 5
            )
          ) +
          Math.max(
            -10,
            Math.min(10, overview.engagementRate * 2)
          )
      )
    )
  );

  const periodLabel = hasCustomPeriod
    ? `${params.from ? formatDate(fromDate) : "Start"} – ${
        params.to ? formatDate(toDate) : "Latest"
      }`
    : "All publish dates";

  const videosInPeriod = hasCustomPeriod
    ? content.length
    : channel.totalVideos || allContent.length;

  const videosStored =
    channel.totalVideos || allContent.length;

  const averageViewsPerVideo =
    videosInPeriod > 0
      ? Math.round(overview.views / videosInPeriod)
      : 0;

  return (
    <div className="yt-page-content">
      <div className="yt-page">
        <header className="yt-topbar">
          <div className="yt-title-wrap">
            <div className="yt-youtube-badge">▶</div>
            <div>
              <h1>YouTube Analytics</h1>
              <p>
                Track performance, understand your audience, and grow
                your channel with data-driven insights.
              </p>
            </div>
          </div>

          <div className="yt-top-actions">
            <button className="yt-date-button">
              <span>{periodLabel}</span>
              <small>{live ? "YouTube API" : "Preview data"}</small>
            </button>

            <YouTubeConnectionActions connected={live} />
          </div>
        </header>

        {params.youtube_error ? (
          <div className="yt-api-alert error">
            YouTube connection error: {params.youtube_error}
          </div>
        ) : null}

        {params.youtube_connected ? (
          <div className="yt-api-alert success">
            YouTube connected successfully. The dashboard is now
            reading live API data.
          </div>
        ) : null}

        {!live ? (
          <div className="yt-api-alert info">
            <strong>Preview mode.</strong>{" "}
            {result.connected ? "" : result.message} Connect YouTube
            to replace all preview metrics with live channel
            analytics.
          </div>
        ) : null}

        <section className="yt-channel-banner">
          <div className="yt-channel-copy">
            <p className="yt-channel-overline">
              YOUTUBE CHANNEL {live ? "• LIVE API" : "• PREVIEW"}
            </p>

            <h2>{channel.title}</h2>

            <p className="yt-channel-meta">
              {channel.handle || channel.id} •{" "}
              {formatCompact(channel.subscribers)} subscribers •
              Performance overview & audience intelligence
            </p>

            <div className="yt-banner-pills">
              <span>{periodLabel}</span>
              <span>{formatCompact(overview.views)} views</span>
              <span>
                {overview.watchHours.toFixed(1)} watch hours
              </span>
              <span>
                {overview.subscribersNet >= 0 ? "+" : ""}
                {formatNumber(overview.subscribersNet)} subscribers
              </span>
            </div>
          </div>

          <div className="yt-banner-art" aria-hidden="true">
            <div className="yt-banner-orb orb-a" />
            <div className="yt-banner-orb orb-b" />
            <div className="yt-banner-play">▶</div>
          </div>

          <a
            className="yt-open-channel"
            href={channel.channelUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open YouTube ↗
          </a>
        </section>

        <section className="yt-card yt-period-filter-card yt-wide-card">
          <form
            action="/youtube"
            method="get"
            className="yt-period-form"
          >
            <label>
              <span>From Date</span>
              <input
                type="date"
                name="from"
                defaultValue={params.from || ""}
              />
            </label>

            <label>
              <span>To Date</span>
              <input
                type="date"
                name="to"
                defaultValue={params.to || ""}
              />
            </label>

            <button
              type="submit"
              className="yt-apply-period"
            >
              Apply Period
            </button>

            <a href="/youtube" className="yt-reset-period">
              Reset
            </a>
          </form>

          <div className="yt-period-meta">
            <span>
              Selected content period:{" "}
              <strong>{periodLabel}</strong>
            </span>

            <span>
              {live
                ? "Metrics update to the selected period. Reset returns to All publish dates."
                : "Preview mode until OAuth is connected."}
            </span>
          </div>
        </section>

        <YouTubePeriodSummary
          subscribers={channel.subscribers}
          totalVideos={videosStored}
          videosInPeriod={videosInPeriod}
          views={overview.views}
          averageViewsPerVideo={averageViewsPerVideo}
          likes={overview.likes}
          comments={overview.comments}
          shares={overview.shares}
        />

        <YouTubeGrowthComparison
          daily={growthDaily}
          currentSubscribers={channel.subscribers}
          live={live}
        />

        <section className="yt-primary-grid">
          <YouTubePerformanceTrend data={daily} />

          <article className="yt-card yt-realtime-card">
            <div className="yt-card-head compact">
              <div>
                <h2>Realtime Monitor</h2>
                <p>
                  <span className="yt-live-dot" /> API estimate
                </p>
              </div>
            </div>

            <div className="yt-realtime-metric">
              <strong>
                {formatCompact(fortyEightHourEstimate)}
              </strong>

              <span>
                Views · last 2 finalized API days*
              </span>

              <div className="yt-mini-bars big">
                {daily.slice(-36).map((row, index) => {
                  const max = Math.max(
                    ...daily
                      .slice(-36)
                      .map((point) => point.views),
                    1
                  );

                  return (
                    <i
                      key={`${row.date}-${index}`}
                      style={{
                        height: `${Math.max(
                          8,
                          (row.views / max) * 70
                        )}px`
                      }}
                    />
                  );
                })}
              </div>
            </div>

            <div className="yt-realtime-metric second">
              <strong>—</strong>
              <span>
                Last 60 minutes is not exposed by the public Analytics
                API
              </span>
            </div>
          </article>
        </section>

        <section className="yt-card yt-ai-summary-card yt-wide-card">
          <div className="yt-card-head">
            <div>
              <h2>✦ AI Performance Summary</h2>
              <p>
                Calculated from{" "}
                {live ? "live YouTube API" : "preview"} performance
                signals
              </p>
            </div>

            <span className="yt-beta">Beta</span>
          </div>

          <div className="yt-ai-summary-body">
            <div className="yt-score-ring">
              <div>
                <strong>{aiScore}</strong>
                <span>/100</span>
                <small>Signal Score</small>
              </div>
            </div>

            <div className="yt-score-list">
              <div>
                <span>Growth</span>
                <strong
                  className={
                    viewChange >= 0 ? "good" : "warn"
                  }
                >
                  ●{" "}
                  {viewChange >= 10
                    ? "Strong"
                    : viewChange >= 0
                      ? "Stable"
                      : "Needs Attention"}
                </strong>
              </div>

              <div>
                <span>Content Efficiency</span>
                <strong
                  className={
                    overview.engagementRate >= 2
                      ? "good"
                      : "warn"
                  }
                >
                  ●{" "}
                  {overview.engagementRate >= 2
                    ? "Good"
                    : "Moderate"}
                </strong>
              </div>

              <div>
                <span>Audience Retention</span>
                <strong
                  className={
                    overview.averageViewPercentage >= 65
                      ? "good"
                      : "warn"
                  }
                >
                  ●{" "}
                  {overview.averageViewPercentage >= 65
                    ? "Good"
                    : "Needs Attention"}
                </strong>
              </div>

              <div>
                <span>Discovery</span>
                <strong className="good">
                  ● {trafficSources[0]?.label || "Available"}
                </strong>
              </div>

              <div>
                <span>Subscriber Conversion</span>
                <strong
                  className={
                    overview.subscribersNet >= 0
                      ? "good"
                      : "warn"
                  }
                >
                  ●{" "}
                  {overview.subscribersNet >= 0
                    ? "Positive"
                    : "Negative"}
                </strong>
              </div>
            </div>

            <div className="yt-ai-summary-copy">
              <strong>Executive Signal</strong>

              <p>
                {live
                  ? `Channel menghasilkan ${formatCompact(
                      overview.views
                    )} views dan ${overview.watchHours.toFixed(
                      1
                    )} jam watch time pada periode ini. Sumber traffic terbesar adalah ${
                      trafficSources[0]?.label ||
                      "belum tersedia"
                    }, sementara ${
                      contentTypes[0]?.label || "konten"
                    } menjadi format dengan kontribusi views terbesar.`
                  : "Dashboard masih menggunakan preview data. Hubungkan YouTube OAuth untuk menghasilkan summary berdasarkan data channel aktual."}
              </p>

              <span className="yt-ai-link">
                Gunakan AI Content Performance Analysis di bawah untuk
                insight Gemini berbasis data aktual.
              </span>
            </div>
          </div>
        </section>

        <section className="yt-two-column-grid">
          <article className="yt-card">
            <div className="yt-card-head compact">
              <div>
                <h2>How viewers find your videos</h2>
                <p>Views · selected period</p>
              </div>
            </div>

            <div className="yt-bars-list">
              {trafficSources.map((row) => (
                <div
                  className="yt-bars-row"
                  key={row.label}
                >
                  <span>{row.label}</span>
                  <div>
                    <i
                      style={{
                        width: `${Math.min(
                          100,
                          row.percentage * 2
                        )}%`
                      }}
                    />
                  </div>
                  <strong>
                    {row.percentage.toFixed(1)}%
                  </strong>
                </div>
              ))}
            </div>
          </article>

          <YouTubeAudiencePanel
            ages={ages}
            genders={genders}
            devices={devices}
            geographies={geographies}
          />
        </section>

        <section className="yt-two-column-grid">
          <article className="yt-card">
            <div className="yt-card-head compact">
              <div>
                <h2>Views by content type</h2>
                <p>Views · selected period</p>
              </div>
            </div>

            <div className="yt-content-type">
              <div className="yt-donut">
                <div>
                  <strong>
                    {formatCompact(overview.views)}
                  </strong>
                  <span>Total Views</span>
                </div>
              </div>

              <div className="yt-legend">
                {contentTypes
                  .slice(0, 4)
                  .map((row, index) => (
                    <div key={row.label}>
                      <span
                        className={`c${Math.min(
                          index + 1,
                          3
                        )}`}
                      />
                      {row.label}{" "}
                      <strong>
                        {row.percentage.toFixed(1)}%
                      </strong>
                    </div>
                  ))}
              </div>
            </div>
          </article>

          <article className="yt-card yt-ai-highlights-card">
            <div className="yt-card-head compact">
              <div>
                <h2>◎ Insights Highlight</h2>
                <p>
                  Automatically derived from current channel signals
                </p>
              </div>
            </div>

            <div className="yt-insight-list">
              <div>
                <span className="green">↗</span>
                <p>
                  <strong>
                    {viewChange >= 0
                      ? "Views tumbuh"
                      : "Views menurun"}{" "}
                    {Math.abs(viewChange).toFixed(1)}%
                  </strong>
                  <small>
                    Dibanding periode sebelumnya dengan durasi yang
                    sama.
                  </small>
                </p>
              </div>

              <div>
                <span className="yellow">!</span>
                <p>
                  <strong>
                    Average viewed{" "}
                    {overview.averageViewPercentage.toFixed(1)}%
                  </strong>
                  <small>
                    {overview.averageViewPercentage >= 65
                      ? "Retention agregat cukup kuat."
                      : "Perkuat hook dan struktur konten."}
                  </small>
                </p>
              </div>

              <div>
                <span className="blue">▥</span>
                <p>
                  <strong>
                    {contentTypes[0]?.label || "Content"} memimpin
                    reach
                  </strong>
                  <small>
                    {contentTypes[0]
                      ? `${contentTypes[0].percentage.toFixed(
                          1
                        )}% dari views berdasarkan creatorContentType.`
                      : "Menunggu data."}
                  </small>
                </p>
              </div>
            </div>
          </article>
        </section>

        <YouTubeContentTrend rows={content} />

        <YouTubeContentPerformanceAI
          rows={content}
          channelName={channel.title}
          handle={channel.handle}
          fromDate={fromDate}
          toDate={toDate}
          live={live}
        />

        <section className="yt-card yt-top-content-card yt-wide-card">
          <div className="yt-card-head">
            <div>
              <h2>Top Content</h2>
              <p>
                Best-performing content in the selected analytics
                period
              </p>
            </div>
          </div>

          <div className="yt-table-wrap">
            <table className="yt-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Content</th>
                  <th>Publish date</th>
                  <th>Views</th>
                  <th>Avg view duration</th>
                  <th>Avg % viewed</th>
                  <th>Likes</th>
                  <th>Comments</th>
                  <th>Video Link</th>
                </tr>
              </thead>

              <tbody>
                {topContent.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>
                      <div
                        className="yt-content-cell"
                        style={{ minWidth: 0 }}
                      >
                        <span>{item.title}</span>
                      </div>
                    </td>
                    <td>{formatDate(item.publishedAt)}</td>
                    <td>
                      <strong>
                        {formatNumber(item.views)}
                      </strong>
                    </td>
                    <td>{item.avgViewDuration}</td>
                    <td>{item.avgViewed.toFixed(1)}%</td>
                    <td>{formatNumber(item.likes)}</td>
                    <td>{formatNumber(item.comments)}</td>
                    <td>
                      <a
                        href={item.permalink}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: "#4059d7",
                          fontWeight: 900,
                          textDecoration: "none"
                        }}
                      >
                        Open ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <YouTubeContentTable
          filteredRows={content}
          allRows={allContent}
        />

        <footer className="yt-footer">
          YouTube Analytics Dashboard •{" "}
          {live
            ? "Live YouTube Data API + YouTube Analytics API"
            : "Preview Mode"}
        </footer>
      </div>
    </div>
  );
}
