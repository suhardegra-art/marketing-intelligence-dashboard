"use client";

import {
  useEffect,
  useMemo,
  useState
} from "react";

import type {
  TikTokContentRangeDays
} from "@/components/TikTokContentPerformanceTrend";

type ContentItem = {
  id: string;
  title: string;
  caption: string | null;
  publishedAt: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
};

type GrowthPoint = {
  date: string;
  value: number;
};

type GrowthMetric = {
  key: string;
  currentSeries?: GrowthPoint[];
};

type GrowthData = {
  metrics?: GrowthMetric[];
} | null;

type Analysis = {
  executive_summary: string;
  whats_working: string[];
  needs_attention: string[];
  recommended_actions: string[];
  confidence_note: string;
};

type StoredAnalysis = {
  analysis: Analysis;
  model: string;
  generatedAt: string;
};

type Props = {
  accountName: string;
  username: string | null;
  snapshotDate: string | null;
  followers: number;
  accountLikes: number;
  content: ContentItem[];
  growthData: GrowthData;
  rangeDays: TikTokContentRangeDays;
};

const RANGE_LABELS: Record<
  TikTokContentRangeDays,
  string
> = {
  7: "7D",
  30: "1M",
  90: "3M",
  180: "6M",
  365: "1Y"
};

function toDateKey(
  value: string | null
) {
  if (!value) {
    return null;
  }

  const date =
    value.slice(0, 10);

  return /^\d{4}-\d{2}-\d{2}$/.test(
    date
  )
    ? date
    : null;
}

function parseUtcDate(
  value: string
) {
  return new Date(
    `${value}T00:00:00Z`
  );
}

function addDays(
  value: string,
  days: number
) {
  const date =
    parseUtcDate(value);

  date.setUTCDate(
    date.getUTCDate() + days
  );

  return date
    .toISOString()
    .slice(0, 10);
}

function getAnchorDate(
  content: ContentItem[],
  snapshotDate: string | null
) {
  const snapshot =
    toDateKey(snapshotDate);

  if (snapshot) {
    return snapshot;
  }

  const latestContent =
    content
      .map(
        (item) =>
          toDateKey(
            item.publishedAt
          )
      )
      .filter(
        (
          item
        ): item is string =>
          Boolean(item)
      )
      .sort()
      .at(-1);

  return (
    latestContent ||
    new Date()
      .toISOString()
      .slice(0, 10)
  );
}

function formatCompact(
  value: number
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      notation: "compact",
      maximumFractionDigits: 1
    }
  ).format(value);
}

function formatDateTime(
  value: string
) {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  ).format(
    new Date(value)
  );
}

function contentEr(
  item: ContentItem
) {
  if (!item.views) {
    return 0;
  }

  return (
    (
      item.likes +
      item.comments +
      item.shares
    ) /
    item.views
  ) * 100;
}

