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

type RangeDays = 7 | 30 | 90 | 180 | 365;

type GrowthPoint = {
  date: string;
  subscribers: number;
  views: number;
  watchMinutes: number;
  engagements: number;
};

type ChartPoint = {
  date: string;
  label: string;
  value: number;
};

type Card = {
  key: string;
  title: string;
  value: number;
  valueType: "number" | "percentage" | "hours";
  chart: ChartPoint[];
};

const RANGE_OPTIONS: Array<{ days: RangeDays; label: string }> = [
  { days: 7, label: "7D" },
  { days: 30, label: "1M" },
  { days: 90, label: "3M" },
  { days: 180, label: "6M" },
  { days: 365, label: "1Y" }
];

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short"
  });
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function buildPreviewHistory(): GrowthPoint[] {
  const start = new Date("2025-09-20T00:00:00Z");
  const rows: GrowthPoint[] = [];
  let subscribers = 905;
  let views = 1250000;
  let watchMinutes = 118000;
  let engagements = 33800;

  for (let index = 0; index < 365; index += 1) {
    const current = new Date(start);
    current.setUTCDate(start.getUTCDate() + index);
    const season = Math.sin(index / 14) * 0.22 + Math.cos(index / 33) * 0.18;
    const eventBoost = index > 345 && index < 355 ? 1.8 : 1;
    const dailyViews = Math.max(350, Math.round((1450 + (index % 9) * 95) * (1 + season) * eventBoost));
    const dailySubscribers = Math.max(0, Math.round(dailyViews / 1650 + ((index + 2) % 4 === 0 ? 1 : 0)));
    const dailyWatch = Math.round(dailyViews * (0.205 + (index % 5) * 0.008));
    const dailyEngagement = Math.round(dailyViews * (0.048 + (index % 7) * 0.0015));

    subscribers += dailySubscribers;
    views += dailyViews;
    watchMinutes += dailyWatch;
    engagements += dailyEngagement;

    rows.push({
      date: current.toISOString().slice(0, 10),
      subscribers,
      views,
      watchMinutes,
      engagements
    });
  }

  return rows;
}

const PREVIEW_HISTORY = buildPreviewHistory();

function buildLiveHistory(daily: YouTubeDailyPoint[], currentSubscribers: number): GrowthPoint[] {
  if (daily.length === 0) return [];

  const netSubscriberChange = daily.reduce(
    (sum, row) => sum + row.subscribersGained - row.subscribersLost,
    0
  );

  let subscribers = Math.max(0, currentSubscribers - netSubscriberChange);
  let views = 0;
  let watchMinutes = 0;
  let engagements = 0;

  return daily.map((row) => {
    subscribers += row.subscribersGained - row.subscribersLost;
    views += row.views;
    watchMinutes += row.watchMinutes;
    engagements += row.likes + row.comments + row.shares;

    return {
      date: row.date,
      subscribers,
      views,
      watchMinutes,
      engagements
    };
  });
}

function filterSeries(history: GrowthPoint[], endDate: string, days: number) {
  const fromDate = addDays(endDate, -(days - 1));
  return history.filter((point) => point.date >= fromDate && point.date <= endDate);
}

function delta(series: GrowthPoint[], key: keyof Omit<GrowthPoint, "date">) {
  if (series.length < 2) return 0;
  return series[series.length - 1][key] - series[0][key];
}

function normaliseSeries(
  series: GrowthPoint[],
  key: keyof Omit<GrowthPoint, "date">,
  transform?: (value: number, first: number) => number
): ChartPoint[] {
  if (series.length === 0) return [];
  const first = series[0][key];

  return series.map((point) => ({
    date: point.date,
    label: formatDate(point.date),
    value: transform ? transform(point[key], first) : point[key] - first
  }));
}

