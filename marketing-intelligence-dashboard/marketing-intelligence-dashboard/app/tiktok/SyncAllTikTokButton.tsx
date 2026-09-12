"use client";

import { useState } from "react";

type Props = {
  currentLoaded: number;
  expectedTotal: number;
};

type SyncResponse = {
  syncedThisPage: number;
  totalSynced: number;
  storedCount: number | null;
  hasMore: boolean;
  nextCursor: number | null;
  error?: string;
};

export default function SyncAllTikTokButton({
  currentLoaded,
  expectedTotal
}: Props) {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(currentLoaded);
  const [message, setMessage] = useState(
    currentLoaded >= expectedTotal && expectedTotal > 0
      ? "All currently reported public videos are stored."
      : `${currentLoaded} of ${expectedTotal || "?"} videos stored.`
  );
  const [error, setError] = useState("");

  async function syncAll() {
    if (syncing) return;

    setSyncing(true);
    setError("");
    setMessage("Starting TikTok full sync...");

    let cursor: number | null = null;
    let totalSynced = 0;
    let page = 0;

    try {
      while (page < 100) {
        const response = await fetch("/api/tiktok/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            cursor,
            totalSynced
          })
        });

        const result = (await response.json()) as SyncResponse;

        if (!response.ok) {
          throw new Error(result.error || `Sync failed with HTTP ${response.status}.`);
        }

        totalSynced = result.totalSynced;
        page += 1;

        if (typeof result.storedCount === "number") {
          setProgress(result.storedCount);
          setMessage(
            `Stored ${result.storedCount} of ${expectedTotal || "?"} videos • page ${page}`
          );
        } else {
          setMessage(`Synced ${totalSynced} videos in this run • page ${page}`);
        }

        if (!result.hasMore) {
          setMessage(
            `Sync complete. ${result.storedCount ?? totalSynced} videos are stored.`
          );

          window.setTimeout(() => {
            window.location.reload();
          }, 900);

          return;
        }

        if (typeof result.nextCursor !== "number") {
          throw new Error("TikTok returned has_more without a next cursor.");
        }

        cursor = result.nextCursor;

        // Small pause keeps the long multi-page sync gentle on both APIs.
        await new Promise((resolve) => window.setTimeout(resolve, 200));
      }

      throw new Error("Sync stopped after 100 pages as a safety limit.");
    } catch (syncError) {
      setError(
        syncError instanceof Error
          ? syncError.message
          : "Unknown TikTok sync error."
      );
      setMessage("Full sync stopped before completion.");
    } finally {
      setSyncing(false);
    }
  }

  const denominator = expectedTotal > 0 ? expectedTotal : Math.max(progress, 1);
  const percent = Math.min(100, Math.round((progress / denominator) * 100));

  return (
    <section
      className="panel"
      style={{
        marginBottom: 16,
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 18,
        alignItems: "center"
      }}
    >
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            marginBottom: 8
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 14 }}>Sync All TikTok Videos</h3>
            <p
              style={{
                margin: "5px 0 0",
                color: "#8a92a8",
                fontSize: 10
              }}
            >
              {message}
            </p>
          </div>
          <strong style={{ fontSize: 12 }}>
            {progress}/{expectedTotal || "?"}
          </strong>
        </div>

        <div
          style={{
            height: 8,
            borderRadius: 999,
            background: "#eef0f6",
            overflow: "hidden"
          }}
        >
          <div
            style={{
              width: `${percent}%`,
              height: "100%",
              borderRadius: "inherit",
              background: "linear-gradient(90deg,#4059d7,#7259dc)",
              transition: "width .25s ease"
            }}
          />
        </div>

        {error ? (
          <p
            style={{
              margin: "8px 0 0",
              color: "#d64651",
              fontSize: 10,
              lineHeight: 1.5
            }}
          >
            {error}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={syncAll}
        disabled={syncing}
        style={{
          border: 0,
          borderRadius: 10,
          minHeight: 42,
          padding: "0 18px",
          background: syncing ? "#aab0c3" : "#111827",
          color: "#fff",
          fontWeight: 800,
          fontSize: 12,
          cursor: syncing ? "wait" : "pointer"
        }}
      >
        {syncing ? "Syncing..." : "Sync All Videos"}
      </button>
    </section>
  );
}
