type Session = {
  live_date: string;
  duration_minutes: number;
  views: number;
  peak_viewers: number;
  likes: number;
  comments: number;
  shares: number;
  watch_time: number;
  average_watch_time: number;
  engagement_rate: number;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

export default function TikTokLiveSessionsTable({
  data,
}: {
  data: Session[];
}) {
  return (
    <section className="panel" style={{ marginTop: 16 }}>
      <div className="panel-header">
        <div>
          <h3>Live Sessions Performance</h3>
          <p>
            Detailed TikTok Live performance history
          </p>
        </div>

        <button
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
          }}
        >
          Export CSV
        </button>
      </div>

      <div
        style={{
          overflowX: "auto",
          marginTop: 16,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              {[
                "Date",
                "Duration",
                "Views",
                "Peak Viewer",
                "Likes",
                "Comments",
                "Shares",
                "Watch Time",
                "ER",
              ].map((header) => (
                <th
                  key={header}
                  style={{
                    textAlign: "left",
                    padding: "12px",
                    fontSize: 12,
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                <td>{item.live_date}</td>

                <td>
                  {item.duration_minutes} min
                </td>

                <td>
                  {formatNumber(item.views)}
                </td>

                <td>
                  {formatNumber(item.peak_viewers)}
                </td>

                <td>
                  {formatNumber(item.likes)}
                </td>

                <td>
                  {formatNumber(item.comments)}
                </td>

                <td>
                  {formatNumber(item.shares)}
                </td>

                <td>
                  {formatNumber(item.watch_time)}
                </td>

                <td>
                  {Number(
                    item.engagement_rate || 0
                  ).toFixed(2)}
                  %
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}