import React from "react";

export default function TikTokSyncMonitoring() {
  return (
    <section className="panel" style={{ marginBottom: 16 }}>
      <div className="panel-header">
        <div>
          <h3>TikTok Sync Monitoring</h3>
          <p>Automatic sync health monitoring</p>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 12
      }}>
        <div className="kpi-card">
          <p>Status</p>
          <strong>Waiting for sync log</strong>
        </div>

        <div className="kpi-card">
          <p>Last Sync</p>
          <strong>—</strong>
        </div>

        <div className="kpi-card">
          <p>New Videos</p>
          <strong>—</strong>
        </div>
      </div>
    </section>
  );
}
