import { fetchTikTokUser } from "@/lib/tiktok";
import type { TikTokTokenResponse, TikTokUser, TikTokVideo } from "@/lib/tiktok";

type StoredConnection = {
  external_account_id: string;
  access_token: string;
  refresh_token: string | null;
  access_token_expires_at: string | null;
  refresh_token_expires_at: string | null;
  scopes: string[] | null;
};

export type TikTokVideoPage = {
  videos: TikTokVideo[];
  hasMore: boolean;
  nextCursor: number | null;
};

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) throw new Error("Supabase is not configured.");
  return { url, secretKey };
}

function getTikTokConfig() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  if (!clientKey || !clientSecret) {
    throw new Error("TikTok client credentials are not configured.");
  }
  return { clientKey, clientSecret };
}

function getJakartaDate() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return new Date().toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

async function supabaseFetch(path: string, init: RequestInit = {}) {
  const { url, secretKey } = getSupabaseConfig();
  const headers = new Headers(init.headers);
  headers.set("apikey", secretKey);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${url}${path}`, {
    ...init,
    headers,
    cache: "no-store"
  });
}

async function readError(response: Response) {
  const text = await response.text();
  return text || `HTTP ${response.status}`;
}

export async function getStoredTikTokConnection(): Promise<StoredConnection> {
  const response = await supabaseFetch(
    "/rest/v1/social_connections?platform=eq.tiktok&select=external_account_id,access_token,refresh_token,access_token_expires_at,refresh_token_expires_at,scopes&order=updated_at.desc&limit=1"
  );

  if (!response.ok) {
    throw new Error(`Unable to read TikTok connection: ${await readError(response)}`);
  }

  const rows = (await response.json()) as StoredConnection[];
  if (!rows[0]) throw new Error("TikTok has not been connected yet.");
  return rows[0];
}

async function saveRefreshedToken(token: TikTokTokenResponse) {
  const now = Date.now();
  const accessExpiry = new Date(now + token.expires_in * 1000).toISOString();
  const refreshExpiry =
    token.refresh_token && token.refresh_expires_in
      ? new Date(now + token.refresh_expires_in * 1000).toISOString()
      : null;

  const response = await supabaseFetch(
    "/rest/v1/social_connections?on_conflict=platform,external_account_id",
    {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify({
        platform: "tiktok",
        external_account_id: token.open_id,
        access_token: token.access_token,
        refresh_token: token.refresh_token ?? null,
        access_token_expires_at: accessExpiry,
        refresh_token_expires_at: refreshExpiry,
        scopes: token.scope
          ? token.scope.split(",").map((scope) => scope.trim()).filter(Boolean)
          : [],
        raw_token_response: {
          open_id: token.open_id,
          scope: token.scope,
          expires_in: token.expires_in,
          refresh_expires_in: token.refresh_expires_in ?? null,
          token_type: token.token_type ?? "Bearer"
        },
        updated_at: new Date().toISOString()
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Unable to save refreshed TikTok token: ${await readError(response)}`);
  }
}

async function refreshTikTokToken(refreshToken: string): Promise<TikTokTokenResponse> {
  const { clientKey, clientSecret } = getTikTokConfig();

  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken
  });

  const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache"
    },
    body,
    cache: "no-store"
  });

  const payload = (await response.json()) as TikTokTokenResponse & {
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !payload.access_token || !payload.open_id) {
    throw new Error(
      payload.error_description ||
        payload.error ||
        `TikTok token refresh failed with HTTP ${response.status}.`
    );
  }

  await saveRefreshedToken(payload);
  return payload;
}

