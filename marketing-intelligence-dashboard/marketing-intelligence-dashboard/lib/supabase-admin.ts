import type { TikTokTokenResponse, TikTokUser, TikTokVideo } from "@/lib/tiktok";

type TikTokConnectionStatus = {
  configured: boolean;
  connected: boolean;
  externalAccountId: string | null;
  accessTokenExpiresAt: string | null;
  updatedAt: string | null;
  message: string;
};

function getConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) return null;
  return { url, secretKey };
}

async function supabaseFetch(path: string, init: RequestInit = {}) {
  const config = getConfig();
  if (!config) throw new Error("Supabase environment variables are missing.");

  const headers = new Headers(init.headers);

  // New Supabase sb_secret_* API keys must be sent using the apikey header.
  // They are not JWTs, so do not send them as Authorization: Bearer.
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

export async function getTikTokConnectionStatus(): Promise<TikTokConnectionStatus> {
  if (!getConfig()) {
    return {
      configured: false,
      connected: false,
      externalAccountId: null,
      accessTokenExpiresAt: null,
      updatedAt: null,
      message: "Supabase is not configured."
    };
  }

  try {
    const response = await supabaseFetch(
      "/rest/v1/social_connections?platform=eq.tiktok&select=external_account_id,access_token_expires_at,updated_at&order=updated_at.desc&limit=1"
    );

    if (!response.ok) {
      const body = await response.text();
      console.error("TikTok connection read failed", response.status, body);

      return {
        configured: true,
        connected: false,
        externalAccountId: null,
        accessTokenExpiresAt: null,
        updatedAt: null,
        message: `Unable to read TikTok connection (HTTP ${response.status}).`
      };
    }

    const rows = (await response.json()) as Array<{
      external_account_id: string;
      access_token_expires_at: string | null;
      updated_at: string | null;
    }>;

    if (rows.length === 0) {
      return {
        configured: true,
        connected: false,
        externalAccountId: null,
        accessTokenExpiresAt: null,
        updatedAt: null,
        message: "TikTok has not been connected yet."
      };
    }

    return {
      configured: true,
      connected: true,
      externalAccountId: rows[0].external_account_id,
      accessTokenExpiresAt: rows[0].access_token_expires_at,
      updatedAt: rows[0].updated_at,
      message: "TikTok authorization is stored securely in Supabase."
    };
  } catch (error) {
    console.error("TikTok connection status error", error);
    return {
      configured: true,
      connected: false,
      externalAccountId: null,
      accessTokenExpiresAt: null,
      updatedAt: null,
      message: "Unable to check TikTok connection."
    };
  }
}

export async function saveTikTokConnection(token: TikTokTokenResponse) {
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
    throw new Error(`Supabase token save failed: ${await readError(response)}`);
  }
}

async function getOrCreateTikTokAccount(user: TikTokUser): Promise<string> {
  const lookup = await supabaseFetch(
    `/rest/v1/social_accounts?platform=eq.tiktok&external_account_id=eq.${encodeURIComponent(
      user.open_id
    )}&select=id&limit=1`
  );

  if (!lookup.ok) {
    throw new Error(`Supabase account lookup failed: ${await readError(lookup)}`);
  }

  const existing = (await lookup.json()) as Array<{ id: string }>;
  const accountPayload = {
    platform: "tiktok",
    account_name: user.display_name || user.username || "TikTok Account",
    username: user.username ?? null,
    external_account_id: user.open_id,
    profile_url: user.profile_deep_link ?? null,
    is_active: true,
    updated_at: new Date().toISOString()
  };

  if (existing.length > 0) {
    const id = existing[0].id;
    const update = await supabaseFetch(
      `/rest/v1/social_accounts?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(accountPayload)
      }
    );

    if (!update.ok) {
      throw new Error(`Supabase account update failed: ${await readError(update)}`);
    }

    return id;
  }

  const create = await supabaseFetch("/rest/v1/social_accounts", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(accountPayload)
  });

  if (!create.ok) {
    throw new Error(`Supabase account create failed: ${await readError(create)}`);
  }

  const rows = (await create.json()) as Array<{ id: string }>;
  if (!rows[0]?.id) throw new Error("Supabase did not return a social account ID.");
  return rows[0].id;
}

async function saveTikTokAccountMetrics(accountId: string, user: TikTokUser) {
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

  if (!response.ok) {
    throw new Error(`Supabase account metrics failed: ${await readError(response)}`);
  }
}

async function saveTikTokVideos(accountId: string, videos: TikTokVideo[]) {
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
    throw new Error(`Supabase content save failed: ${await readError(contentResponse)}`);
  }

  const savedContent = (await contentResponse.json()) as Array<{
    id: string;
    external_content_id: string;
  }>;

  const idByExternalId = new Map(
    savedContent.map((item) => [item.external_content_id, item.id])
  );

  const snapshotDate = new Date().toISOString().slice(0, 10);
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

  const metricResponse = await supabaseFetch(
    "/rest/v1/social_content_metrics?on_conflict=content_id,snapshot_date",
    {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(metricRows)
    }
  );

  if (!metricResponse.ok) {
    throw new Error(`Supabase content metrics failed: ${await readError(metricResponse)}`);
  }
}

async function logSync(
  accountId: string,
  status: "success" | "failed",
  recordsReceived: number,
  errorMessage?: string
) {
  try {
    await supabaseFetch("/rest/v1/social_sync_log", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        account_id: accountId,
        sync_type: "tiktok_oauth_initial_sync",
        finished_at: new Date().toISOString(),
        status,
        records_received: recordsReceived,
        error_message: errorMessage ?? null
      })
    });
  } catch (error) {
    console.error("Unable to write social_sync_log", error);
  }
}

export async function saveTikTokInitialData(
  token: TikTokTokenResponse,
  user: TikTokUser,
  videos: TikTokVideo[]
) {
  await saveTikTokConnection(token);

  const accountId = await getOrCreateTikTokAccount(user);

  try {
    await saveTikTokAccountMetrics(accountId, user);
    await saveTikTokVideos(accountId, videos);
    await logSync(accountId, "success", videos.length + 1);
  } catch (error) {
    await logSync(
      accountId,
      "failed",
      0,
      error instanceof Error ? error.message : "Unknown TikTok sync error"
    );
    throw error;
  }

  return accountId;
}