function MiniGrowthChart({ data, valueType }: { data: ChartPoint[]; valueType: Card["valueType"] }) {
  return (
    <div className="yt-growth-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f7" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#8b93a7" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis hide />
          <Tooltip
            formatter={(raw: number | string) => {
              const numeric = Number(raw || 0);
              if (valueType === "percentage") return [`${numeric.toFixed(1)}%`, ""];
              if (valueType === "hours") return [`${numeric.toFixed(1)} hrs`, ""];
              return [formatCompact(numeric), ""];
            }}
            labelFormatter={(label) => String(label)}
            contentStyle={{ borderRadius: 10, border: "1px solid #e3e7ef", fontSize: 11 }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#5368e8"
            strokeWidth={2.8}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive
            animationDuration={650}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function YouTubeGrowthComparison({
  daily,
  currentSubscribers = 0,
  live = false
}: {
  daily?: YouTubeDailyPoint[];
  currentSubscribers?: number;
  live?: boolean;
}) {
  const [rangeDays, setRangeDays] = useState<RangeDays>(7);

  const history = useMemo(
    () => (live && daily ? buildLiveHistory(daily, currentSubscribers) : PREVIEW_HISTORY),
    [live, daily, currentSubscribers]
  );

  const endDate = history.at(-1)?.date || new Date().toISOString().slice(0, 10);

  const cards = useMemo<Card[]>(() => {
    const series = filterSeries(history, endDate, rangeDays);
    const subscriberDelta = delta(series, "subscribers");
    const subscriberGrowth =
      series.length >= 2 && series[0].subscribers > 0
        ? (subscriberDelta / series[0].subscribers) * 100
        : 0;

    return [
      {
        key: "subscriberGrowth",
        title: "Subscriber Growth",
        value: subscriberGrowth,
        valueType: "percentage",
        chart: normaliseSeries(series, "subscribers", (value, first) =>
          first > 0 ? ((value - first) / first) * 100 : 0
        )
      },
      {
        key: "views",
        title: "Views",
        value: Math.max(0, delta(series, "views")),
        valueType: "number",
        chart: normaliseSeries(series, "views")
      },
      {
        key: "watchTime",
        title: "Watch Time",
        value: Math.max(0, delta(series, "watchMinutes")) / 60,
        valueType: "hours",
        chart: normaliseSeries(series, "watchMinutes", (value, first) => (value - first) / 60)
      },
      {
        key: "engagements",
        title: "Engagements",
        value: Math.max(0, delta(series, "engagements")),
        valueType: "number",
        chart: normaliseSeries(series, "engagements")
      },
      {
        key: "newSubscribers",
        title: "New Subscribers",
        value: Math.max(0, subscriberDelta),
        valueType: "number",
        chart: normaliseSeries(series, "subscribers")
      }
    ];
  }, [history, rangeDays, endDate]);

  const rangeFrom = addDays(endDate, -(rangeDays - 1));

  return (
    <section className="yt-card yt-growth-section yt-wide-card">
      <div className="yt-growth-head">
        <div>
          <h2>YouTube Growth</h2>
          <p>
            {live
              ? "Historical YouTube performance from the YouTube Analytics API."
              : "Preview growth data. Connect YouTube to load live analytics."}
          </p>
          <span>{formatDate(rangeFrom)} – {formatDate(endDate)}</span>
        </div>

        <div className="yt-growth-range">
          {RANGE_OPTIONS.map((option) => (
            <button
              type="button"
              key={option.days}
              className={rangeDays === option.days ? "active" : ""}
              onClick={() => setRangeDays(option.days)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="yt-growth-grid">
        {cards.map((card) => (
          <article key={card.key} className="yt-growth-card">
            <p>{card.title}</p>
            <strong>
              {card.valueType === "percentage"
                ? `${card.value >= 0 ? "+" : ""}${card.value.toFixed(1)}%`
                : card.valueType === "hours"
                  ? `${card.value >= 0 ? "+" : ""}${card.value.toFixed(1)}h`
                  : `${card.value >= 0 ? "+" : ""}${formatCompact(card.value)}`}
            </strong>
            <MiniGrowthChart data={card.chart} valueType={card.valueType} />
          </article>
        ))}
      </div>
    </section>
  );
}
