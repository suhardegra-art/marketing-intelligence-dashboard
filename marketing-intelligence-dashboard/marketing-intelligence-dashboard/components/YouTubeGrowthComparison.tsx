"use client";

import { useMemo, useState } from "react";
import type { YouTubeChannelSnapshot } from "@/lib/youtube-demo-data";

export type YouTubeGrowthRangeDays = 7 | 30 | 90 | 180 | 365;

type Props = {
  snapshots: YouTubeChannelSnapshot[];
  anchorDate: string;
};

const RANGE_OPTIONS: Array<{
  label: string;
  days: YouTubeGrowthRangeDays;
}> = [
  { label: "7D", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 }
];

function parseDate(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00Z`);
}

function rangeStart(anchorDate: string, days: number) {
  const date = parseDate(anchorDate);
  date.setUTCDate(date.getUTCDate() - (days - 1));
  return date.toISOString().slice(0, 10);
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short"
  }).format(parseDate(value));
}

function MiniTrend({
  title,
  values,
  formatter
}: {
  title: string;
  values: Array<{ date: string; value: number }>;
  formatter: (value: number) => string;
}) {
  const width = 720;
  const height = 180;
  const left = 14;
  const right = 14;
  const top = 18;
  const bottom = 30;

  if (values.length === 0) {
    return (
      <div
        style={{
          border: "1px solid #e8ebf3",
          borderRadius: 14,
          padding: 14,
          background: "#fff",
          minHeight: 220,
          display: "grid",
          placeItems: "center",
          color: "#98a2b3",
          fontSize: 10
        }}
      >
        No historical snapshots in this range.
      </div>
    );
  }

  const min = Math.min(...values.map((item) => item.value));
  const max = Math.max(...values.map((item) => item.value));
  const range = Math.max(max - min, 1);

  const points = values.map((item, index) => {
    const x =
      values.length <= 1
        ? width / 2
        : left +
          (index / (values.length - 1)) *
            (width - left - right);

    const y =
      top +
      (1 - (item.value - min) / range) *
        (height - top - bottom);

    return { ...item, x, y };
  });

  const first = values[0]?.value ?? 0;
  const latest = values.at(-1)?.value ?? 0;
  const delta = latest - first;

  return (
    <div
      style={{
        border: "1px solid #e8ebf3",
        borderRadius: 14,
        padding: 14,
        background: "#fff"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
          marginBottom: 8
        }}
      >
        <div>
          <strong
            style={{
              display: "block",
              fontSize: 11,
              color: "#344054"
            }}
          >
            {title}
          </strong>
          <span
            style={{
              display: "block",
              marginTop: 3,
              color: "#98a2b3",
              fontSize: 9
            }}
          >
            {values.length} historical snapshots
          </span>
        </div>

        <div style={{ textAlign: "right" }}>
          <strong
            style={{
              display: "block",
              color: delta >= 0 ? "#067647" : "#b42318",
              fontSize: 12
            }}
          >
            {delta >= 0 ? "+" : ""}
            {formatter(delta)}
          </strong>
          <span
            style={{
              color: "#98a2b3",
              fontSize: 8
            }}
          >
            change in range
          </span>
        </div>
      </div>

      {values.length < 2 ? (
        <div
          style={{
            minHeight: 140,
            display: "grid",
            placeItems: "center",
            color: "#98a2b3",
            fontSize: 10
          }}
        >
          More daily snapshots are needed for this range.
        </div>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{
              display: "block",
              width: "100%",
              height: 180,
              overflow: "visible"
            }}
            role="img"
            aria-label={`${title} historical trend`}
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
              stroke="#5368e8"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points
                .map((item) => `${item.x},${item.y}`)
                .join(" ")}
            />

            {points.map((item) => (
              <circle
                key={item.date}
                cx={item.x}
                cy={item.y}
                r="4.5"
                fill="#fff"
                stroke="#5368e8"
                strokeWidth="3"
              />
            ))}
          </svg>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              color: "#98a2b3",
              fontSize: 8
            }}
          >
            <span>{formatDate(values[0].date)}</span>
            <span>{formatDate(values.at(-1)!.date)}</span>
          </div>
        </>
      )}
    </div>
  );
}

export default function YouTubeGrowthComparison({
  snapshots,
  anchorDate
}: Props) {
  const [rangeDays, setRangeDays] =
    useState<YouTubeGrowthRangeDays>(7);

  const filtered = useMemo(() => {
    const from = rangeStart(anchorDate, rangeDays);

    return snapshots.filter(
      (item) =>
        item.date >= from &&
        item.date <= anchorDate
    );
  }, [snapshots, anchorDate, rangeDays]);

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
        style={{ alignItems: "flex-start" }}
      >
        <div>
          <h3>YouTube Growth</h3>
          <p>
            Historical subscriber and channel-view snapshots
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap"
          }}
        >
          {RANGE_OPTIONS.map((option) => {
            const active = option.days === rangeDays;

            return (
              <button
                key={option.days}
                type="button"
                onClick={() => setRangeDays(option.days)}
                style={{
                  minHeight: 32,
                  borderRadius: 8,
                  border: active
                    ? "1px solid #5368e8"
                    : "1px solid #e4e7ef",
                  background: active ? "#eef1ff" : "#fff",
                  color: active ? "#4059d7" : "#7a839d",
                  padding: "0 11px",
                  fontSize: 10,
                  fontWeight: 800,
                  cursor: "pointer"
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
          display: "grid",
          gridTemplateColumns: "repeat(2,minmax(0,1fr))",
          gap: 12
        }}
      >
        <MiniTrend
          title="Subscribers"
          values={filtered.map((item) => ({
            date: item.date,
            value: item.subscribers
          }))}
          formatter={(value) =>
            new Intl.NumberFormat("en-US").format(value)
          }
        />

        <MiniTrend
          title="Total Channel Views"
          values={filtered.map((item) => ({
            date: item.date,
            value: item.totalViews
          }))}
          formatter={formatCompact}
        />
      </div>
    </section>
  );
}
