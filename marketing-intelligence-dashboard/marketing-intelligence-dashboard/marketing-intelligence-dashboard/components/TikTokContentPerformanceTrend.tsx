"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type ContentItem = {
  id: string;
  publishedAt: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
};

export type TikTokContentRangeDays = 7 | 30 | 90 | 180 | 365;

type Props = {
  content: ContentItem[];
  anchorDate?: string | null;
  rangeDays: TikTokContentRangeDays;
  onRangeChange: (days: TikTokContentRangeDays) => void;
};
type MetricKey = "views" | "likes" | "comments" | "shares" | "er";

const RANGE_OPTIONS: Array<{
  days: TikTokContentRangeDays;
  label: string;
}> = [
  { days: 7, label: "7D" },
  { days: 30, label: "1M" },
  { days: 90, label: "3M" },
  { days: 180, label: "6M" },
  { days: 365, label: "1Y" }
];

const METRIC_OPTIONS: Array<{
  key: MetricKey;
  label: string;
}> = [
  { key: "views", label: "Views" },
  { key: "likes", label: "Likes" },
  { key: "comments", label: "Comments" },
  { key: "shares", label: "Shares" },
  { key: "er", label: "ER" }
];

function toDateKey(value: string | null) {
  if (!value) return null;
  const date = value.slice(0, 10);

  return /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? date
    : null;
}

function parseUtcDate(value: string) {
  return new Date(`${value}T00:00:00Z`);
}

function addDays(value: string, days: number) {
  const date = parseUtcDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC"
  }).format(parseUtcDate(value));
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(parseUtcDate(`${value}-01`));
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function formatMetricValue(
  metric: MetricKey,
  value: number
) {
  if (metric === "er") {
    return `${value.toFixed(2)}%`;
  }

  return formatCompact(value);
}

function getMondayKey(value: string) {
  const date = parseUtcDate(value);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;

  date.setUTCDate(
    date.getUTCDate() + diff
  );

  return date.toISOString().slice(0, 10);
}

function getAnchorDate(
  content: ContentItem[],
  explicitAnchor?: string | null
) {
  const explicit =
    toDateKey(explicitAnchor ?? null);

  if (explicit) return explicit;

  const latestContentDate = content
    .map((item) => toDateKey(item.publishedAt))
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);

  if (latestContentDate) {
    return latestContentDate;
  }

  return new Date()
    .toISOString()
    .slice(0, 10);
}

