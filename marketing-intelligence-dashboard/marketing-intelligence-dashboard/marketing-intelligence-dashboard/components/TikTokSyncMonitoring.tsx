import { getTikTokSyncMonitoring } from "@/lib/tiktok-sync-monitoring";

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta"
  }).format(new Date(value));
}

export default async function TikTokSyncMonitoring() {
  const data = await getTikTokSyncMonitoring();

  const statusLabel =
    data.status === "healthy"
      ? "🟢 Healthy"
      : data.status === "warning"
        ? "🟡 Warning"
        : "🔴 Failed";

  return (
    <section className="panel" style={{ marginBottom: 16 }}>
      <div className="panel-header">
        <div>
          <h3>TikTok Sync Monitoring</h3>
          <p>Automatic sync health monitoring</p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,minmax(0,1fr))",
          gap: 12
        }}
      >
        <div className="kpi-card">
          <p>Status</p>
          <strong>{statusLabel}</strong>
        </div>

        <div className="kpi-card">
          <p>Last Sync</p>
          <strong>{formatDate(data.lastSync)}</strong>
        </div>

        <div className="kpi-card">
          <p>New Videos</p>
          <strong>+{data.newVideos}</strong>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <strong style={{ fontSize: 12 }}>Recent Sync History</strong>

        {data.history.map((item, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 0",
              borderBottom: "1px solid #eef0f6",
              fontSize: 11
            }}
          >
            <span>
              ✓ {item.type}
              <br />
              {formatDate(item.date)}
            </span>

            <span>
              {item.status}
              <br />
              {item.records} records
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}