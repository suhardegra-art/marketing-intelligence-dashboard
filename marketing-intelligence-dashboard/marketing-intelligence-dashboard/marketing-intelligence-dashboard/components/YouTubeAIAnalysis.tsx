"use client";

import { useMemo, useState } from "react";
import type {
  YouTubeChannelSnapshot,
  YouTubeVideo
} from "@/lib/youtube-demo-data";
import type { YouTubeContentRangeDays } from "@/components/YouTubeContentPerformanceTrend";

type Analysis = {
  executive_summary: string;
  whats_working: string[];
  needs_attention: string[];
  recommended_actions: string[];
  confidence_note: string;
};

type StoredAnalysis = {
  analysis: Analysis;
  model: string;
  generatedAt: string;
};

type Props = {
  channelName: string;
  handle: string;
  snapshotDate: string;
  subscribers: number;
  content: YouTubeVideo[];
  snapshots: YouTubeChannelSnapshot[];
  rangeDays: YouTubeContentRangeDays;
};

const RANGE_LABELS: Record<YouTubeContentRangeDays, string> = {
  7: "7D",
  30: "1M",
  90: "3M",
  180: "6M",
  365: "1Y"
};

function parseDate(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00Z`);
}

function rangeStart(anchorDate: string, days: number) {
  const date = parseDate(anchorDate);
  date.setUTCDate(date.getUTCDate() - (days - 1));
  return date.toISOString().slice(0, 10);
}

function contentEr(item: YouTubeVideo) {
  if (!item.views) return 0;

  return (
    ((item.likes + item.comments + item.shares) /
      item.views) *
    100
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export default function YouTubeAIAnalysis({
  channelName,
  handle,
  snapshotDate,
  subscribers,
  content,
  snapshots,
  rangeDays
}: Props) {
  const [result, setResult] =
    useState<StoredAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] =
    useState<string | null>(null);

  const payloadData = useMemo(() => {
    const from = rangeStart(snapshotDate, rangeDays);

    const selected = content.filter((item) => {
      const date = item.publishedAt.slice(0, 10);
      return date >= from && date <= snapshotDate;
    });

    const views = selected.reduce(
      (sum, item) => sum + item.views,
      0
    );
    const likes = selected.reduce(
      (sum, item) => sum + item.likes,
      0
    );
    const comments = selected.reduce(
      (sum, item) => sum + item.comments,
      0
    );
    const shares = selected.reduce(
      (sum, item) => sum + item.shares,
      0
    );
    const interactions = likes + comments + shares;

    const selectedSnapshots = snapshots.filter(
      (item) => item.date >= from && item.date <= snapshotDate
    );

    const firstSnapshot = selectedSnapshots[0];
    const latestSnapshot = selectedSnapshots.at(-1);

    return {
      from,
      to: snapshotDate,
      data: {
        demo_data: true,
        channel: {
          channel_name: channelName,
          handle,
          current_subscribers: subscribers
        },
        period_summary: {
          videos_published: selected.length,
          views,
          likes,
          comments,
          shares,
          interactions,
          engagement_rate_percent: views
            ? Number(((interactions / views) * 100).toFixed(2))
            : 0,
          average_views_per_video: selected.length
            ? Math.round(views / selected.length)
            : 0
        },
        subscriber_growth_context:
          firstSnapshot && latestSnapshot
            ? {
                first_snapshot: firstSnapshot,
                latest_snapshot: latestSnapshot,
                net_change:
                  latestSnapshot.subscribers -
                  firstSnapshot.subscribers
              }
            : null,
        top_videos: [...selected]
          .sort((a, b) => b.views - a.views)
          .slice(0, 5)
          .map((item) => ({
            title: item.title,
            published_at: item.publishedAt,
            views: item.views,
            likes: item.likes,
            comments: item.comments,
            shares: item.shares,
            engagement_rate_percent: Number(
              contentEr(item).toFixed(2)
            )
          })),
        content: selected.map((item) => ({
          title: item.title,
          published_at: item.publishedAt,
          views: item.views,
          likes: item.likes,
          comments: item.comments,
          shares: item.shares,
          engagement_rate_percent: Number(
            contentEr(item).toFixed(2)
          )
        }))
      }
    };
  }, [
    channelName,
    handle,
    snapshotDate,
    subscribers,
    content,
    snapshots,
    rangeDays
  ]);

  async function generate() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          platform: "YouTube",
          account: `${channelName} ${handle}`,
          period: {
            label: RANGE_LABELS[rangeDays],
            from: payloadData.from,
            to: payloadData.to
          },
          data: payloadData.data,
          language: "Bahasa Indonesia"
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error || "Unable to generate AI analysis."
        );
      }

      setResult(payload as StoredAnalysis);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to generate AI analysis."
      );
    } finally {
      setLoading(false);
    }
  }

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
          <h3>AI Performance Analysis</h3>
          <p>
            Gemini analysis based on YouTube views, likes, comments,
            shares and engagement • Period:{" "}
            <strong>{RANGE_LABELS[rangeDays]}</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={generate}
          disabled={loading}
          style={{
            minHeight: 36,
            border: 0,
            borderRadius: 9,
            background: "#4059d7",
            color: "#fff",
            padding: "0 14px",
            fontSize: 10,
            fontWeight: 900,
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.65 : 1
          }}
        >
          {loading
            ? "Analyzing..."
            : result
              ? "Refresh Analysis"
              : "Generate Analysis"}
        </button>
      </div>

      <div
        style={{
          marginBottom: 12,
          border: "1px solid #fedf89",
          background: "#fffaeb",
          borderRadius: 10,
          padding: "9px 11px",
          color: "#b54708",
          fontSize: 9,
          lineHeight: 1.5
        }}
      >
        Prototype mode: AI is analyzing demo YouTube data. Live
        channel analytics will replace these values after OAuth and
        YouTube API integration.
      </div>

      {error ? (
        <div
          style={{
            border: "1px solid #ffd4d4",
            background: "#fff7f7",
            borderRadius: 10,
            padding: 11,
            color: "#b42318",
            fontSize: 10
          }}
        >
          {error}
        </div>
      ) : null}

      {!result && !loading && !error ? (
        <div
          style={{
            minHeight: 150,
            border: "1px dashed #dfe4ef",
            borderRadius: 13,
            display: "grid",
            placeItems: "center",
            textAlign: "center",
            padding: 20,
            color: "#8b93a7",
            fontSize: 10,
            lineHeight: 1.6
          }}
        >
          Generate an AI analysis after reviewing the selected
          Content Performance Trend period.
        </div>
      ) : null}

      {result ? (
        <div style={{ display: "grid", gap: 12 }}>
          <article
            style={{
              border: "1px solid #e8ebf3",
              borderRadius: 13,
              padding: 14,
              background: "#fbfcff"
            }}
          >
            <strong
              style={{
                display: "block",
                marginBottom: 6,
                color: "#27324a",
                fontSize: 11
              }}
            >
              Executive Summary
            </strong>
            <p
              style={{
                margin: 0,
                color: "#59617a",
                fontSize: 10,
                lineHeight: 1.65
              }}
            >
              {result.analysis.executive_summary}
            </p>
          </article>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3,minmax(0,1fr))",
              gap: 12
            }}
          >
            {[
              ["What's Working", result.analysis.whats_working],
              ["Needs Attention", result.analysis.needs_attention],
              [
                "Recommended Actions",
                result.analysis.recommended_actions
              ]
            ].map(([title, items]) => (
              <article
                key={String(title)}
                style={{
                  border: "1px solid #e8ebf3",
                  borderRadius: 13,
                  padding: 14,
                  background: "#fff"
                }}
              >
                <strong
                  style={{
                    display: "block",
                    marginBottom: 8,
                    color: "#27324a",
                    fontSize: 10
                  }}
                >
                  {String(title)}
                </strong>

                <div style={{ display: "grid", gap: 7 }}>
                  {(items as string[]).map((item, index) => (
                    <div
                      key={`${title}-${index}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "18px 1fr",
                        gap: 7,
                        alignItems: "start",
                        color: "#59617a",
                        fontSize: 9,
                        lineHeight: 1.55
                      }}
                    >
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 999,
                          display: "grid",
                          placeItems: "center",
                          background: "#eef1ff",
                          color: "#5368e8",
                          fontSize: 8,
                          fontWeight: 900
                        }}
                      >
                        {index + 1}
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              color: "#98a2b3",
              fontSize: 8
            }}
          >
            <span>{result.analysis.confidence_note}</span>
            <span>
              {result.model} • {formatDateTime(result.generatedAt)}
            </span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
