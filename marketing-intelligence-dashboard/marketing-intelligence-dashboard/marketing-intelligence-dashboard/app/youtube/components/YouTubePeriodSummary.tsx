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
    <>
      <section className="yt-summary-grid">
        {cards.map(([label, value]) => (
          <article className="yt-summary-card" key={label}>
            <p>{label}</p>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <style jsx>{`
        .yt-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin: 16px 0;
        }

        .yt-summary-card {
          position: relative;
          overflow: hidden;
          min-width: 0;
          min-height: 88px;
          padding: 16px;
          background: #ffffff;
          border: 1px solid #e2e7ef;
          border-radius: 14px;
          box-shadow: 0 7px 18px rgba(39, 48, 92, 0.045);
        }

        .yt-summary-card::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 3px;
          background: #6577ea;
        }

        .yt-summary-card p {
          margin: 0 0 8px;
          color: #8a92a8;
          font-size: 10px;
          line-height: 1.35;
          font-weight: 700;
        }

        .yt-summary-card strong {
          display: block;
          color: #15203b;
          font-size: 22px;
          line-height: 1.08;
          letter-spacing: -0.04em;
          font-weight: 800;
        }

        @media (max-width: 1120px) {
          .yt-summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .yt-summary-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
