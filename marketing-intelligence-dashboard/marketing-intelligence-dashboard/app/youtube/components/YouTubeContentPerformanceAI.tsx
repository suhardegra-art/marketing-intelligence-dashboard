"use client";

import { useMemo, useState } from "react";
import {
  type YouTubePreviewContent,
  youtubeEngagementRate
} from "../youtubePreviewData";

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
  const [result, setResult] = useState<StoredAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summary = useMemo(() => {
    const views = rows.reduce((sum, row) => sum + row.views, 0);
    const likes = rows.reduce((sum, row) => sum + row.likes, 0);
    const comments = rows.reduce((sum, row) => sum + row.comments, 0);
    const shares = rows.reduce((sum, row) => sum + row.shares, 0);
    const interactions = likes + comments + shares;
    const avgViewed = rows.length
      ? rows.reduce((sum, row) => sum + row.avgViewed, 0) / rows.length
      : 0;

    return {
      views,
      likes,
      comments,
      shares,
      interactions,
      engagementRate: views ? (interactions / views) * 100 : 0,
      avgViewed
    };
  }, [rows]);

  async function generate() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "YouTube",
          account: `${channelName}${handle ? ` ${handle}` : ""}`,
          period: {
            label: `${fromDate} – ${toDate}`,
            from: fromDate,
            to: toDate
          },
          language: "Bahasa Indonesia",
          data: {
            source: live ? "YouTube Data API + YouTube Analytics API" : "preview data",
            period_summary: {
              content_count: rows.length,
              views: summary.views,
              likes: summary.likes,
              comments: summary.comments,
              shares: summary.shares,
              interactions: summary.interactions,
              engagement_rate_percent: Number(summary.engagementRate.toFixed(2)),
              average_percentage_viewed: Number(summary.avgViewed.toFixed(1))
            },
            top_content: [...rows]
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
                engagement_rate_percent: Number(youtubeEngagementRate(row).toFixed(2)),
                average_view_duration: row.avgViewDuration,
                average_percentage_viewed: row.avgViewed
              }))
          }
        })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Unable to generate AI analysis.");
      setResult(payload as StoredAnalysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate AI analysis.");
    } finally {
      setLoading(false);
    }
  }

  const ranked = [...rows].sort((a, b) => b.views - a.views);
  const top = ranked[0];
  const strongest = [...rows].sort(
    (a, b) => youtubeEngagementRate(b) - youtubeEngagementRate(a)
  )[0];

  return (
    <section className="yt-card yt-content-ai-card yt-wide-card">
      <div className="yt-content-ai-head">
        <div>
          <span>GEMINI AI</span>
          <h2>AI Content Performance Analysis</h2>
          <p>Evidence-based analysis of the selected YouTube content period.</p>
        </div>
        <div className="yt-ai-action-wrap">
          <div className="yt-ai-period">{fromDate} – {toDate}</div>
          <button
            type="button"
            className="yt-ai-refresh-button"
            onClick={generate}
            disabled={loading || rows.length === 0}
          >
            {loading ? "Analyzing..." : result ? "↻ Refresh Analysis" : "✦ Generate AI Analysis"}
          </button>
        </div>
      </div>

      <div className="yt-content-ai-kpis">
        <div><span>CONTENTS</span><strong>{rows.length}</strong></div>
        <div><span>VIEWS</span><strong>{formatCompact(summary.views)}</strong></div>
        <div><span>ENGAGEMENT</span><strong>{summary.engagementRate.toFixed(2)}%</strong></div>
        <div><span>AVG. VIEWED</span><strong>{summary.avgViewed.toFixed(1)}%</strong></div>
      </div>

      {error ? <div className="yt-ai-error">{error}</div> : null}

      {result ? (
        <>
          <div className="yt-ai-executive">
            <span>EXECUTIVE SUMMARY</span>
            <p>{result.analysis.executive_summary}</p>
          </div>

          <div className="yt-ai-two-col">
            <article className="working">
              <h3>What&apos;s Working</h3>
              <ul>{result.analysis.whats_working.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
            <article className="attention">
              <h3>Needs Attention</h3>
              <ul>{result.analysis.needs_attention.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          </div>

          <div className="yt-ai-actions">
            <h3>Recommended Actions</h3>
            <ol>{result.analysis.recommended_actions.map((item) => <li key={item}>{item}</li>)}</ol>
          </div>

          <div className="yt-ai-footnote">
            {result.analysis.confidence_note} • {result.model}
          </div>
        </>
      ) : (
        <>
          <div className="yt-ai-executive">
            <span>EXECUTIVE SUMMARY</span>
            <p>
              {live
                ? `Live YouTube data is ready for AI analysis. ${rows.length} content rows are available in the selected period.`
                : "Preview mode. Connect YouTube OAuth to analyze actual channel performance."}
              {top ? ` Top reach: “${top.title}” (${formatCompact(top.views)} views).` : ""}
              {strongest ? ` Strongest engagement: “${strongest.title}” (${youtubeEngagementRate(strongest).toFixed(2)}%).` : ""}
            </p>
          </div>

          <div className="yt-ai-two-col">
            <article className="working">
              <h3>What&apos;s Working</h3>
              <ul>
                <li>Connect live data, then use Gemini to identify statistically supported winning content patterns.</li>
                <li>Views, interactions, average view duration and average percentage viewed are passed to the AI analysis.</li>
              </ul>
            </article>
            <article className="attention">
              <h3>Needs Attention</h3>
              <ul>
                <li>AI recommendations are generated only when requested; the dashboard does not invent missing metrics.</li>
                <li>YouTube Studio realtime and some audience-only Studio features are not exposed by the public APIs.</li>
              </ul>
            </article>
          </div>
        </>
      )}
    </section>
  );
}
