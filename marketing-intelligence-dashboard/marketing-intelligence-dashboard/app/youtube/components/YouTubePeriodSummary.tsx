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
  return new Intl.NumberFormat("en-US").format(
    Math.round(value)
  );
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
    <section
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(4, minmax(0, 1fr))",
        gap: 14,
        marginBottom: 18
      }}
      className="yt-period-summary-grid"
    >
      {cards.map(([label, value]) => (
        <article
          key={label}
          style={{
            minHeight: 112,
            padding: "19px 22px",
            borderRadius: 16,
            border: "1px solid #e2e7f0",
            borderTop: "4px solid #6175f3",
            background: "#fff",
            boxShadow:
              "0 8px 20px rgba(36,48,86,.04)"
          }}
        >
          <p
            style={{
              margin: "0 0 13px",
              color: "#8490a7",
              fontSize: 13,
              fontWeight: 800
            }}
          >
            {label}
          </p>

          <strong
            style={{
              display: "block",
              color: "#15203b",
              fontSize: 29,
              lineHeight: 1,
              letterSpacing: "-.035em"
            }}
          >
            {value}
          </strong>
        </article>
      ))}

      <style jsx>{`
        @media (max-width: 1120px) {
          .yt-period-summary-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 640px) {
          .yt-period-summary-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
