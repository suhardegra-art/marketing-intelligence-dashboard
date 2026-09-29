import {
  getYouTubeDashboardData,
  type YouTubeDashboardData
} from "@/lib/youtube-dashboard";

export type YouTubeSyncType =
  | "youtube_daily_cron"
  | "youtube_manual_sync";

function getConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return { url, secretKey };
}

async function supabaseFetch(path: string, init: RequestInit = {}) {
  const config = getConfig();
  const headers = new Headers(init.headers);

  headers.set("apikey", config.secretKey);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${config.url}${path}`, {
    ...init,
    headers,
    cache: "no-store"
  });
}

async function readError(response: Response) {
  const text = await response.text();
  return text || `HTTP ${response.status}`;
}

async function getYouTubeAccountId(channelId: string) {
  const response = await supabaseFetch(
    `/rest/v1/social_accounts?platform=eq.youtube&external_account_id=eq.${encodeURIComponent(
      channelId
    )}&select=id&limit=1`
  );

  if (!response.ok) {
    throw new Error(
      `Unable to read YouTube account: ${await readError(response)}`
    );
  }

  const rows = (await response.json()) as Array<{ id: string }>;
  const id = rows[0]?.id;

  if (!id) {
    throw new Error(
      "YouTube account was not created in Supabase after channel sync."
    );
  }

  return id;
}

async function saveDashboardSnapshot(
  accountId: string,
  data: YouTubeDashboardData,
  syncType: YouTubeSyncType
) {
  const metricDate = new Date().toISOString().slice(0, 10);

  const response = await supabaseFetch(
    "/rest/v1/social_account_metrics?on_conflict=account_id,metric_date",
    {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify({
        account_id: accountId,
        metric_date: metricDate,
        followers: data.channel.subscribers,
        following: 0,
        likes: data.overview.likes,
        posts_count: data.channel.totalVideos,
        extra_metrics: {
          source: syncType,
          synced_at: new Date().toISOString(),
          period: {
            from: data.fromDate,
            to: data.toDate
          },
          lifetime: {
            total_views: data.channel.totalViews,
            total_videos: data.channel.totalVideos
          },
          overview: data.overview,
          previous_overview: data.previousOverview,
          traffic_sources: data.trafficSources,
          content_types: data.contentTypes,
          ages: data.ages,
          genders: data.genders,
          devices: data.devices,
          geographies: data.geographies,
          subscribed_status: data.subscribedStatus
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(
      `Unable to save YouTube dashboard snapshot: ${await readError(
        response
      )}`
    );
  }
}

function normalizeContentType(value: string) {
  if (value === "Shorts") return "shorts";
  if (value === "Live") return "live";
  return "video";
}

async function saveContentSnapshot(
  accountId: string,
  data: YouTubeDashboardData,
  syncType: YouTubeSyncType
) {
  if (data.content.length === 0) {
    return { contentSaved: 0, metricsSaved: 0 };
  }

  const now = new Date().toISOString();

  const contentRows = data.content.map((item) => ({
    account_id: accountId,
    external_content_id: item.id,
    content_type: normalizeContentType(item.contentType),
    title: item.title,
    caption: null,
    published_at: item.publishedAt || null,
    permalink: item.permalink || null,
    thumbnail_url: null,
    duration_seconds: null,
    raw_metadata: {
      avg_view_duration: item.avgViewDuration,
      avg_viewed_percentage: item.avgViewed,
      source: "youtube_analytics_api"
    },
    updated_at: now
  }));

  const contentResponse = await supabaseFetch(
    "/rest/v1/social_content?on_conflict=account_id,external_content_id",
    {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify(contentRows)
    }
  );

  if (!contentResponse.ok) {
    throw new Error(
      `Unable to save YouTube content: ${await readError(contentResponse)}`
    );
  }

  const stored = (await contentResponse.json()) as Array<{
    id: string;
    external_content_id: string;
  }>;

  const idByVideo = new Map(
    stored.map((row) => [row.external_content_id, row.id])
  );

  const snapshotDate = new Date().toISOString().slice(0, 10);

  const metricRows = data.content
    .map((item) => {
      const contentId = idByVideo.get(item.id);
      if (!contentId) return null;

      return {
        content_id: contentId,
        snapshot_date: snapshotDate,
        views: item.views,
        likes: item.likes,
        comments: item.comments,
        shares: item.shares,
        interactions:
          item.likes + item.comments + item.shares,
        extra_metrics: {
          avg_view_duration: item.avgViewDuration,
          avg_viewed_percentage: item.avgViewed,
          source: syncType,
          period_from: data.fromDate,
          period_to: data.toDate
        }
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (metricRows.length === 0) {
    return {
      contentSaved: stored.length,
      metricsSaved: 0
    };
  }

  const metricsResponse = await supabaseFetch(
    "/rest/v1/social_content_metrics?on_conflict=content_id,snapshot_date",
    {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(metricRows)
    }
  );

  if (!metricsResponse.ok) {
    throw new Error(
      `Unable to save YouTube content metrics: ${await readError(
        metricsResponse
      )}`
    );
  }

  return {
    contentSaved: stored.length,
    metricsSaved: metricRows.length
  };
}

async function logSync(
  accountId: string,
  syncType: YouTubeSyncType,
  status: "success" | "failed",
  recordsReceived: number,
  errorMessage?: string
) {
  try {
    await supabaseFetch("/rest/v1/social_sync_log", {
      method: "POST",
      headers: {
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        account_id: accountId,
        sync_type: syncType,
        finished_at: new Date().toISOString(),
        status,
        records_received: recordsReceived,
        error_message: errorMessage || null
      })
    });
  } catch (error) {
    console.error("Unable to write YouTube sync log", error);
  }
}

export async function runYouTubeSync(
  syncType: YouTubeSyncType
) {
  /*
    The existing OAuth layer already:
    - loads the stored YouTube connection from Supabase
    - refreshes the Google access token automatically when expired
    - queries YouTube Data API + YouTube Analytics API
  */
  const result = await getYouTubeDashboardData();

  if (!result.connected) {
    throw new Error(result.message);
  }

  const accountId = await getYouTubeAccountId(
    result.channel.id
  );

  try {
    await saveDashboardSnapshot(
      accountId,
      result,
      syncType
    );

    const contentResult =
      await saveContentSnapshot(
        accountId,
        result,
        syncType
      );

    await logSync(
      accountId,
      syncType,
      "success",
      1 + contentResult.metricsSaved
    );

    return {
      channelId: result.channel.id,
      channelTitle: result.channel.title,
      periodFrom: result.fromDate,
      periodTo: result.toDate,
      subscribers: result.channel.subscribers,
      totalViews: result.channel.totalViews,
      totalVideos: result.channel.totalVideos,
      overviewViews: result.overview.views,
      overviewWatchHours: result.overview.watchHours,
      contentSaved: contentResult.contentSaved,
      metricsSaved: contentResult.metricsSaved
    };
  } catch (error) {
    await logSync(
      accountId,
      syncType,
      "failed",
      0,
      error instanceof Error
        ? error.message
        : "Unknown YouTube sync error"
    );

    throw error;
  }
}

export async function runYouTubeDailySync() {
  return runYouTubeSync(
    "youtube_daily_cron"
  );
}

export async function runYouTubeManualSync() {
  return runYouTubeSync(
    "youtube_manual_sync"
  );
}
