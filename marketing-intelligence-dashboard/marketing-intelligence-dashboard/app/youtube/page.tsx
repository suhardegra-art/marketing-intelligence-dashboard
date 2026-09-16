import Sidebar from "@/components/Sidebar";
import YouTubeGrowthComparison from "@/components/YouTubeGrowthComparison";
import YouTubeContentAIInsights from "@/components/YouTubeContentAIInsights";
import {
  youtubeDemoChannel,
  youtubeDemoSnapshots,
  youtubeDemoVideos,
  type YouTubeVideo
} from "@/lib/youtube-demo-data";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    from?: string;
    to?: string;
  }>;
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

function contentEr(item: YouTubeVideo) {
  if (!item.views) return 0;

  return (
    ((item.likes + item.comments + item.shares) /
      item.views) *
    100
  );
}

function periodLabel(from: string | null, to: string | null) {
  if (from && to) {
    return `${formatDate(from)} – ${formatDate(to)}`;
  }

  if (from) return `From ${formatDate(from)}`;
  if (to) return `Until ${formatDate(to)}`;

  return "All publish dates";
}

export default async function YouTubePage({
  searchParams
}: Props) {
  const params = await searchParams;
  const fromDate = params.from || null;
  const toDate = params.to || null;

  const content = youtubeDemoVideos.filter((item) => {
    const date = item.publishedAt.slice(0, 10);

    if (fromDate && date < fromDate) return false;
    if (toDate && date > toDate) return false;

    return true;
  });

  const totalViews = content.reduce(
    (sum, item) => sum + item.views,
    0
  );
  const totalLikes = content.reduce(
    (sum, item) => sum + item.likes,
    0
  );
  const totalComments = content.reduce(
    (sum, item) => sum + item.comments,
    0
  );
  const totalShares = content.reduce(
    (sum, item) => sum + item.shares,
    0
  );
  const totalInteractions =
    totalLikes + totalComments + totalShares;

  const avgViews =
    content.length > 0
      ? Math.round(totalViews / content.length)
      : 0;

  const engagementRate = totalViews
    ? (totalInteractions / totalViews) * 100
    : 0;

  const topContent = [...content]
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  const engagementRows = [
    ["Likes", totalLikes],
    ["Comments", totalComments],
    ["Shares", totalShares],
    ["Interactions", totalInteractions]
  ] as const;

  const maxEngagement = Math.max(
    ...engagementRows.map(([, value]) => value),
    1
  );

  return (
    <div className="app-shell">
      <Sidebar activeItem="YouTube" />

      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>YouTube Performance</h1>
            <p>Channel and content performance from YouTube</p>
          </div>

          <div className="topbar-actions">
            <div className="period-select">
              <span>STATUS</span>
              <strong>Demo Data</strong>
            </div>

            <div className="avatar">YT</div>

            <form action="/api/logout" method="post">
              <button className="logout-button">Logout</button>
            </form>
          </div>
        </header>

        <section
          style={{
            borderRadius: 18,
            padding: "26px 30px",
            marginBottom: 16,
            background:
              "linear-gradient(120deg,#101010 0%,#171314 58%,#44191c 100%)",
            color: "#fff",
            display: "flex",
            justifyContent: "space-between",
            gap: 24,
            alignItems: "center",
            flexWrap: "wrap",
            boxShadow: "0 12px 30px rgba(20,20,40,.12)"
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: 8
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: ".14em",
                  color: "#ff8b8b"
                }}
              >
                YOUTUBE CHANNEL
              </p>

              <span
                style={{
                  borderRadius: 999,
                  padding: "4px 8px",
                  background: "rgba(255,255,255,.11)",
                  border: "1px solid rgba(255,255,255,.2)",
                  color: "rgba(255,255,255,.82)",
                  fontSize: 8,
                  fontWeight: 900
                }}
              >
                DEMO DATA
              </span>
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: 30
              }}
            >
              {youtubeDemoChannel.channelName}
            </h2>

            <p
              style={{
                margin: "8px 0 0",
                color: "rgba(255,255,255,.68)",
                fontSize: 13
              }}
            >
              {youtubeDemoChannel.handle} •{" "}
              {formatCompact(youtubeDemoChannel.subscribers)} subscribers
            </p>
          </div>

          <a
            href={youtubeDemoChannel.channelUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              color: "#fff",
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,.22)",
              padding: "10px 14px",
              borderRadius: 10,
              fontWeight: 800,
              fontSize: 12
            }}
          >
            Open YouTube ↗
          </a>
        </section>

        <section
          className="panel"
          style={{
            marginBottom: 16,
            padding: 16
          }}
        >
          <form
            action="/youtube"
            method="get"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr auto auto",
              gap: 12,
              alignItems: "end"
            }}
          >
            <label style={{ display: "grid", gap: 6 }}>
              <span
                style={{
                  color: "#7a839d",
                  fontSize: 9,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: ".08em"
                }}
              >
                From Date
              </span>

              <input
                type="date"
                name="from"
                defaultValue={fromDate ?? ""}
                max={toDate ?? undefined}
                style={{
                  minHeight: 40,
                  border: "1px solid #dce1ef",
                  borderRadius: 10,
                  padding: "0 12px",
                  background: "#fbfcff",
                  color: "#141b34"
                }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span
                style={{
                  color: "#7a839d",
                  fontSize: 9,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: ".08em"
                }}
              >
                To Date
              </span>

              <input
                type="date"
                name="to"
                defaultValue={toDate ?? ""}
                min={fromDate ?? undefined}
                style={{
                  minHeight: 40,
                  border: "1px solid #dce1ef",
                  borderRadius: 10,
                  padding: "0 12px",
                  background: "#fbfcff",
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
                background: "#4059d7",
                color: "#fff",
                fontWeight: 800,
                fontSize: 12
              }}
            >
              Apply Period
            </button>

            <a
              href="/youtube"
              style={{
                minHeight: 40,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #dce1ef",
                borderRadius: 10,
                padding: "0 16px",
                background: "#fff",
                color: "#59617a",
                fontWeight: 800,
                fontSize: 12,
                textDecoration: "none"
              }}
            >
              Reset
            </a>
          </form>

          <div
            style={{
              marginTop: 10,
              display: "flex",
              justifyContent: "space-between",
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
              <strong>{periodLabel(fromDate, toDate)}</strong>
            </span>

            <span
              style={{
                color: "#b54708",
                fontSize: 9,
                fontWeight: 800
              }}
            >
              Prototype • filter uses video publish date
            </span>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,minmax(0,1fr))",
            gap: 12,
            marginBottom: 16
          }}
        >
          {[
            ["Subscribers (Current)", formatCompact(youtubeDemoChannel.subscribers)],
            ["Videos in Period", formatNumber(content.length)],
            ["Views in Period", formatCompact(totalViews)],
            ["Avg. Views / Video", formatCompact(avgViews)],
            ["Likes in Period", formatCompact(totalLikes)],
            ["Comments in Period", formatCompact(totalComments)],
            ["Shares in Period", formatCompact(totalShares)],
            ["Engagement Rate", `${engagementRate.toFixed(2)}%`]
          ].map(([label, value]) => (
            <article className="kpi-card" key={label}>
              <p>{label}</p>
              <strong>{value}</strong>
            </article>
          ))}
        </section>

        <YouTubeGrowthComparison
          snapshots={youtubeDemoSnapshots}
          anchorDate={youtubeDemoChannel.snapshotDate}
        />

        <YouTubeContentAIInsights
          channelName={youtubeDemoChannel.channelName}
          handle={youtubeDemoChannel.handle}
          snapshotDate={youtubeDemoChannel.snapshotDate}
          subscribers={youtubeDemoChannel.subscribers}
          content={youtubeDemoVideos}
          snapshots={youtubeDemoSnapshots}
        />

        <section className="two-column">
          <article className="panel">
            <div className="panel-header">
              <div>
                <h3>Content Engagement</h3>
                <p>Videos published in the selected date range</p>
              </div>
            </div>

            <div className="bar-chart">
              {engagementRows.map(([label, value]) => (
                <div className="bar-row" key={label}>
                  <span className="bar-label">{label}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${Math.max(
                          4,
                          (value / maxEngagement) * 100
                        )}%`
                      }}
                    />
                  </div>
                  <strong>{formatCompact(value)}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <h3>YouTube Analytics Expansion</h3>
                <p>
                  Private channel metrics available after OAuth
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                gap: 10
              }}
            >
              {[
                "Watch Time",
                "Avg. View Duration",
                "Subscribers Gained",
                "Subscribers Lost"
              ].map((metric) => (
                <div
                  key={metric}
                  style={{
                    border: "1px solid #e8ebf3",
                    borderRadius: 12,
                    padding: 13,
                    background: "#fbfcff"
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      color: "#7a839d",
                      fontSize: 9,
                      marginBottom: 5
                    }}
                  >
                    {metric}
                  </span>
                  <strong
                    style={{
                      color: "#b54708",
                      fontSize: 12
                    }}
                  >
                    API Pending
                  </strong>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section
          className="panel"
          style={{ marginBottom: 16 }}
        >
          <div className="panel-header">
            <div>
              <h3>Top Content by Views</h3>
              <p>Top 5 videos published in the selected period</p>
            </div>
          </div>

          {topContent.length === 0 ? (
            <p
              style={{
                color: "#8a92a8",
                fontSize: 11
              }}
            >
              No demo videos were found for this publish-date range.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12
              }}
            >
              {topContent.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "28px 1fr auto",
                    gap: 10,
                    alignItems: "center",
                    borderBottom: "1px solid #eef0f6",
                    paddingBottom: 10
                  }}
                >
                  <strong style={{ color: "#69718a" }}>
                    {String(index + 1).padStart(2, "0")}
                  </strong>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: 12,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                    >
                      {item.title}
                    </div>

                    <div
                      style={{
                        color: "#8a92a8",
                        fontSize: 10,
                        marginTop: 3
                      }}
                    >
                      {formatDate(item.publishedAt)} • ER{" "}
                      {contentEr(item).toFixed(2)}%
                    </div>
                  </div>

                  <strong>{formatCompact(item.views)}</strong>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel table-panel">
          <div className="panel-header">
            <div>
              <h3>YouTube Content</h3>
              <p>
                {content.length} videos in selected period •{" "}
                {youtubeDemoVideos.length} demo videos stored
              </p>
            </div>

            <span
              style={{
                borderRadius: 999,
                padding: "6px 9px",
                background: "#fff7ed",
                color: "#b54708",
                fontSize: 8,
                fontWeight: 900
              }}
            >
              DEMO DATA
            </span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Content</th>
                  <th>Views</th>
                  <th>Likes</th>
                  <th>Comments</th>
                  <th>Shares</th>
                  <th>ER</th>
                  <th>Link</th>
                </tr>
              </thead>

              <tbody>
                {content.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        textAlign: "center",
                        color: "#9aa2b7",
                        padding: "28px 12px"
                      }}
                    >
                      No demo videos match this publish-date range.
                    </td>
                  </tr>
                ) : (
                  content.map((item) => (
                    <tr key={item.id}>
                      <td>{formatDate(item.publishedAt)}</td>
                      <td style={{ maxWidth: 360 }}>
                        <div
                          style={{
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis"
                          }}
                        >
                          {item.title}
                        </div>
                      </td>
                      <td>{formatNumber(item.views)}</td>
                      <td>{formatNumber(item.likes)}</td>
                      <td>{formatNumber(item.comments)}</td>
                      <td>{formatNumber(item.shares)}</td>
                      <td>{contentEr(item).toFixed(2)}%</td>
                      <td>
                        <a
                          href={item.permalink}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: "#5364d8",
                            fontWeight: 800,
                            textDecoration: "none"
                          }}
                        >
                          Open ↗
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section
          className="panel"
          style={{
            marginBottom: 16,
            background: "#fffaf0",
            borderStyle: "dashed"
          }}
        >
          <strong
            style={{
              display: "block",
              marginBottom: 6
            }}
          >
            Prototype note
          </strong>

          <p
            style={{
              margin: 0,
              color: "#7a839d",
              fontSize: 10,
              lineHeight: 1.6
            }}
          >
            This page intentionally uses demo data so the layout can
            be reviewed before YouTube OAuth and API synchronization
            are connected. Content Performance Trend groups current
            video metrics by publish date; it does not claim the views
            were earned on each historical day.
          </p>
        </section>

        <footer>
          YouTube Performance • Demo Dashboard Prototype
        </footer>
      </main>
    </div>
  );
}
