"use client";

import {
  useEffect,
  useRef,
  useState
} from "react";

type SyncStatus = {
  status?:
    | "healthy"
    | "warning"
    | "failed"
    | "never";
  lastSync?: string | null;
  lastSyncType?: string | null;
  recordsLastSync?: number;
  error?: string;
};

function formatSyncTime(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return "Not synced yet";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone:
        "Asia/Jakarta"
    }
  ).format(
    new Date(value)
  );
}

export default function YouTubeConnectionActions({
  connected
}: {
  connected: boolean;
}) {
  const [syncing, setSyncing] =
    useState(false);

  const [status, setStatus] =
    useState<SyncStatus | null>(
      null
    );

  const [error, setError] =
    useState("");

  const knownLastSync =
    useRef<
      string | null | undefined
    >(undefined);

  useEffect(() => {
    if (!connected) {
      return;
    }

    let cancelled = false;

    async function loadStatus(
      allowAutoReload: boolean
    ) {
      try {
        const response =
          await fetch(
            "/api/youtube/sync/status",
            {
              cache:
                "no-store"
            }
          );

        const payload =
          (await response.json()) as SyncStatus;

        if (
          !response.ok ||
          cancelled
        ) {
          return;
        }

        const previous =
          knownLastSync.current;

        knownLastSync.current =
          payload.lastSync;

        setStatus(
          payload
        );

        /*
          If the page stays open while the 08:00 WIB cron finishes,
          reload automatically after status polling notices a newer sync.
        */
        if (
          allowAutoReload &&
          previous &&
          payload.lastSync &&
          previous !==
            payload.lastSync
        ) {
          window.location.reload();
        }
      } catch {
        // Sync status is supplemental; do not break the YouTube page.
      }
    }

    loadStatus(false);

    const timer =
      window.setInterval(
        () =>
          loadStatus(true),
        60_000
      );

    return () => {
      cancelled = true;
      window.clearInterval(
        timer
      );
    };
  }, [connected]);

  if (!connected) {
    return (
      <a
        className="yt-connect-button"
        href="/api/youtube/auth/start"
      >
        Connect YouTube API
      </a>
    );
  }

  async function syncNow() {
    if (syncing) {
      return;
    }

    setSyncing(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/youtube/sync",
          {
            method: "POST"
          }
        );

      const payload =
        await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            `YouTube sync failed with HTTP ${response.status}.`
        );
      }

      setStatus({
        status:
          "healthy",
        lastSync:
          payload.syncedAt ||
          new Date().toISOString(),
        lastSyncType:
          "Manual Sync",
        recordsLastSync:
          payload.metricsSaved ??
          0
      });

      window.setTimeout(
        () => {
          window.location.reload();
        },
        700
      );
    } catch (syncError) {
      setError(
        syncError instanceof Error
          ? syncError.message
          : "Unable to sync YouTube."
      );
    } finally {
      setSyncing(false);
    }
  }

  const syncStatus =
    status?.status ===
    "healthy"
      ? "●"
      : status?.status ===
          "warning"
        ? "●"
        : status?.status ===
            "failed"
          ? "●"
          : "○";

  const statusColor =
    status?.status ===
    "healthy"
      ? "#22a976"
      : status?.status ===
          "warning"
        ? "#d7952a"
        : status?.status ===
            "failed"
          ? "#e45763"
          : "#9aa2b7";

  return (
    <div
      style={{
        display: "flex",
        alignItems:
          "center",
        gap: 8,
        flexWrap:
          "wrap",
        justifyContent:
          "flex-end"
      }}
    >
      <div
        style={{
          border:
            "1px solid #e5e9f2",
          background:
            "#fff",
          borderRadius: 9,
          padding:
            "6px 9px",
          lineHeight: 1.25
        }}
        title={
          error ||
          "Automatic YouTube resync runs every day at 08:00 WIB."
        }
      >
        <div
          style={{
            color:
              "#7a839d",
            fontSize: 8,
            fontWeight: 800,
            letterSpacing:
              ".06em"
          }}
        >
          <span
            style={{
              color:
                statusColor
            }}
          >
            {syncStatus}
          </span>{" "}
          AUTO 08:00 WIB
        </div>

        <div
          style={{
            marginTop: 2,
            color:
              error
                ? "#d64651"
                : "#344054",
            fontSize: 9,
            fontWeight: 700,
            maxWidth: 170,
            whiteSpace:
              "nowrap",
            overflow:
              "hidden",
            textOverflow:
              "ellipsis"
          }}
        >
          {error ||
            `Last: ${formatSyncTime(
              status?.lastSync
            )}`}
        </div>
      </div>

      <button
        type="button"
        className="yt-refresh-api-button"
        onClick={
          syncNow
        }
        disabled={
          syncing
        }
        style={{
          opacity:
            syncing
              ? 0.65
              : 1,
          cursor:
            syncing
              ? "wait"
              : "pointer"
        }}
      >
        {syncing
          ? "Syncing..."
          : "↻ Sync Now"}
      </button>

      <form
        action="/api/youtube/disconnect"
        method="post"
      >
        <button
          type="submit"
          className="yt-disconnect-button"
        >
          Disconnect
        </button>
      </form>
    </div>
  );
}
