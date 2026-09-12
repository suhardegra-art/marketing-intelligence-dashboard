type Props = {
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export default function TikTokLiveEngagementChart({
  likes,
  comments,
  shares,
  engagementRate,
}: Props) {
  const total = likes + comments + shares || 1;

  const items = [
    { label: "Likes", value: likes },
    { label: "Comments", value: comments },
    { label: "Shares", value: shares },
  ];

  return (
    <section className="panel" style={{ marginTop: 16 }}>
      <div className="panel-header">
        <div>
          <h3>Engagement Overview</h3>
          <p>Live interaction performance breakdown</p>
        </div>

        <strong style={{ color: "#16a34a", fontSize: 18 }}>
          {engagementRate.toFixed(2)}%
        </strong>
      </div>

      {items.map((item) => (
        <div key={item.label} style={{ marginBottom: 14 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              marginBottom: 6,
            }}
          >
            <span>{item.label}</span>
            <strong>{formatNumber(item.value)}</strong>
          </div>

          <div
            style={{
              height: 10,
              background: "#eef0f6",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.max((item.value / total) * 100, 3)}%`,
                height: "100%",
                background: "linear-gradient(90deg,#4059d7,#8b5cf6)",
                borderRadius: 999,
              }}
            />
          </div>
        </div>
      ))}
    </section>
  );
}
