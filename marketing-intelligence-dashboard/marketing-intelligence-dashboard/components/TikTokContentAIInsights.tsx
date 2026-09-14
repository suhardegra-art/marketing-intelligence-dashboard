"use client";

import {
  useState
} from "react";

import TikTokContentPerformanceTrend, {
  type TikTokContentRangeDays
} from "@/components/TikTokContentPerformanceTrend";
import TikTokAIAnalysis from "@/components/TikTokAIAnalysis";

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

type Props = {
  accountName: string;
  username: string | null;
  snapshotDate: string | null;
  followers: number;
  accountLikes: number;
  content: ContentItem[];
  growthData: GrowthData;
};

export default function TikTokContentAIInsights({
  accountName,
  username,
  snapshotDate,
  followers,
  accountLikes,
  content,
  growthData
}: Props) {
  const [rangeDays, setRangeDays] =
    useState<TikTokContentRangeDays>(7);

  return (
    <>
      <TikTokContentPerformanceTrend
        content={content}
        anchorDate={snapshotDate}
        rangeDays={rangeDays}
        onRangeChange={setRangeDays}
      />

      <TikTokAIAnalysis
        accountName={accountName}
        username={username}
        snapshotDate={snapshotDate}
        followers={followers}
        accountLikes={accountLikes}
        content={content}
        growthData={growthData}
        rangeDays={rangeDays}
      />
    </>
  );
}