export default function TikTokAIAnalysis({
  accountName,
  username,
  snapshotDate,
  followers,
  accountLikes,
  content,
  growthData,
  rangeDays
}: Props) {
  const [result, setResult] =
    useState<StoredAnalysis | null>(
      null
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const anchorDate =
    useMemo(
      () =>
        getAnchorDate(
          content,
          snapshotDate
        ),
      [
        content,
        snapshotDate
      ]
    );

  const startDate =
    useMemo(
      () =>
        addDays(
          anchorDate,
          -(rangeDays - 1)
        ),
      [
        anchorDate,
        rangeDays
      ]
    );

  const selectedContent =
    useMemo(
      () =>
        content.filter(
          (item) => {
            const date =
              toDateKey(
                item.publishedAt
              );

            return Boolean(
              date &&
              date >= startDate &&
              date <= anchorDate
            );
          }
        ),
      [
        content,
        startDate,
        anchorDate
      ]
    );

  const periodLabel =
    RANGE_LABELS[rangeDays];

  const storageKey =
    useMemo(
      () =>
        `tiktok-ai-analysis-v1:${
          username ||
          accountName
        }:${periodLabel}`,
      [
        username,
        accountName,
        periodLabel
      ]
    );

  useEffect(() => {
    setError(null);

    try {
      const raw =
        window.localStorage.getItem(
          storageKey
        );

      if (!raw) {
        setResult(null);
        return;
      }

      const parsed =
        JSON.parse(
          raw
        ) as StoredAnalysis;

      if (
        parsed?.analysis &&
        parsed?.generatedAt
      ) {
        setResult(parsed);
      } else {
        setResult(null);
      }
    } catch {
      setResult(null);
    }
  }, [storageKey]);

  const summary =
    useMemo(() => {
      const views =
        selectedContent.reduce(
          (sum, item) =>
            sum +
            Number(
              item.views || 0
            ),
          0
        );

      const likes =
        selectedContent.reduce(
          (sum, item) =>
            sum +
            Number(
              item.likes || 0
            ),
          0
        );

      const comments =
        selectedContent.reduce(
          (sum, item) =>
            sum +
            Number(
              item.comments || 0
            ),
          0
        );

      const shares =
        selectedContent.reduce(
          (sum, item) =>
            sum +
            Number(
              item.shares || 0
            ),
          0
        );

      const interactions =
        likes +
        comments +
        shares;

      const engagementRate =
        views > 0
          ? (
              interactions /
              views
            ) * 100
          : 0;

      const avgViews =
        selectedContent.length > 0
          ? Math.round(
              views /
              selectedContent.length
            )
          : 0;

      const followerMetric =
        growthData?.metrics?.find(
          (item) =>
            item.key ===
            "followers"
        );

      const followerSeries =
        (
          followerMetric
            ?.currentSeries ||
          []
        ).filter(
          (point) =>
            point.date >=
              startDate &&
            point.date <=
              anchorDate
        );

      const firstFollower =
        followerSeries[0]
          ?.value ?? null;

      const lastFollower =
        followerSeries[
          followerSeries.length -
            1
        ]?.value ?? null;

      const followerChange =
        firstFollower !== null &&
        lastFollower !== null &&
        followerSeries.length >=
          2
          ? lastFollower -
            firstFollower
          : null;

      const followerChangePercent =
        followerChange !== null &&
        firstFollower &&
        firstFollower !== 0
          ? (
              followerChange /
              firstFollower
            ) * 100
          : null;

      return {
        posts:
          selectedContent.length,
        views,
        likes,
        comments,
        shares,
        interactions,
        engagementRate,
        avgViews,
        followerChange,
        followerChangePercent
      };
    }, [
      selectedContent,
      growthData,
      startDate,
      anchorDate
    ]);

  const topContent =
    useMemo(
      () =>
        [...selectedContent]
          .sort(
            (a, b) =>
              b.views -
              a.views
          )
          .slice(0, 10)
          .map(
            (item) => ({
              date:
                toDateKey(
                  item.publishedAt
                ),
              title:
                item.title,
              caption:
                item.caption
                  ?.slice(0, 280) ||
                null,
              views:
                item.views,
              likes:
                item.likes,
              comments:
                item.comments,
              shares:
                item.shares,
              engagement_rate:
                Number(
                  contentEr(
                    item
                  ).toFixed(
                    2
                  )
                )
            })
          ),
      [selectedContent]
    );

  const recentContent =
    useMemo(
      () =>
        [...selectedContent]
          .sort(
            (a, b) =>
              (
                b.publishedAt ||
                ""
              ).localeCompare(
                a.publishedAt ||
                ""
              )
          )
          .slice(0, 20)
          .map(
            (item) => ({
              date:
                toDateKey(
                  item.publishedAt
                ),
              title:
                item.title,
              caption:
                item.caption
                  ?.slice(0, 280) ||
                null,
              views:
                item.views,
              likes:
                item.likes,
              comments:
                item.comments,
              shares:
                item.shares,
              engagement_rate:
                Number(
                  contentEr(
                    item
                  ).toFixed(
                    2
                  )
                )
            })
          ),
      [selectedContent]
    );

  async function generateAnalysis() {
    if (
      selectedContent.length === 0
    ) {
      setError(
        "No TikTok content is available for this period."
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response =
        await fetch(
          "/api/ai/analyze",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body:
              JSON.stringify({
                platform:
                  "TikTok",
                account:
                  username
                    ? `@${username}`
                    : accountName,
                language:
                  "Bahasa Indonesia",
                period: {
                  label:
                    periodLabel,
                  from:
                    startDate,
                  to:
                    anchorDate
                },
                data: {
                  account: {
                    account_name:
                      accountName,
                    username:
                      username,
                    followers_current:
                      followers,
                    account_likes_current:
                      accountLikes
                  },
                  period_summary: {
                    ...summary,
                    engagementRate:
                      Number(
                        summary.engagementRate.toFixed(
                          2
                        )
                      ),
                    followerChangePercent:
                      summary.followerChangePercent ===
                      null
                        ? null
                        : Number(
                            summary.followerChangePercent.toFixed(
                              2
                            )
                          )
                  },
                  top_content_by_views:
                    topContent,
                  recent_content:
                    recentContent
                }
              })
          }
        );

      const payload =
        await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            "Unable to generate AI analysis."
        );
      }

      const stored: StoredAnalysis = {
        analysis:
          payload.analysis,
        model:
          payload.model,
        generatedAt:
          payload.generatedAt
      };

      setResult(stored);

      try {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify(
            stored
          )
        );
      } catch {
        // Browser storage is optional.
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to generate AI analysis."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="panel"
      style={{
        marginBottom: 16,
        padding: 16
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "flex-start",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 16
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 5px",
              color: "#7259dc",
              fontSize: 9,
              fontWeight: 900,
              letterSpacing:
                ".12em"
            }}
          >
            GEMINI AI
          </p>

          <h3
            style={{
              margin: 0,
              fontSize: 18
            }}
          >
            AI Performance Analysis
          </h3>

          <p
            style={{
              margin: "4px 0 0",
              color: "#8b93a7",
              fontSize: 12
            }}
          >
            Evidence-based analysis of recent TikTok performance and content.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap"
          }}
        >
          <span
            style={{
              color: "#8b93a7",
              fontSize: 10,
              fontWeight: 700
            }}
          >
            Period: {periodLabel}
          </span>

          <button
            type="button"
            onClick={
              generateAnalysis
            }
            disabled={
              loading ||
              selectedContent.length ===
                0
            }
            style={{
              minHeight: 40,
              border: 0,
              borderRadius: 10,
              padding:
                "0 15px",
              background:
                loading
                  ? "#9aa4db"
                  : "#4059d7",
              color: "white",
              fontSize: 11,
              fontWeight: 900,
              cursor:
                loading
                  ? "wait"
                  : "pointer",
              opacity:
                selectedContent.length ===
                0
                  ? 0.55
                  : 1
            }}
          >
            {loading
              ? "Analyzing..."
              : result
                ? "↻ Refresh Analysis"
                : "✦ Generate Analysis"}
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 14
        }}
      >
        {[
          [
            "Posts",
            String(
              summary.posts
            )
          ],
          [
            "Views",
            formatCompact(
              summary.views
            )
          ],
          [
            "Engagement",
            `${summary.engagementRate.toFixed(
              2
            )}%`
          ],
          [
            "Follower Change",
            summary.followerChange ===
            null
              ? "N/A"
              : `${
                  summary.followerChange >=
                  0
                    ? "+"
                    : ""
                }${formatCompact(
                  summary.followerChange
                )}`
          ]
        ].map(
          ([label, value]) => (
            <div
              key={label}
              style={{
                minWidth: 120,
                padding:
                  "10px 12px",
                background:
                  "#f8f9fd",
                border:
                  "1px solid #edf0f7",
                borderRadius: 10
              }}
            >
              <div
                style={{
                  color:
                    "#8b93a7",
                  fontSize: 9,
                  fontWeight:
                    800,
                  textTransform:
                    "uppercase",
                  letterSpacing:
                    ".06em"
                }}
              >
                {label}
              </div>

              <strong
                style={{
                  display:
                    "block",
                  marginTop: 3,
                  color:
                    "#17213d",
                  fontSize: 14
                }}
              >
                {value}
              </strong>
            </div>
          )
        )}
      </div>

      {error ? (
        <div
          style={{
            marginBottom: 14,
            padding: 12,
            borderRadius: 10,
            background:
              "#fff5f5",
            border:
              "1px solid #ffd8d8",
            color:
              "#b42318",
            fontSize: 11
          }}
        >
          {error}
        </div>
      ) : null}

      {!result ? (
        <div
          style={{
            minHeight: 150,
            display: "flex",
            alignItems: "center",
            justifyContent:
              "center",
            textAlign: "center",
            borderRadius: 12,
            border:
              "1px dashed #dde2ee",
            background:
              "#fbfcff",
            padding: 20
          }}
        >
          <div>
            <strong
              style={{
                display:
                  "block",
                color:
                  "#344054",
                fontSize: 13,
                marginBottom: 5
              }}
            >
              Generate an AI analysis for {periodLabel}
            </strong>

            <span
              style={{
                color:
                  "#8b93a7",
                fontSize: 11
              }}
            >
              Gemini will analyze performance metrics, top content, recent content, engagement, and available follower history.
            </span>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 12
          }}
        >
          <article
            style={{
              padding: 16,
              borderRadius: 12,
              border:
                "1px solid #e8ebf3",
              background:
                "#fbfcff"
            }}
          >
            <div
              style={{
                color:
                  "#7259dc",
                fontSize: 9,
                fontWeight: 900,
                textTransform:
                  "uppercase",
                letterSpacing:
                  ".08em",
                marginBottom: 7
              }}
            >
              Executive Summary
            </div>

            <p
              style={{
                margin: 0,
                color:
                  "#344054",
                fontSize: 12,
                lineHeight: 1.65
              }}
            >
              {
                result.analysis
                  .executive_summary
              }
            </p>
          </article>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2,minmax(0,1fr))",
              gap: 12
            }}
          >
            <article
              style={{
                padding: 16,
                borderRadius: 12,
                border:
                  "1px solid #e8ebf3"
              }}
            >
              <div
                style={{
                  color:
                    "#169b6b",
                  fontSize: 10,
                  fontWeight: 900,
                  marginBottom: 9
                }}
              >
                What&apos;s Working
              </div>

              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  display: "grid",
                  gap: 7,
                  color:
                    "#475467",
                  fontSize: 11,
                  lineHeight: 1.55
                }}
              >
                {result.analysis.whats_working.map(
                  (
                    item,
                    index
                  ) => (
                    <li
                      key={
                        index
                      }
                    >
                      {item}
                    </li>
                  )
                )}
              </ul>
            </article>

            <article
              style={{
                padding: 16,
                borderRadius: 12,
                border:
                  "1px solid #e8ebf3"
              }}
            >
              <div
                style={{
                  color:
                    "#d17625",
                  fontSize: 10,
                  fontWeight: 900,
                  marginBottom: 9
                }}
              >
                Needs Attention
              </div>

              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  display: "grid",
                  gap: 7,
                  color:
                    "#475467",
                  fontSize: 11,
                  lineHeight: 1.55
                }}
              >
                {result.analysis.needs_attention.map(
                  (
                    item,
                    index
                  ) => (
                    <li
                      key={
                        index
                      }
                    >
                      {item}
                    </li>
                  )
                )}
              </ul>
            </article>
          </div>

          <article
            style={{
              padding: 16,
              borderRadius: 12,
              border:
                "1px solid #e8ebf3"
            }}
          >
            <div
              style={{
                color:
                  "#4059d7",
                fontSize: 10,
                fontWeight: 900,
                marginBottom: 9
              }}
            >
              Recommended Actions
            </div>

            <ol
              style={{
                margin: 0,
                paddingLeft: 20,
                display: "grid",
                gap: 8,
                color:
                  "#344054",
                fontSize: 11,
                lineHeight: 1.55
              }}
            >
              {result.analysis.recommended_actions.map(
                (
                  item,
                  index
                ) => (
                  <li
                    key={
                      index
                    }
                  >
                    {item}
                  </li>
                )
              )}
            </ol>
          </article>

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              gap: 12,
              flexWrap: "wrap",
              color:
                "#98a2b3",
              fontSize: 9
            }}
          >
            <span>
              {
                result.analysis
                  .confidence_note
              }
            </span>

            <span>
              Last analyzed:{" "}
              {formatDateTime(
                result.generatedAt
              )}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
