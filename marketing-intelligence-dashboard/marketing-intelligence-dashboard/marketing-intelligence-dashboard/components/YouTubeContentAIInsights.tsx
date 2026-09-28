"use client";

import { useState } from "react";
import type {
  YouTubeChannelSnapshot,
  YouTubeVideo
} from "@/lib/youtube-demo-data";
import YouTubeContentPerformanceTrend, {
  type YouTubeContentRangeDays
} from "@/components/YouTubeContentPerformanceTrend";
import YouTubeAIAnalysis from "@/components/YouTubeAIAnalysis";

type Props = {
  channelName: string;
  handle: string;
  snapshotDate: string;
  subscribers: number;
  content: YouTubeVideo[];
  snapshots: YouTubeChannelSnapshot[];
};

export default function YouTubeContentAIInsights({
  channelName,
  handle,
  snapshotDate,
  subscribers,
  content,
  snapshots
}: Props) {
  const [rangeDays, setRangeDays] =
    useState<YouTubeContentRangeDays>(7);

  return (
    <>
      <YouTubeContentPerformanceTrend
        content={content}
        anchorDate={snapshotDate}
        rangeDays={rangeDays}
        onRangeChange={setRangeDays}
      />

      <YouTubeAIAnalysis
        channelName={channelName}
        handle={handle}
        snapshotDate={snapshotDate}
        subscribers={subscribers}
        content={content}
        snapshots={snapshots}
        rangeDays={rangeDays}
      />
    </>
  );
}
