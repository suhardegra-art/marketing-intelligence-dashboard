"use client";

type Props = {
  subscribers: number;
  totalVideos: number;
  videosInPeriod: number;
  views: number;
  averageViewsPerVideo: number;
  likes: number;
  comments: number;
  shares: number;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

export default function YouTubePeriodSummary({
  subscribers,
  totalVideos,
  videosInPeriod,
  views,
  averageViewsPerVideo,
  likes,
  comments,
  shares
}: Props) {
  const cards = [
    ["Subscribers (Current)", formatNumber(subscribers)],
    ["Videos (Current)", formatNumber(totalVideos)],
    ["Videos in Period", formatNumber(videosInPeriod)],
    ["Videos Stored", formatNumber(totalVideos)],
    ["Views in Period", formatCompact(views)],
    ["Avg. Views / Video", formatCompact(averageViewsPerVideo)],
    ["Likes in Period", formatCompact(likes)],
    ["Comments + Shares", formatCompact(comments + shares)]
  ];

  return (
    <section className="yt-period-summary-grid">
      {cards.map(([label, value]) => (
        <article className="yt-period-summary-card" key={label}>
          <p>{label}</p>
          <strong>{value}</strong>
        </article>
      ))}
    </section>
  );
}
