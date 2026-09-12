export type TikTokSyncStatus = {
  status: "healthy" | "warning" | "failed";
  lastSync: string | null;
  syncType: string | null;
  newVideos: number;
};

export async function getTikTokSyncMonitoring(): Promise<TikTokSyncStatus> {
  // Data source will read from social_sync_log.
  // This helper is separated so future cron/manual sync reporting
  // can be expanded without changing dashboard components.

  return {
    status: "healthy",
    lastSync: null,
    syncType: null,
    newVideos: 0
  };
}
