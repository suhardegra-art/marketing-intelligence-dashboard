import Sidebar from "@/components/Sidebar";
import SyncAllTikTokButton from "@/app/tiktok/SyncAllTikTokButton";
import TikTokGrowthComparison from "@/components/TikTokGrowthComparison";
import TikTokContentPerformanceTrend from "@/components/TikTokContentPerformanceTrend";
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
    ((item.likes + item.comments + item.shares) / item.views) * 100
  );
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

export default async function TikTokPage({
  searchParams
}: TikTokPageProps) {
  const params = await searchParams;

  const [data, history, contentTrendData] =
    await Promise.all([
      getTikTokDashboardData({
        from: params.from,
        to: params.to
      }),
      getTikTokHistory({
        from: params.from,
        to: params.to
      }),
      getTikTokDashboardData({})
    ]);

  const growthTo =
    data.snapshotDate ||
    new Date().toISOString().slice(0, 10);

  const growthStart =
    new Date(`${growthTo}T00:00:00Z`);

  growthStart.setUTCDate(
    growthStart.getUTCDate() - 364
  );

  const growthFrom =
    growthStart.toISOString().slice(0, 10);

  const growthData =
    await getTikTokGrowthData({
      from: growthFrom,
      to: growthTo
    });

  const topContent = [...data.content]
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  const avgViews =
    data.periodVideos > 0
      ? Math.round(
          data.totalViews / data.periodVideos
        )
      : 0;

  const firstHistory = history[0];
  const latestHistory =
    history[history.length - 1];

  const followerGrowth =
    firstHistory && latestHistory
      ? latestHistory.followers -
        firstHistory.followers
      : 0;

  const maxFollowers =
    Math.max(
      ...history.map(
        (row) => row.followers
      ),
      1
    );

  const minFollowers =
    history.length > 0
      ? Math.min(
          ...history.map(
            (row) => row.followers
          )
        )
      : 0;

  const followerRange =
    Math.max(
      maxFollowers - minFollowers,
      1
    );

  return (
    <div className="app-shell">
      <Sidebar activeItem="TikTok" />

      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>TikTok Performance</h1>
            <p>
              Account and content data from the TikTok API
            </p>
          </div>

          <div className="topbar-actions">
            <div className="period-select">
              <span>Snapshot</span>
              <strong>
                {data.snapshotDate || "No data"}
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
                  textTransform: "uppercase",
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
                  data.toDate ?? undefined
                }
                style={{
                  minHeight: 40,
                  border:
                    "1px solid #dce1ef",
                  borderRadius: 10,
                  padding: "0 12px",
                  background: "#fbfcff",
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
                  textTransform: "uppercase",
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
                  data.fromDate ?? undefined
                }
                style={{
                  minHeight: 40,
                  border:
                    "1px solid #dce1ef",
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
                justifyContent: "center",
                border:
                  "1px solid #dce1ef",
                borderRadius: 10,
                padding: "0 16px",
                background: "white",
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
              "Followers (Current)",
              formatNumber(data.followers)
            ],
            [
              "Account Likes (Current)",
              formatCompact(
                data.totalAccountLikes
              )
            ],
            [
              "Videos in Period",
              formatNumber(
                data.periodVideos
              )
            ],
            [
              "Videos Stored",
              formatNumber(
                data.loadedVideos
              )
            ],
            [
              "Views in Period",
              formatCompact(
                data.totalViews
              )
            ],
            [
              "Avg. Views / Video",
              formatCompact(avgViews)
            ],
            [
              "Likes in Period",
              formatCompact(
                data.totalVideoLikes
              )
            ],
            [
              "Comments + Shares",
              formatCompact(
                data.totalComments +
                data.totalShares
              )
            ]
          ].map(
            ([label, value]) => (
              <article
                className="kpi-card"
                key={label}
              >
                <p>{label}</p>
                <strong>{value}</strong>
              </article>
            )
          )}
        </section>

        <TikTokGrowthComparison
          data={growthData}
        />

        <section className="two-column">
          <article className="panel">
            <div className="panel-header">
              <div>
                <h3>
                  Historical Snapshot
                </h3>
                <p>
                  Account snapshots
                  {data.fromDate ||
                  data.toDate
                    ? " within selected dates"
                    : " from recent daily syncs"}
                </p>
              </div>

              <div
                style={{
                  textAlign: "right"
                }}
              >
                <strong
                  style={{
                    color:
                      followerGrowth >= 0
                        ? "#22a976"
                        : "#e45763",
                    fontSize: 14
                  }}
                >
                  {followerGrowth >= 0
                    ? "+"
                    : ""}
                  {formatNumber(
                    followerGrowth
                  )}
                </strong>

                <div
                  style={{
                    color: "#9aa2b7",
                    fontSize: 9
                  }}
                >
                  follower growth
                </div>
              </div>
            </div>

            {history.length === 0 ? (
              <p
                style={{
                  color: "#8a92a8",
                  fontSize: 11
                }}
              >
                No account snapshot exists
                for this date range yet.
                Historical account data starts
                from the day automatic snapshots
                were enabled.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10
                }}
              >
                {history.map(
                  (row) => {
                    const width =
                      25 +
                      (
                        (
                          row.followers -
                          minFollowers
                        ) /
                        followerRange
                      ) * 75;

                    return (
                      <div
                        key={row.metricDate}
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "92px 1fr 70px",
                          gap: 10,
                          alignItems:
                            "center"
                        }}
                      >
                        <span
                          style={{
                            color: "#70788e",
                            fontSize: 10
                          }}
                        >
                          {formatDate(
                            row.metricDate
                          )}
                        </span>

                        <div
                          style={{
                            height: 9,
                            background:
                              "#eef0f6",
                            borderRadius: 999,
                            overflow: "hidden"
                          }}
                        >
                          <div
                            style={{
                              width:
                                `${width}%`,
                              height: "100%",
                              background:
                                "linear-gradient(90deg,#4059d7,#7259dc)",
                              borderRadius: 999
                            }}
                          />
                        </div>

                        <strong
                          style={{
                            fontSize: 10,
                            textAlign: "right"
                          }}
                        >
                          {formatNumber(
                            row.followers
                          )}
                        </strong>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <h3>
                  Content Engagement
                </h3>
                <p>
                  Videos published in the
                  selected date range
                </p>
              </div>
            </div>

            <div className="bar-chart">
              {[
                [
                  "Likes",
                  data.totalVideoLikes
                ],
                [
                  "Comments",
                  data.totalComments
                ],
                [
                  "Shares",
                  data.totalShares
                ],
                [
                  "Interactions",
                  data.totalInteractions
                ]
              ].map(
                ([label, value]) => {
                  const numeric =
                    Number(value);

                  const max =
                    Math.max(
                      data.totalVideoLikes,
                      data.totalComments,
                      data.totalShares,
                      data.totalInteractions,
                      1
                    );

                  return (
                    <div
                      className="bar-row"
                      key={String(label)}
                    >
                      <span className="bar-label">
                        {label}
                      </span>

                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{
                            width:
                              `${Math.max(
                                4,
                                (
                                  numeric /
                                  max
                                ) * 100
                              )}%`
                          }}
                        />
                      </div>

                      <strong>
                        {formatCompact(
                          numeric
                        )}
                      </strong>
                    </div>
                  );
                }
              )}
            </div>
          </article>
        </section>

        <section
          className="panel"
          style={{
            marginBottom: 16
          }}
        >
          <div className="panel-header">
            <div>
              <h3>
                Top Content by Views
              </h3>
              <p>
                Top 5 videos published
                in the selected period
              </p>
            </div>
          </div>

          {topContent.length === 0 ? (
            <p
              style={{
                color: "#8a92a8",
                fontSize: 11
              }}
            >
              No TikTok videos were found
              for this publish-date range.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12
              }}
            >
              {topContent.map(
                (item, index) => (
                  <div
                    key={item.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "28px 1fr auto",
                      gap: 10,
                      alignItems: "center",
                      borderBottom:
                        "1px solid #eef0f6",
                      paddingBottom: 10
                    }}
                  >
                    <strong
                      style={{
                        color: "#69718a"
                      }}
                    >
                      {String(
                        index + 1
                      ).padStart(2, "0")}
                    </strong>

                    <div
                      style={{
                        minWidth: 0
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: 12,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow:
                            "ellipsis"
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
                        {formatDate(
                          item.publishedAt
                        )}{" "}
                        • ER{" "}
                        {engagementRate(
                          item
                        ).toFixed(2)}%
                      </div>
                    </div>

                    <strong>
                      {formatCompact(
                        item.views
                      )}
                    </strong>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        <TikTokContentPerformanceTrend
          content={contentTrendData.content}
          anchorDate={
            contentTrendData.snapshotDate
          }
        />

        <section className="panel table-panel">
          <div className="panel-header">
            <div>
              <h3>
                TikTok Content
              </h3>
              <p>
                {data.periodVideos} videos in selected period •{" "}
                {data.loadedVideos} total videos stored
              </p>
            </div>

            <TikTokExportButton />
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
                {data.content.map(
                  (item) => (
                    <tr key={item.id}>
                      <td>
                        {formatDate(
                          item.publishedAt
                        )}
                      </td>

                      <td
                        style={{
                          maxWidth: 360
                        }}
                      >
                        <div
                          style={{
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow:
                              "ellipsis"
                          }}
                        >
                          {item.title}
                        </div>
                      </td>

                      <td>
                        {formatNumber(
                          item.views
                        )}
                      </td>

                      <td>
                        {formatNumber(
                          item.likes
                        )}
                      </td>

                      <td>
                        {formatNumber(
                          item.comments
                        )}
                      </td>

                      <td>
                        {formatNumber(
                          item.shares
                        )}
                      </td>

                      <td>
                        {engagementRate(
                          item
                        ).toFixed(2)}%
                      </td>

                      <td>
                        {item.permalink ? (
                          <a
                            href={
                              item.permalink
                            }
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: "#5364d8",
                              fontWeight: 800,
                              textDecoration:
                                "none"
                            }}
                          >
                            Open ↗
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  )
                )}
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
          <strong
            style={{
              display: "block",
              marginBottom: 6
            }}
          >
            How the date range works
          </strong>

          <p
            style={{
              margin: 0,
              color: "#7a839d",
              fontSize: 11,
              lineHeight: 1.6
            }}
          >
            The From/To filter selects videos by their TikTok publish date.
            Growth Comparison uses daily snapshots: with no date selected it
            shows the latest available 30-day trend, while a complete From/To
            selection automatically compares the chosen period with the
            immediately preceding period of equal length.
          </p>
        </section>

        <section
          className="panel"
          style={{
            marginBottom: 16
          }}
        >
          {!data.connected ? (
            <section
              className="panel"
              style={{
                marginBottom: 16
              }}
            >
              <h3
                style={{
                  marginTop: 0
                }}
              >
                TikTok data unavailable
              </h3>

              <p
                style={{
                  color: "#7a839d",
                  marginBottom: 16
                }}
              >
                {data.message}
              </p>

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
              currentLoaded={
                data.loadedVideos
              }
              expectedTotal={
                data.videoCount
              }
            />
          )}

          <TikTokSyncMonitoring />
        </section>

        <footer>
          TikTok Performance • Live Supabase Data
        </footer>
      </main>
    </div>
  );
}