export async function getValidTikTokAccessToken() {
  const connection = await getStoredTikTokConnection();

  const expiresAt = connection.access_token_expires_at
    ? new Date(connection.access_token_expires_at).getTime()
    : 0;

  const refreshEarlyMs = 10 * 60 * 1000;
  const needsRefresh = !expiresAt || expiresAt - Date.now() < refreshEarlyMs;

  if (!needsRefresh) {
    return {
      accessToken: connection.access_token,
      openId: connection.external_account_id
    };
  }

  if (!connection.refresh_token) {
    throw new Error("TikTok access token expired and no refresh token is stored.");
  }

  const refreshed = await refreshTikTokToken(connection.refresh_token);
  return {
    accessToken: refreshed.access_token,
    openId: refreshed.open_id
  };
}

export async function fetchTikTokVideoPage(
  accessToken: string,
  cursor?: number | null
): Promise<TikTokVideoPage> {
  const fields = [
    "id",
    "create_time",
    "cover_image_url",
    "share_url",
    "video_description",
    "duration",
    "title",
    "like_count",
    "comment_count",
    "share_count",
    "view_count",
    "is_aigc"
  ].join(",");

  const body: { max_count: number; cursor?: number } = {
    max_count: 20
  };

  if (typeof cursor === "number") body.cursor = cursor;

  const response = await fetch(
    `https://open.tiktokapis.com/v2/video/list/?fields=${encodeURIComponent(fields)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      cache: "no-store"
    }
  );

  const payload = (await response.json()) as {
    data?: {
      videos?: TikTokVideo[];
      cursor?: number;
      has_more?: boolean;
    };
    error?: {
      code?: string | number;
      message?: string;
      log_id?: string;
    };
  };

  const errorCode = payload.error?.code;
  const hasApiError =
    errorCode !== undefined && errorCode !== "ok" && errorCode !== 0;

  if (!response.ok || hasApiError) {
    throw new Error(
      payload.error?.message ||
        `TikTok video list failed with HTTP ${response.status}.`
    );
  }

  return {
    videos: payload.data?.videos ?? [],
    hasMore: Boolean(payload.data?.has_more),
    nextCursor:
      payload.data?.has_more && typeof payload.data.cursor === "number"
        ? payload.data.cursor
        : null
  };
}

export async function getTikTokAccountId(openId: string) {
  const response = await supabaseFetch(
    `/rest/v1/social_accounts?platform=eq.tiktok&external_account_id=eq.${encodeURIComponent(
      openId
    )}&select=id&limit=1`
  );

  if (!response.ok) {
    throw new Error(`Unable to find TikTok account: ${await readError(response)}`);
  }

  const rows = (await response.json()) as Array<{ id: string }>;
  if (!rows[0]?.id) {
    throw new Error("TikTok account is missing from social_accounts.");
  }

  return rows[0].id;
}

export async function saveTikTokDailyAccountSnapshot(
  accountId: string,
  user: TikTokUser
) {
  const accountUpdate = await supabaseFetch(
    `/rest/v1/social_accounts?id=eq.${encodeURIComponent(accountId)}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        account_name: user.display_name || user.username || "TikTok Account",
        username: user.username ?? null,
        profile_url: user.profile_deep_link ?? null,
        is_active: true,
        updated_at: new Date().toISOString()
      })
    }
  );

  if (!accountUpdate.ok) {
    throw new Error(
      `Unable to update TikTok account profile: ${await readError(accountUpdate)}`
    );
  }

  const metricDate = getJakartaDate();

  const metricResponse = await supabaseFetch(
    "/rest/v1/social_account_metrics?on_conflict=account_id,metric_date",
    {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify({
        account_id: accountId,
        metric_date: metricDate,
        followers: user.follower_count ?? 0,
        following: user.following_count ?? 0,
        likes: user.likes_count ?? 0,
        posts_count: user.video_count ?? 0,
        extra_metrics: {
          is_verified: user.is_verified ?? false,
          bio_description: user.bio_description ?? null,
          avatar_url: user.avatar_url ?? null
        }
      })
    }
  );

  if (!metricResponse.ok) {
    throw new Error(
      `Unable to save TikTok account snapshot: ${await readError(metricResponse)}`
    );
  }
}

