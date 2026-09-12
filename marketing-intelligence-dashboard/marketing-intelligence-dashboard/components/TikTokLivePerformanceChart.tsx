"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

type Session = {
  live_date: string;
  views: number;
  peak_viewers: number;
};

export default function TikTokLivePerformanceChart({
  data
}: {
  data: Session[];
}) {
  return (
    <section className="panel">
      <h3>Views & Peak Viewers Trend</h3>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="live_date" />

            <YAxis />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="views"
              stroke="#2563eb"
              name="Views"
            />

            <Line
              type="monotone"
              dataKey="peak_viewers"
              stroke="#ec4899"
              name="Peak Viewers"
            />

          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}