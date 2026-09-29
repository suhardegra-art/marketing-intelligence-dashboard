"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type YouTubePreviewContent,
  youtubeEngagementRate
} from "../youtubePreviewData";
import {
  getRowsForYouTubeContentRange,
  type RangeKey,
  YOUTUBE_CONTENT_RANGE_EVENT
} from "./YouTubeContentTrend";

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

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

export default function YouTubeContentPerformanceAI({
  rows,
  channelName,
  handle,
  fromDate,
  toDate,
  live
}: {
  rows: YouTubePreviewContent[];
  channelName: string;
  handle: string | null;
  fromDate: string;
  toDate: string;
  live: boolean;
}) {
  const [range, setRange] = useState<RangeKey>("7D");
  const [result, setResult] = useState<StoredAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleRangeChange(event: Event) {
      const customEvent = event as CustomEvent<{
        range?: RangeKey;
      }>;

      if (customEvent.detail?.range) {
        setRange(customEvent.detail.range);
        // Do not show an analysis generated for another range.
        setResult(null);
        setError(null);
      }
    }

    window.addEventListener(
      YOUTUBE_CONTENT_RANGE_EVENT,
      handleRangeChange
    );

    return () => {
      window.removeEventListener(
        YOUTUBE_CONTENT_RANGE_EVENT,
        handleRangeChange
      );
    };
  }, []);

  const rangeResult = useMemo(
    () => getRowsForYouTubeContentRange(rows, range),
    [rows, range]
  );

  const analysisRows = rangeResult.rows;

  const summary = useMemo(() => {
    const views = analysisRows.reduce(
      (sum, row) => sum + row.views,
      0
    );
    const likes = analysisRows.reduce(
      (sum, row) => sum + row.likes,
      0
    );
    const comments = analysisRows.reduce(
      (sum, row) => sum + row.comments,
      0
    );
    const shares = analysisRows.reduce(
      (sum, row) => sum + row.shares,
      0
    );
    const interactions = likes + comments + shares;

    const avgViewed = analysisRows.length
      ? analysisRows.reduce(
          (sum, row) => sum + row.avgViewed,
          0
        ) / analysisRows.length
      : 0;

    return {
      views,
      likes,
      comments,
      shares,
      interactions,
      engagementRate: views
        ? (interactions / views) * 100
        : 0,
      avgViewed
    };
  }, [analysisRows]);

  const effectiveFrom =
    rangeResult.fromDate || fromDate;
  const effectiveTo =
    rangeResult.toDate || toDate;

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
          account: `${channelName}${
            handle ? ` ${handle}` : ""
          }`,
          period: {
            label: range,
            from: effectiveFrom,
            to: effectiveTo
          },
          language: "Bahasa Indonesia",
          data: {
            source: live
              ? "YouTube Data API + YouTube Analytics API"
              : "preview data",
            content_range: range,
            period_summary: {
              content_count: analysisRows.length,
              views: summary.views,
              likes: summary.likes,
              comments: summary.comments,
              shares: summary.shares,
              interactions: summary.interactions,
              engagement_rate_percent: Number(
                summary.engagementRate.toFixed(2)
              ),
              average_percentage_viewed: Number(
                summary.avgViewed.toFixed(1)
              )
            },
            top_content: [...analysisRows]
              .sort((a, b) => b.views - a.views)
              .slice(0, 10)
              .map((row) => ({
                title: row.title,
                published_at: row.publishedAt,
                content_type: row.contentType,
                views: row.views,
                likes: row.likes,
                comments: row.comments,
                shares: row.shares,
                engagement_rate_percent: Number(
                  youtubeEngagementRate(row).toFixed(2)
                ),
                average_view_duration:
                  row.avgViewDuration,
                average_percentage_viewed:
                  row.avgViewed
              }))
          }
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            "Unable to generate AI analysis."
        );
      }

      setResult(payload as StoredAnalysis);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate AI analysis."
      );
    } finally {
      setLoading(false);
    }
  }

  const ranked = [...analysisRows].sort(
    (a, b) => b.views - a.views
  );

  const top = ranked[0];

  const strongest = [...analysisRows].sort(
    (a, b) =>
      youtubeEngagementRate(b) -
      youtubeEngagementRate(a)
  )[0];

  return (
    <section className="yt-card yt-content-ai-card yt-wide-card">
      <div className="yt-content-ai-head">
        <div>
          <span>GEMINI AI</span>
          <h2>AI Content Performance Analysis</h2>
          <p>
            Evidence-based analysis of the selected YouTube content
            trend period.
          </p>
        </div>

        <div className="yt-ai-action-wrap">
          <div className="yt-ai-period">
            Period: {range}
          </div>

          <button
            type="button"
            className="yt-ai-refresh-button"
            onClick={generate}
            disabled={
              loading || analysisRows.length === 0
            }
          >
            {loading
              ? "Analyzing..."
              : result
                ? "↻ Refresh Analysis"
                : "✦ Generate AI Analysis"}
          </button>
        </div>
      </div>

      <div className="yt-content-ai-kpis">
        <div>
          <span>CONTENTS</span>
          <strong>{analysisRows.length}</strong>
        </div>

        <div>
          <span>VIEWS</span>
          <strong>
            {formatCompact(summary.views)}
          </strong>
        </div>

        <div>
          <span>ENGAGEMENT</span>
          <strong>
            {summary.engagementRate.toFixed(2)}%
          </strong>
        </div>

        <div>
          <span>AVG. VIEWED</span>
          <strong>
            {summary.avgViewed.toFixed(1)}%
          </strong>
        </div>
      </div>

      {error ? (
        <div className="yt-ai-error">{error}</div>
      ) : null}

      {result ? (
        <>
          <div className="yt-ai-executive">
            <span>EXECUTIVE SUMMARY</span>
            <p>{result.analysis.executive_summary}</p>
          </div>

          <div className="yt-ai-two-col">
            <article className="working">
              <h3>What&apos;s Working</h3>
              <ul>
                {result.analysis.whats_working.map(
                  (item) => (
                    <li key={item}>{item}</li>
                  )
                )}
              </ul>
            </article>

            <article className="attention">
              <h3>Needs Attention</h3>
              <ul>
                {result.analysis.needs_attention.map(
                  (item) => (
                    <li key={item}>{item}</li>
                  )
                )}
              </ul>
            </article>
          </div>

          <div className="yt-ai-actions">
            <h3>Recommended Actions</h3>
            <ol>
              {result.analysis.recommended_actions.map(
                (item) => (
                  <li key={item}>{item}</li>
                )
              )}
            </ol>
          </div>

          <div className="yt-ai-footnote">
            Period: {range} ({effectiveFrom} – {effectiveTo}) •{" "}
            {result.analysis.confidence_note} •{" "}
            {result.model}
          </div>
        </>
      ) : (
        <>
          <div className="yt-ai-executive">
            <span>EXECUTIVE SUMMARY</span>
            <p>
              {live
                ? `Live YouTube data is ready for AI analysis. ${analysisRows.length} content rows are available in the ${range} Content Performance Trend period.`
                : "Preview mode. Connect YouTube OAuth to analyze actual channel performance."}

              {top
                ? ` Top reach: “${top.title}” (${formatCompact(
                    top.views
                  )} views).`
                : ""}

              {strongest
                ? ` Strongest engagement: “${
                    strongest.title
                  }” (${youtubeEngagementRate(
                    strongest
                  ).toFixed(2)}%).`
                : ""}
            </p>
          </div>

          <div className="yt-ai-two-col">
            <article className="working">
              <h3>What&apos;s Working</h3>
              <ul>
                <li>
                  The AI analysis uses the same {range} content rows
                  currently shown by YouTube Content Performance
                  Trend.
                </li>
                <li>
                  Views, interactions, average view duration and
                  average percentage viewed are sent to Gemini.
                </li>
              </ul>
            </article>

            <article className="attention">
              <h3>Needs Attention</h3>
              <ul>
                <li>
                  Changing 7D / 1M / 3M / 6M / 1Y clears the old AI
                  result so analysis from another period is not shown
                  accidentally.
                </li>
                <li>
                  Generate the analysis again after changing the trend
                  range.
                </li>
              </ul>
            </article>
          </div>
        </>
      )}
    </section>
  );
}
