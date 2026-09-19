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
import {
  type YouTubePreviewContent,
  youtubeEngagementRate
} from "../youtubePreviewData";

type Metric = "views" | "likes" | "comments" | "shares" | "er";
type RangeKey = "7D" | "1M" | "3M" | "6M" | "1Y";

const metricLabels: Record<Metric, string> = {
  views: "Views",
  likes: "Likes",
  comments: "Comments",
  shares: "Shares",
  er: "ER"
};

const rangeDays: Record<RangeKey, number> = {
  "7D": 7,
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365
};

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function formatAxisDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short"
  }).format(new Date(`${value}T00:00:00Z`));
}

export default function YouTubeContentTrend({
  rows
}: {
  rows: YouTubePreviewContent[];
}) {
  const [metric, setMetric] = useState<Metric>("views");
  const [range, setRange] = useState<RangeKey>("7D");

  const data = useMemo(() => {
    if (rows.length === 0) return [];

    const latest = [...rows]
      .map((row) => row.publishedAt.slice(0, 10))
      .sort()
      .at(-1)!;

    const latestDate = new Date(`${latest}T00:00:00Z`);
    const startDate = new Date(latestDate);
    startDate.setUTCDate(startDate.getUTCDate() - (rangeDays[range] - 1));
    const start = startDate.toISOString().slice(0, 10);

    const byDate = new Map<string, {
      date: string;
      views: number;
      likes: number;
      comments: number;
      shares: number;
      erWeighted: number;
      videos: number;
    }>();

    rows
      .filter((row) => row.publishedAt.slice(0, 10) >= start)
      .forEach((row) => {
        const date = row.publishedAt.slice(0, 10);
        const current = byDate.get(date) ?? {
          date,
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          erWeighted: 0,
          videos: 0
        };

        current.views += row.views;
        current.likes += row.likes;
        current.comments += row.comments;
        current.shares += row.shares;
        current.erWeighted += youtubeEngagementRate(row) * row.views;
        current.videos += 1;
        byDate.set(date, current);
      });

    return [...byDate.values()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((row) => ({
        ...row,
        er: row.views ? row.erWeighted / row.views : 0
      }));
  }, [rows, range]);

  const total = data.reduce((sum, row) => {
    if (metric === "er") return sum + row.er;
    return sum + row[metric];
  }, 0);

  const totalVideos = data.reduce((sum, row) => sum + row.videos, 0);

  return (
    <section className="yt-card yt-content-trend-card yt-wide-card">
      <div className="yt-content-trend-top">
        <div>
          <h2>YouTube Content Performance Trend</h2>
          <p>Current performance of videos grouped by publish date.</p>
        </div>

        <div className="yt-range-switcher" aria-label="Trend period">
          {(Object.keys(rangeDays) as RangeKey[]).map((key) => (
            <button
              type="button"
              key={key}
              className={range === key ? "active" : ""}
              onClick={() => setRange(key)}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      <div className="yt-content-trend-toolbar">
        <div className="yt-metric-tabs">
          {(Object.keys(metricLabels) as Metric[]).map((key) => (
            <button
              type="button"
              key={key}
              className={metric === key ? "active" : ""}
              onClick={() => setMetric(key)}
            >
              {metricLabels[key]}
            </button>
          ))}
        </div>

        <div className="yt-trend-total">
          <span>{totalVideos} videos</span>
          <strong>
            {metric === "er"
              ? `${(data.length ? total / data.length : 0).toFixed(2)}%`
              : formatCompact(total)}
          </strong>
          <em>{metricLabels[metric]}</em>
        </div>
      </div>

      <div className="yt-recharts-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 16, right: 16, bottom: 0, left: 0 }}
          >
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e7ebf3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatAxisDate}
              tick={{ fill: "#7f8aa2", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(value) => metric === "er" ? `${value}%` : formatCompact(value)}
              tick={{ fill: "#7f8aa2", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip
              labelFormatter={(label) => formatAxisDate(String(label))}
              formatter={(value: number | string) => {
                const numeric = Number(value);
                return [metric === "er" ? `${numeric.toFixed(2)}%` : formatCompact(numeric), metricLabels[metric]];
              }}
              contentStyle={{
                border: "1px solid #dfe5ef",
                borderRadius: 12,
                boxShadow: "0 12px 30px rgba(31,45,83,.12)"
              }}
            />
            <Line
              type="monotone"
              dataKey={metric}
              stroke="#4f6df5"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
