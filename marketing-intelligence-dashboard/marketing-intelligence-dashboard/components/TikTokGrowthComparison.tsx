"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import type {
  GrowthPoint,
  TikTokGrowthData
} from "@/lib/tiktok-growth";

type Props = {
  data: TikTokGrowthData | null;
};

type RangeDays = 7 | 30 | 90 | 180 | 365;

type Card = {
  key: string;
  title: string;
  value: number;
  valueType: "number" | "percentage";
  chart: Array<{
    date: string;
    label: string;
    value: number;
  }>;
};

const RANGE_OPTIONS: Array<{
  days: RangeDays;
  label: string;
}> = [
  { days: 7, label: "7D" },
  { days: 30, label: "1M" },
  { days: 90, label: "3M" },
  { days: 180, label: "6M" },
  { days: 365, label: "1Y" }
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Math.round(value)
  );
}

function formatCompact(value: number) {
  const absolute = Math.abs(value);

  if (absolute >= 1000000) {
    return `${(value / 1000000)
      .toFixed(1)
      .replace(".0", "")}M`;
  }

  if (absolute >= 1000) {
    return `${(value / 1000)
      .toFixed(1)
      .replace(".0", "")}K`;
  }

  return formatNumber(value);
}

function formatDate(date: string) {
  if (!date) return "-";

  return new Date(`${date}T00:00:00Z`).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short"
    }
  );
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function filterSeries(
  series: GrowthPoint[],
  endDate: string,
  days: number
) {
  if (!endDate) return [];

  const fromDate = addDays(endDate, -(days - 1));

  return series.filter(
    (point) =>
      point.date >= fromDate &&
      point.date <= endDate
  );
}

function seriesDelta(series: GrowthPoint[]) {
  if (series.length < 2) return 0;

  return (
    series[series.length - 1].value -
    series[0].value
  );
}

function normaliseDeltaSeries(series: GrowthPoint[]) {
  if (series.length === 0) return [];

  const baseline = series[0].value;

  return series.map((point) => ({
    date: point.date,
    label: formatDate(point.date),
    value: point.value - baseline
  }));
}

function normalisePercentSeries(series: GrowthPoint[]) {
  if (series.length === 0) return [];

  const baseline = series[0].value;

  return series.map((point) => ({
    date: point.date,
    label: formatDate(point.date),
    value:
      baseline > 0
        ? ((point.value - baseline) / baseline) * 100
        : 0
  }));
}

