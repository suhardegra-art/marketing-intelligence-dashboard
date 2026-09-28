type Props = {
  totalWatchTime: number;
  averageWatchTime: number;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export default function TikTokLiveWatchTime({
  totalWatchTime,
  averageWatchTime,
}: Props) {
  return (
    <section className="panel" style={{ marginTop: 16 }}>
      <div className="panel-header">
        <div>
          <h3>Watch Time Overview</h3>
          <p>Audience retention performance</p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,minmax(0,1fr))",
          gap: 16,
          marginTop: 16,
        }}
      >
        <div className="kpi-card">
          <p>Total Watch Time</p>
          <strong>
            {formatNumber(totalWatchTime)}
          </strong>
          <small>
            seconds
          </small>
        </div>

        <div className="kpi-card">
          <p>Average Watch Time</p>
          <strong>
            {formatNumber(averageWatchTime)}
          </strong>
          <small>
            seconds / viewer
          </small>
        </div>
      </div>
    </section>
  );
}