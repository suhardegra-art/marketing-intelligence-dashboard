export type TikTokSyncStatus = {
  status: "healthy" | "warning" | "failed";
  lastSync: string | null;
  syncType: string | null;
  newVideos: number;
  history: Array<{
    date: string;
    type: string;
    status: string;
    records: number;
  }>;
};

async function getData(path: string) {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) throw new Error("Supabase missing");

  const res = await fetch(`${url}${path}`, {
    headers: { apikey: key },
    cache: "no-store"
  });

  if (!res.ok) throw new Error(await res.text());

  return res.json();
}

function formatSyncType(type: string) {
  if (type.includes("full_video")) return "Automatic Full Video Sync";
  if (type.includes("oauth")) return "TikTok Initial Sync";
  return type;
}

export async function getTikTokSyncMonitoring(): Promise<TikTokSyncStatus> {
  const rows = await getData(
    "/rest/v1/social_sync_log?order=finished_at.desc&limit=10"
  );

  const latest = rows?.[0];

  const lastTime = latest?.finished_at
    ? new Date(latest.finished_at).getTime()
    : null;

  const ageHours = lastTime
    ? (Date.now() - lastTime) / 3600000
    : null;

  let status: TikTokSyncStatus["status"] = "failed";

  if (latest?.status === "success" && ageHours !== null) {
    if (ageHours < 48) status = "healthy";
    else if (ageHours < 168) status = "warning";
  }

  const current = Number(rows?.[0]?.records_received || 0);
  const previous = Number(rows?.[1]?.records_received || current);

  return {
    status,
    lastSync: latest?.finished_at || null,
    syncType: latest?.sync_type
      ? formatSyncType(latest.sync_type)
      : null,
    newVideos: Math.max(current - previous, 0),
    history: (rows || []).slice(0, 5).map((row: any) => ({
      date: row.finished_at,
      type: formatSyncType(row.sync_type),
      status: row.status,
      records: Number(row.records_received || 0)
    }))
  };
}