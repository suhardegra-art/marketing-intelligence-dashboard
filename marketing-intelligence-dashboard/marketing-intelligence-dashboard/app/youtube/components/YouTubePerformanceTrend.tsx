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
import type { YouTubeDailyPoint } from "@/lib/youtube-dashboard";

type Metric = "views" | "watchTime" | "subscribers";

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
  }).format(new Date(`${value}T00:00:00Z`));
}

export default function YouTubePerformanceTrend({
  data
}: {
  data: YouTubeDailyPoint[];
}) {
  const [metric, setMetric] = useState<Metric>("views");

  const chartData = useMemo(
    () =>
      data.map((row) => ({
        date: row.date,
        label: formatDate(row.date),
        views: row.views,
        watchTime: row.watchMinutes / 60,
        subscribers: row.subscribersGained - row.subscribersLost
      })),
    [data]
  );

  const labels: Record<Metric, string> = {
    views: "Views",
    watchTime: "Watch time",
    subscribers: "Subscribers"
  };

  return (
    <article className="yt-card yt-trend-card">
      <div className="yt-card-head">
        <div>
          <h2>Performance Trend</h2>
          <p>Daily channel performance for the selected period</p>
        </div>
        <div className="yt-segmented">
          {(Object.keys(labels) as Metric[]).map((key) => (
            <button
              type="button"
              key={key}
              className={metric === key ? "active" : ""}
              onClick={() => setMetric(key)}
            >
              {labels[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="yt-live-performance-chart">
        {chartData.length === 0 ? (
          <div className="yt-api-empty">No finalized YouTube Analytics data is available for this period yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 16, right: 18, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e7ebf3" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#7f8aa2", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(value) =>
                  metric === "watchTime" ? `${Number(value).toFixed(0)}h` : formatCompact(Number(value))
                }
                tick={{ fill: "#7f8aa2", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip
                formatter={(raw: number | string) => {
                  const value = Number(raw || 0);
                  return [
                    metric === "watchTime" ? `${value.toFixed(1)} hrs` : formatCompact(value),
                    labels[metric]
                  ];
                }}
                labelFormatter={(label) => String(label)}
                contentStyle={{
                  border: "1px solid #dfe5ef",
                  borderRadius: 12,
                  boxShadow: "0 12px 30px rgba(31,45,83,.12)"
                }}
              />
              <Line
                type="monotone"
                dataKey={metric}
                stroke="#1677ff"
                strokeWidth={3.2}
                dot={false}
                activeDot={{ r: 5 }}
                isAnimationActive
                animationDuration={650}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </article>
  );
}