export async function saveTikTokVideoBatch(
  accountId: string,
  videos: TikTokVideo[]
) {
  if (videos.length === 0) return;

  const contentRows = videos.map((video) => ({
    account_id: accountId,
    external_content_id: video.id,
    content_type: "video",
    title: video.title || video.video_description || null,
    caption: video.video_description ?? null,
    published_at: video.create_time
      ? new Date(video.create_time * 1000).toISOString()
      : null,
    permalink: video.share_url ?? null,
    thumbnail_url: video.cover_image_url ?? null,
    duration_seconds: video.duration ?? null,
    is_ai_generated: video.is_aigc ?? null,
    raw_metadata: video,
    updated_at: new Date().toISOString()
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
    throw new Error(`Unable to save TikTok content: ${await readError(contentResponse)}`);
  }

  const savedContent = (await contentResponse.json()) as Array<{
    id: string;
    external_content_id: string;
  }>;

  const idByExternalId = new Map(
    savedContent.map((item) => [item.external_content_id, item.id])
  );

  const snapshotDate = getJakartaDate();

  const metricRows = videos
    .map((video) => {
      const contentId = idByExternalId.get(video.id);
      if (!contentId) return null;

      const likes = video.like_count ?? 0;
      const comments = video.comment_count ?? 0;
      const shares = video.share_count ?? 0;

      return {
        content_id: contentId,
        snapshot_date: snapshotDate,
        views: video.view_count ?? 0,
        likes,
        comments,
        shares,
        interactions: likes + comments + shares,
        extra_metrics: {
          is_aigc: video.is_aigc ?? null
        }
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (metricRows.length === 0) return;

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
      `Unable to save TikTok content metrics: ${await readError(metricsResponse)}`
    );
  }
}

export async function getStoredTikTokVideoCount(accountId: string) {
  const response = await supabaseFetch(
    `/rest/v1/social_content?account_id=eq.${encodeURIComponent(
      accountId
    )}&select=id`,
    {
      headers: {
        Prefer: "count=exact",
        Range: "0-0"
      }
    }
  );

  if (!response.ok) return null;

  const range = response.headers.get("content-range");
  if (!range) return null;

  const slash = range.lastIndexOf("/");
  if (slash === -1) return null;

  const count = Number(range.slice(slash + 1));
  return Number.isFinite(count) ? count : null;
}

export async function logTikTokFullSync(
  accountId: string,
  recordsReceived: number,
  syncType = "tiktok_full_video_sync"
) {
  try {
    await supabaseFetch("/rest/v1/social_sync_log", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        account_id: accountId,
        sync_type: syncType,
        finished_at: new Date().toISOString(),
        status: "success",
        records_received: recordsReceived
      })
    });
  } catch (error) {
    console.error("Unable to write TikTok sync log", error);
  }
}

export async function runTikTokDailySync() {
  const { accessToken, openId } = await getValidTikTokAccessToken();
  const accountId = await getTikTokAccountId(openId);

  const user = await fetchTikTokUser(accessToken);
  await saveTikTokDailyAccountSnapshot(accountId, user);

  let cursor: number | null = null;
  let totalSynced = 0;
  let pages = 0;

  while (pages < 100) {
    const page = await fetchTikTokVideoPage(accessToken, cursor);
    await saveTikTokVideoBatch(accountId, page.videos);

    totalSynced += page.videos.length;
    pages += 1;

    if (!page.hasMore) break;
    if (typeof page.nextCursor !== "number") {
      throw new Error("TikTok returned has_more without a next cursor.");
    }

    cursor = page.nextCursor;
  }

  await logTikTokFullSync(
    accountId,
    totalSynced + 1,
    "tiktok_daily_snapshot_sync"
  );

  return {
    accountId,
    followers: user.follower_count ?? 0,
    videoCount: user.video_count ?? 0,
    videosSynced: totalSynced,
    pages
  };
}
