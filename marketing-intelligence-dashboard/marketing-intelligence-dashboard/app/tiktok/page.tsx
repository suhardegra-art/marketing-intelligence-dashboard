import Sidebar from "@/components/Sidebar";
import SyncAllTikTokButton from "@/app/tiktok/SyncAllTikTokButton";
import { getTikTokDashboardData } from "@/lib/tiktok-dashboard";
import { getTikTokHistory } from "@/lib/tiktok-history";

export const dynamic = "force-dynamic";

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
  return ((item.likes + item.comments + item.shares) / item.views) * 100;
}

export default async function TikTokPage() {
  const [data, history] = await Promise.all([
    getTikTokDashboardData(),
    getTikTokHistory(7)
  ]);

  const topContent = [...data.content]
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  const avgViews =
    data.loadedVideos > 0 ? Math.round(data.totalViews / data.loadedVideos) : 0;

  const firstHistory = history[0];
  const latestHistory = history[history.length - 1];
  const followerGrowth =
    firstHistory && latestHistory
      ? latestHistory.followers - firstHistory.followers
      : 0;

  const maxFollowers = Math.max(...history.map((row) => row.followers), 1);
  const minFollowers =
    history.length > 0 ? Math.min(...history.map((row) => row.followers)) : 0;
  const followerRange = Math.max(maxFollowers - minFollowers, 1);

  return (
    <div className="app-shell">
      <Sidebar activeItem="TikTok" />
      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>TikTok Performance</h1>
            <p>Live account and content data from the TikTok API</p>
          </div>
          <div className="topbar-actions">
            <div className="period-select">
              <span>Snapshot</span>
              <strong>{data.snapshotDate || "No data"}</strong>
            </div>
            <div className="avatar">TT</div>
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
              "linear-gradient(120deg,#101010 0%,#17151f 55%,#29213e 100%)",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            gap: 24,
            alignItems: "center",
            boxShadow: "0 12px 30px rgba(20,20,40,.12)"
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
            <h2 style={{ margin: 0, fontSize: 30 }}>
              {data.accountName}
            </h2>
            <p
              style={{
                margin: "8px 0 0",
                color: "rgba(255,255,255,.68)",
                fontSize: 13
              }}
            >
              {data.username ? `@${data.username}` : "Connected TikTok account"}
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
                border: "1px solid rgba(255,255,255,.22)",
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

        {!data.connected ? (
          <section className="panel" style={{ marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>TikTok data unavailable</h3>
            <p style={{ color: "#7a839d", marginBottom: 16 }}>{data.message}</p>
            <a
              href="/api/tiktok/connect"
              style={{
                display: "inline-flex",
                background: "#111827",
                color: "white",
                textDecoration: "none",
                padding: "10px 15px",
                borderRadius: 9,
                fontWeight: 800,
                fontSize: 12
              }}
            >
              Connect TikTok
            </a>
          </section>
        ) : (
          <SyncAllTikTokButton
            currentLoaded={data.loadedVideos}
            expectedTotal={data.videoCount}
          />
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,minmax(0,1fr))",
            gap: 12,
            marginBottom: 16
          }}
        >
          {[
            ["Followers", formatNumber(data.followers)],
            ["Total Account Likes", formatCompact(data.totalAccountLikes)],
            ["Total Videos", formatNumber(data.videoCount)],
            ["Videos Loaded", formatNumber(data.loadedVideos)],
            ["Views (Loaded Videos)", formatCompact(data.totalViews)],
            ["Avg. Views / Video", formatCompact(avgViews)],
            ["Likes (Loaded Videos)", formatCompact(data.totalVideoLikes)],
            ["Comments + Shares", formatCompact(data.totalComments + data.totalShares)]
          ].map(([label, value]) => (
            <article className="kpi-card" key={label}>
              <p>{label}</p>
              <strong>{value}</strong>
            </article>
          ))}
        </section>

        <section className="two-column">
          <article className="panel">
            <div className="panel-header">
              <div>
                <h3>Historical Snapshot</h3>
                <p>Daily account snapshots saved automatically</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <strong
                  style={{
                    color: followerGrowth >= 0 ? "#22a976" : "#e45763",
                    fontSize: 14
                  }}
                >
                  {followerGrowth >= 0 ? "+" : ""}
                  {formatNumber(followerGrowth)}
                </strong>
                <div style={{ color: "#9aa2b7", fontSize: 9 }}>
                  follower growth
                </div>
              </div>
            </div>

            {history.length === 0 ? (
              <p style={{ color: "#8a92a8", fontSize: 11 }}>
                The first automatic daily snapshot will appear after the cron
                job runs.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {history.map((row) => {
                  const width =
                    25 +
                    ((row.followers - minFollowers) / followerRange) * 75;

                  return (
                    <div
                      key={row.metricDate}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "92px 1fr 70px",
                        gap: 10,
                        alignItems: "center"
                      }}
                    >
                      <span style={{ color: "#70788e", fontSize: 10 }}>
                        {formatDate(row.metricDate)}
                      </span>
                      <div
                        style={{
                          height: 9,
                          background: "#eef0f6",
                          borderRadius: 999,
                          overflow: "hidden"
                        }}
                      >
                        <div
                          style={{
                            width: `${width}%`,
                            height: "100%",
                            background:
                              "linear-gradient(90deg,#4059d7,#7259dc)",
                            borderRadius: 999
                          }}
                        />
                      </div>
                      <strong style={{ fontSize: 10, textAlign: "right" }}>
                        {formatNumber(row.followers)}
                      </strong>
                    </div>
                  );
                })}
              </div>
            )}
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <h3>Content Engagement</h3>
                <p>Aggregated from the currently loaded public videos</p>
              </div>
            </div>

            <div className="bar-chart">
              {[
                ["Likes", data.totalVideoLikes],
                ["Comments", data.totalComments],
                ["Shares", data.totalShares],
                ["Interactions", data.totalInteractions]
              ].map(([label, value]) => {
                const numeric = Number(value);
                const max = Math.max(
                  data.totalVideoLikes,
                  data.totalComments,
                  data.totalShares,
                  data.totalInteractions,
                  1
                );

                return (
                  <div className="bar-row" key={String(label)}>
                    <span className="bar-label">{label}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${Math.max(4, (numeric / max) * 100)}%` }}
                      />
                    </div>
                    <strong>{formatCompact(numeric)}</strong>
                  </div>
                );
              })}
            </div>
          </article>
        </section>

        <section className="panel" style={{ marginBottom: 16 }}>
          <div className="panel-header">
            <div>
              <h3>Top Content by Views</h3>
              <p>Top 5 of the videos currently synced</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
                    {engagementRate(item).toFixed(2)}%
                  </div>
                </div>
                <strong>{formatCompact(item.views)}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="panel table-panel">
          <div className="panel-header">
            <div>
              <h3>TikTok Content</h3>
              <p>
                Real data synced from TikTok API • {data.loadedVideos} videos currently stored
              </p>
            </div>
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
                {data.content.map((item) => (
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
                    <td>{engagementRate(item).toFixed(2)}%</td>
                    <td>
                      {item.permalink ? (
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
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section
          className="panel"
          style={{
            marginBottom: 16,
            background: "#f8f9fe",
            borderStyle: "dashed"
          }}
        >
          <strong style={{ display: "block", marginBottom: 6 }}>
            Automatic daily sync
          </strong>
          <p style={{ margin: 0, color: "#7a839d", fontSize: 11, lineHeight: 1.6 }}>
            Vercel Cron will refresh TikTok account metrics and public video
            metrics once per day. Daily values are stored as historical
            snapshots in Supabase. Manual Sync All Videos remains available as
            a fallback.
          </p>
        </section>

        <footer>TikTok Performance • Live Supabase Data</footer>
      </main>
    </div>
  );
}