function MetricChart({
  data,
  valueType
}: {
  data: Card["chart"];
  valueType: Card["valueType"];
}) {
  if (data.length === 0) {
    return (
      <div
        style={{
          height: 125,
          marginTop: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#98a2b3",
          fontSize: 11,
          borderTop: "1px dashed #edf0f7"
        }}
      >
        Historical data not available yet
      </div>
    );
  }

  return (
    <div
      style={{
        height: 125,
        marginTop: 12
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 4,
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
            tick={{
              fontSize: 9,
              fill: "#8b93a7"
            }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />

          <YAxis hide />

          <Tooltip
            formatter={(value: number | string) => {
              const numeric = Number(value || 0);

              return [
                valueType === "percentage"
                  ? `${numeric.toFixed(1)}%`
                  : formatCompact(numeric),
                ""
              ];
            }}
            labelFormatter={(label) => String(label)}
          />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#5368e8"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function TikTokGrowthComparison({
  data
}: Props) {
  const [rangeDays, setRangeDays] =
    useState<RangeDays>(7);

  const cards = useMemo<Card[]>(() => {
    if (!data) return [];

    const followerMetric = data.metrics.find(
      (item) => item.key === "followers"
    );
    const viewsMetric = data.metrics.find(
      (item) => item.key === "views"
    );
    const likesMetric = data.metrics.find(
      (item) => item.key === "likes"
    );
    const commentsSharesMetric = data.metrics.find(
      (item) => item.key === "commentsShares"
    );

    const followerSeries = filterSeries(
      followerMetric?.currentSeries || [],
      data.currentTo,
      rangeDays
    );

    const viewsSeries = filterSeries(
      viewsMetric?.currentSeries || [],
      data.currentTo,
      rangeDays
    );

    const likesSeries = filterSeries(
      likesMetric?.currentSeries || [],
      data.currentTo,
      rangeDays
    );

    const commentsSharesSeries = filterSeries(
      commentsSharesMetric?.currentSeries || [],
      data.currentTo,
      rangeDays
    );

    const followerDelta = seriesDelta(followerSeries);

    const followerGrowth =
      followerSeries.length >= 2 &&
      followerSeries[0].value > 0
        ? (followerDelta / followerSeries[0].value) * 100
        : 0;

    return [
      {
        key: "followerGrowth",
        title: "Follower Growth",
        value: followerGrowth,
        valueType: "percentage",
        chart: normalisePercentSeries(followerSeries)
      },
      {
        key: "views",
        title: "Views",
        value: Math.max(0, seriesDelta(viewsSeries)),
        valueType: "number",
        chart: normaliseDeltaSeries(viewsSeries)
      },
      {
        key: "likes",
        title: "Likes",
        value: Math.max(0, seriesDelta(likesSeries)),
        valueType: "number",
        chart: normaliseDeltaSeries(likesSeries)
      },
      {
        key: "commentsShares",
        title: "Comments & Shares",
        value: Math.max(
          0,
          seriesDelta(commentsSharesSeries)
        ),
        valueType: "number",
        chart: normaliseDeltaSeries(commentsSharesSeries)
      },
      {
        key: "newFollowers",
        title: "New Followers",
        value: Math.max(0, followerDelta),
        valueType: "number",
        chart: normaliseDeltaSeries(followerSeries)
      }
    ];
  }, [data, rangeDays]);

  const rangeFrom = data?.currentTo
    ? addDays(data.currentTo, -(rangeDays - 1))
    : "";

  return (
    <section
      className="panel"
      style={{
        marginTop: 16,
        marginBottom: 16,
        padding: 16
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
          gap: 16,
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
            TikTok Growth
          </h3>

          <p
            style={{
              margin: "4px 0 0",
              color: "#8b93a7",
              fontSize: 12
            }}
          >
            Historical TikTok performance based on available daily API snapshots.
          </p>

          {rangeFrom && data?.currentTo ? (
            <div
              style={{
                marginTop: 5,
                color: "#98a2b3",
                fontSize: 10
              }}
            >
              {formatDate(rangeFrom)} – {formatDate(data.currentTo)}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: 4,
            background: "#f7f8fc",
            border: "1px solid #e5e7ef",
            borderRadius: 10
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
                  setRangeDays(option.days)
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

      {!data ? (
        <div
          style={{
            padding: "28px 12px",
            textAlign: "center",
            color: "#98a2b3",
            fontSize: 12
          }}
        >
          TikTok historical data is not available yet.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(5,minmax(0,1fr))",
            gap: 12
          }}
        >
          {cards.map((card) => (
            <div
              key={card.key}
              style={{
                background: "#fff",
                border: "1px solid #edf0f7",
                borderRadius: 14,
                padding: 14,
                minWidth: 0
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#344054"
                }}
              >
                {card.title}
              </div>

              <div
                style={{
                  marginTop: 8
                }}
              >
                <strong
                  style={{
                    fontSize: 24,
                    color: "#17213d"
                  }}
                >
                  {card.valueType === "percentage"
                    ? `${card.value >= 0 ? "+" : ""}${card.value.toFixed(1)}%`
                    : `${card.value >= 0 ? "+" : ""}${formatCompact(card.value)}`}
                </strong>
              </div>

              <MetricChart
                data={card.chart}
                valueType={card.valueType}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