export default function TikTokContentPerformanceTrend({
  content,
  anchorDate,
  rangeDays,
  onRangeChange
}: Props) {
  const [metric, setMetric] =
    useState<MetricKey>("views");

  const chartData = useMemo(() => {
    const endDate =
      getAnchorDate(content, anchorDate);

    const startDate =
      addDays(endDate, -(rangeDays - 1));

    const filtered = content.filter((item) => {
      const date = toDateKey(item.publishedAt);

      return Boolean(
        date &&
        date >= startDate &&
        date <= endDate
      );
    });

    const bucketMode =
      rangeDays <= 30
        ? "day"
        : rangeDays <= 180
          ? "week"
          : "month";

    type Bucket = {
      key: string;
      label: string;
      views: number;
      likes: number;
      comments: number;
      shares: number;
      videos: number;
    };

    const buckets = new Map<string, Bucket>();

    const ensureBucket = (
      key: string,
      label: string
    ) => {
      if (!buckets.has(key)) {
        buckets.set(key, {
          key,
          label,
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          videos: 0
        });
      }

      return buckets.get(key)!;
    };

    if (bucketMode === "day") {
      let cursor = startDate;

      while (cursor <= endDate) {
        ensureBucket(
          cursor,
          formatDay(cursor)
        );

        cursor = addDays(cursor, 1);
      }
    }

    filtered.forEach((item) => {
      const date = toDateKey(item.publishedAt);
      if (!date) return;

      let key = date;
      let label = formatDay(date);

      if (bucketMode === "week") {
        key = getMondayKey(date);
        label = formatDay(key);
      }

      if (bucketMode === "month") {
        key = date.slice(0, 7);
        label = formatMonth(key);
      }

      const bucket =
        ensureBucket(key, label);

      bucket.views += Number(item.views || 0);
      bucket.likes += Number(item.likes || 0);
      bucket.comments += Number(item.comments || 0);
      bucket.shares += Number(item.shares || 0);
      bucket.videos += 1;
    });

    return Array.from(buckets.values())
      .sort((a, b) =>
        a.key.localeCompare(b.key)
      )
      .map((bucket) => {
        const interactions =
          bucket.likes +
          bucket.comments +
          bucket.shares;

        const er =
          bucket.views > 0
            ? (interactions / bucket.views) * 100
            : 0;

        return {
          ...bucket,
          er,
          value:
            metric === "er"
              ? er
              : bucket[metric]
        };
      });
  }, [
    content,
    anchorDate,
    rangeDays,
    metric
  ]);

  const selectedMetric =
    METRIC_OPTIONS.find(
      (item) => item.key === metric
    )?.label ?? "Views";

  const periodTotal = useMemo(() => {
    if (metric === "er") {
      const totalViews = chartData.reduce(
        (sum, item) => sum + item.views,
        0
      );

      const totalInteractions =
        chartData.reduce(
          (sum, item) =>
            sum +
            item.likes +
            item.comments +
            item.shares,
          0
        );

      return totalViews > 0
        ? (totalInteractions / totalViews) * 100
        : 0;
    }

    return chartData.reduce(
      (sum, item) =>
        sum + Number(item[metric] || 0),
      0
    );
  }, [chartData, metric]);

  const periodVideos = chartData.reduce(
    (sum, item) => sum + item.videos,
    0
  );

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
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 14,
          flexWrap: "wrap"
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 18
            }}
          >
            TikTok Content Performance Trend
          </h3>

          <p
            style={{
              margin: "4px 0 0",
              color: "#8b93a7",
              fontSize: 12
            }}
          >
            Current performance of videos grouped by publish date.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 4,
            padding: 4,
            borderRadius: 10,
            border: "1px solid #e5e7ef",
            background: "#f7f8fc"
          }}
        >
          {RANGE_OPTIONS.map((option) => {
            const active =
              rangeDays === option.days;

            return (
              <button
                key={option.days}
                type="button"
                onClick={() =>
                  onRangeChange(option.days)
                }
                style={{
                  border: active
                    ? "1px solid #5368e8"
                    : "1px solid transparent",
                  background: active
                    ? "#ffffff"
                    : "transparent",
                  color: active
                    ? "#3448c5"
                    : "#667085",
                  borderRadius: 7,
                  padding: "7px 10px",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: active
                    ? "0 1px 3px rgba(16,24,40,.08)"
                    : "none"
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
          flexWrap: "wrap"
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap"
          }}
        >
          {METRIC_OPTIONS.map((option) => {
            const active =
              metric === option.key;

            return (
              <button
                key={option.key}
                type="button"
                onClick={() =>
                  setMetric(option.key)
                }
                style={{
                  border: active
                    ? "1px solid #cbd3ff"
                    : "1px solid #e7eaf2",
                  background: active
                    ? "#eef1ff"
                    : "#ffffff",
                  color: active
                    ? "#4059d7"
                    : "#69718a",
                  borderRadius: 999,
                  padding: "7px 12px",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8
          }}
        >
          <span
            style={{
              color: "#8b93a7",
              fontSize: 10,
              fontWeight: 700
            }}
          >
            {periodVideos} videos
          </span>

          <strong
            style={{
              color: "#17213d",
              fontSize: 20
            }}
          >
            {formatMetricValue(
              metric,
              periodTotal
            )}
          </strong>

          <span
            style={{
              color: "#8b93a7",
              fontSize: 10
            }}
          >
            {selectedMetric}
          </span>
        </div>
      </div>

      {periodVideos === 0 ? (
        <div
          style={{
            minHeight: 220,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 12,
            border: "1px dashed #e1e5ef",
            color: "#8b93a7",
            fontSize: 12
          }}
        >
          No TikTok videos were published in this period.
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            height: 260
          }}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={chartData}
              margin={{
                top: 8,
                right: 10,
                left: 0,
                bottom: 0
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#edf0f7"
              />

              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                tick={{
                  fontSize: 10,
                  fill: "#8b93a7"
                }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                width={48}
                tick={{
                  fontSize: 10,
                  fill: "#8b93a7"
                }}
                tickFormatter={(value) =>
                  metric === "er"
                    ? `${Number(value).toFixed(1)}%`
                    : formatCompact(Number(value))
                }
              />

              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid #e7eaf2",
                  boxShadow:
                    "0 8px 24px rgba(16,24,40,.08)"
                }}
                formatter={(
                  value: number | string
                ) => [
                  formatMetricValue(
                    metric,
                    Number(value || 0)
                  ),
                  selectedMetric
                ]}
                labelFormatter={(
                  label
                ) => `${label}`}
              />

              <Line
                type="monotone"
                dataKey="value"
                stroke="#5368e8"
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 4
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
