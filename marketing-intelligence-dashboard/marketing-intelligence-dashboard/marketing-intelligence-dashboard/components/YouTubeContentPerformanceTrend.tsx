"use client";

import { useMemo, useState } from "react";
import type { YouTubeVideo } from "@/lib/youtube-demo-data";

export type YouTubeContentRangeDays = 7 | 30 | 90 | 180 | 365;
type Metric = "views" | "likes" | "comments" | "shares" | "er";

type Props = {
  content: YouTubeVideo[];
  anchorDate: string;
  rangeDays: YouTubeContentRangeDays;
  onRangeChange: (days: YouTubeContentRangeDays) => void;
};

const RANGE_OPTIONS: Array<{
  label: string;
  days: YouTubeContentRangeDays;
}> = [
  { label: "7D", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 }
];

const METRICS: Array<{
  key: Metric;
  label: string;
}> = [
  { key: "views", label: "Views" },
  { key: "likes", label: "Likes" },
  { key: "comments", label: "Comments" },
  { key: "shares", label: "Shares" },
  { key: "er", label: "ER" }
];

function parseDate(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00Z`);
}

function rangeStart(anchorDate: string, days: number) {
  const date = parseDate(anchorDate);
  date.setUTCDate(date.getUTCDate() - (days - 1));
  return date.toISOString().slice(0, 10);
}

function dateKey(value: string) {
  return value.slice(0, 10);
}

function weekKey(value: string) {
  const date = parseDate(dateKey(value));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  return date.toISOString().slice(0, 10);
}

function monthKey(value: string) {
  return value.slice(0, 7);
}

function bucketKey(
  value: string,
  rangeDays: YouTubeContentRangeDays
) {
  if (rangeDays <= 30) return dateKey(value);
  if (rangeDays <= 180) return weekKey(value);
  return monthKey(value);
}

function bucketLabel(
  key: string,
  rangeDays: YouTubeContentRangeDays
) {
  if (rangeDays === 365) {
    const [year, month] = key.split("-");

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      year: "2-digit"
    }).format(new Date(`${year}-${month}-01T00:00:00Z`));
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short"
  }).format(parseDate(key));
}

function formatMetric(value: number, metric: Metric) {
  if (metric === "er") {
    return `${value.toFixed(2)}%`;
  }

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

export default function YouTubeContentPerformanceTrend({
  content,
  anchorDate,
  rangeDays,
  onRangeChange
}: Props) {
  const [metric, setMetric] =
    useState<Metric>("views");

  const rows = useMemo(() => {
    const from = rangeStart(anchorDate, rangeDays);

    const filtered = content.filter((item) => {
      const date = dateKey(item.publishedAt);
      return date >= from && date <= anchorDate;
    });

    const grouped = new Map<
      string,
      {
        views: number;
        likes: number;
        comments: number;
        shares: number;
        count: number;
      }
    >();

    for (const item of filtered) {
      const key = bucketKey(item.publishedAt, rangeDays);
      const current = grouped.get(key) || {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        count: 0
      };

      current.views += item.views;
      current.likes += item.likes;
      current.comments += item.comments;
      current.shares += item.shares;
      current.count += 1;

      grouped.set(key, current);
    }

    return [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => {
        const interactions =
          value.likes + value.comments + value.shares;

        return {
          key,
          label: bucketLabel(key, rangeDays),
          videos: value.count,
          views: value.views,
          likes: value.likes,
          comments: value.comments,
          shares: value.shares,
          er: value.views
            ? (interactions / value.views) * 100
            : 0
        };
      });
  }, [content, anchorDate, rangeDays]);

  const width = 760;
  const height = 240;
  const left = 20;
  const right = 20;
  const top = 24;
  const bottom = 42;

  const max = Math.max(
    ...rows.map((row) => Number(row[metric])),
    1
  );

  const points = rows.map((row, index) => ({
    ...row,
    x:
      rows.length <= 1
        ? width / 2
        : left +
          (index / (rows.length - 1)) *
            (width - left - right),
    y:
      top +
      (1 - Number(row[metric]) / max) *
        (height - top - bottom)
  }));

  const selectedTotal =
    metric === "er"
      ? rows.length
        ? rows.reduce((sum, row) => sum + row.er, 0) /
          rows.length
        : 0
      : rows.reduce(
          (sum, row) => sum + Number(row[metric]),
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
        className="panel-header"
        style={{
          alignItems: "flex-start",
          gap: 14
        }}
      >
        <div>
          <h3>Content Performance Trend</h3>
          <p>
            Current video metrics grouped by publish date • demo data
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 7,
            alignItems: "flex-end"
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 5,
              flexWrap: "wrap",
              justifyContent: "flex-end"
            }}
          >
            {RANGE_OPTIONS.map((option) => {
              const active = option.days === rangeDays;

              return (
                <button
                  key={option.days}
                  type="button"
                  onClick={() => onRangeChange(option.days)}
                  style={{
                    minHeight: 30,
                    borderRadius: 8,
                    border: active
                      ? "1px solid #5368e8"
                      : "1px solid #e4e7ef",
                    background: active ? "#eef1ff" : "#fff",
                    color: active ? "#4059d7" : "#7a839d",
                    padding: "0 10px",
                    fontSize: 9,
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
              gap: 5,
              flexWrap: "wrap",
              justifyContent: "flex-end"
            }}
          >
            {METRICS.map((item) => {
              const active = item.key === metric;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setMetric(item.key)}
                  style={{
                    minHeight: 28,
                    borderRadius: 8,
                    border: active
                      ? "1px solid #202632"
                      : "1px solid #e4e7ef",
                    background: active ? "#202632" : "#fff",
                    color: active ? "#fff" : "#7a839d",
                    padding: "0 9px",
                    fontSize: 9,
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "150px 1fr",
          gap: 18,
          alignItems: "stretch"
        }}
      >
        <div
          style={{
            border: "1px solid #e8ebf3",
            borderRadius: 13,
            background: "#fbfcff",
            padding: 14
          }}
        >
          <span
            style={{
              display: "block",
              color: "#98a2b3",
              fontSize: 8,
              fontWeight: 900,
              letterSpacing: ".08em",
              textTransform: "uppercase"
            }}
          >
            Selected Metric
          </span>

          <strong
            style={{
              display: "block",
              marginTop: 7,
              color: "#27324a",
              fontSize: 22
            }}
          >
            {formatMetric(selectedTotal, metric)}
          </strong>

          <span
            style={{
              display: "block",
              marginTop: 7,
              color: "#98a2b3",
              fontSize: 9,
              lineHeight: 1.5
            }}
          >
            {rows.reduce((sum, row) => sum + row.videos, 0)} videos
            represented in {rows.length} publish-time buckets.
          </span>
        </div>

        <div
          style={{
            minWidth: 0,
            overflowX: "auto"
          }}
        >
          {points.length === 0 ? (
            <div
              style={{
                minHeight: 220,
                display: "grid",
                placeItems: "center",
                border: "1px dashed #e0e4ee",
                borderRadius: 13,
                color: "#98a2b3",
                fontSize: 10
              }}
            >
              No demo videos were published in this range.
            </div>
          ) : (
            <svg
              viewBox={`0 0 ${width} ${height}`}
              style={{
                minWidth: 620,
                width: "100%",
                height: 240,
                display: "block"
              }}
              role="img"
              aria-label={`${metric} content performance trend`}
            >
              <line
                x1={left}
                x2={width - right}
                y1={height - bottom}
                y2={height - bottom}
                stroke="#e8ebf3"
                strokeWidth="1"
              />

              <polyline
                fill="none"
                stroke="#e23b3b"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points
                  .map((item) => `${item.x},${item.y}`)
                  .join(" ")}
              />

              {points.map((item) => (
                <g key={item.key}>
                  <circle
                    cx={item.x}
                    cy={item.y}
                    r="5"
                    fill="#fff"
                    stroke="#e23b3b"
                    strokeWidth="3"
                  />
                  <text
                    x={item.x}
                    y={height - 15}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#8a92a8"
                  >
                    {item.label}
                  </text>
                </g>
              ))}
            </svg>
          )}
        </div>
      </div>
    </section>
  );
}
