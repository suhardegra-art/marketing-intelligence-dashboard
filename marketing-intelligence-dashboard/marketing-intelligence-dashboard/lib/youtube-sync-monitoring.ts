export type YouTubeSyncMonitoring = {
  status:
    | "healthy"
    | "warning"
    | "failed"
    | "never";
  lastSync: string | null;
  lastSyncType: string | null;
  recordsLastSync: number;
  history: Array<{
    date: string;
    type: string;
    status: string;
    records: number;
    error: string | null;
  }>;
};

function getConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    return null;
  }

  return { url, key };
}

async function getData(path: string) {
  const config = getConfig();

  if (!config) {
    throw new Error(
      "Supabase is not configured."
    );
  }

  const response = await fetch(
    `${config.url}${path}`,
    {
      headers: {
        apikey: config.key
      },
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(
      await response.text()
    );
  }

  return response.json();
}

function labelType(value: string) {
  if (
    value ===
    "youtube_daily_cron"
  ) {
    return "Automatic 08:00 WIB";
  }

  if (
    value ===
    "youtube_manual_sync"
  ) {
    return "Manual Sync";
  }

  return value;
}

export async function getYouTubeSyncMonitoring(): Promise<YouTubeSyncMonitoring> {
  try {
    const accounts =
      (await getData(
        "/rest/v1/social_accounts?platform=eq.youtube&select=id&order=updated_at.desc&limit=1"
      )) as Array<{
        id: string;
      }>;

    const accountId =
      accounts[0]?.id;

    if (!accountId) {
      return {
        status: "never",
        lastSync: null,
        lastSyncType: null,
        recordsLastSync: 0,
        history: []
      };
    }

    const rows =
      (await getData(
        `/rest/v1/social_sync_log?account_id=eq.${encodeURIComponent(
          accountId
        )}&sync_type=in.(youtube_daily_cron,youtube_manual_sync)&select=finished_at,sync_type,status,records_received,error_message&order=finished_at.desc&limit=5`
      )) as Array<{
        finished_at: string;
        sync_type: string;
        status: string;
        records_received:
          | number
          | null;
        error_message:
          | string
          | null;
      }>;

    const latest =
      rows[0];

    if (!latest) {
      return {
        status: "never",
        lastSync: null,
        lastSyncType: null,
        recordsLastSync: 0,
        history: []
      };
    }

    const ageHours =
      latest.finished_at
        ? (Date.now() -
            new Date(
              latest.finished_at
            ).getTime()) /
          3600000
        : Infinity;

    let status:
      | "healthy"
      | "warning"
      | "failed" =
      "failed";

    if (
      latest.status ===
      "success"
    ) {
      status =
        ageHours <= 36
          ? "healthy"
          : "warning";
    }

    return {
      status,
      lastSync:
        latest.finished_at,
      lastSyncType:
        labelType(
          latest.sync_type
        ),
      recordsLastSync:
        Number(
          latest.records_received ||
            0
        ),
      history:
        rows.map(
          (row) => ({
            date:
              row.finished_at,
            type:
              labelType(
                row.sync_type
              ),
            status:
              row.status,
            records:
              Number(
                row.records_received ||
                  0
              ),
            error:
              row.error_message ||
              null
          })
        )
    };
  } catch (error) {
    console.error(
      "YouTube sync monitoring error",
      error
    );

    return {
      status: "failed",
      lastSync: null,
      lastSyncType: null,
      recordsLastSync: 0,
      history: []
    };
  }
}
