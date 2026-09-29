export type TikTokTokenResponse = {
  open_id: string;
  scope: string;
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_expires_in?: number;
  token_type?: string;
};

export type TikTokUser = {
  open_id: string;
  avatar_url?: string;
  display_name?: string;
  username?: string;
  profile_deep_link?: string;
  bio_description?: string;
  is_verified?: boolean;
  follower_count?: number;
  following_count?: number;
  likes_count?: number;
  video_count?: number;
};

export type TikTokVideo = {
  id: string;
  create_time?: number;
  cover_image_url?: string;
  share_url?: string;
  video_description?: string;
  duration?: number;
  title?: string;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  view_count?: number;
  is_aigc?: boolean;
};

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export function getTikTokConfig() {
  return {
    clientKey: requireEnv("TIKTOK_CLIENT_KEY"),
    clientSecret: requireEnv("TIKTOK_CLIENT_SECRET"),
    redirectUri: requireEnv("TIKTOK_REDIRECT_URI")
  };
}

export function buildTikTokAuthorizeUrl(state: string) {
  const { clientKey, redirectUri } = getTikTokConfig();

  const url = new URL("https://www.tiktok.com/v2/auth/authorize/");
  url.searchParams.set("client_key", clientKey);
  url.searchParams.set(
    "scope",
    "user.info.basic,user.info.profile,user.info.stats,video.list"
  );
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);

  return url;
}

export async function exchangeTikTokCode(code: string): Promise<TikTokTokenResponse> {
  const { clientKey, clientSecret, redirectUri } = getTikTokConfig();

  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri
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
        `TikTok token exchange failed with HTTP ${response.status}.`
    );
  }

  return payload;
}

export async function fetchTikTokUser(accessToken: string): Promise<TikTokUser> {
  const fields = [
    "open_id",
    "avatar_url",
    "display_name",
    "username",
    "profile_deep_link",
    "bio_description",
    "is_verified",
    "follower_count",
    "following_count",
    "likes_count",
    "video_count"
  ].join(",");

  const response = await fetch(
    `https://open.tiktokapis.com/v2/user/info/?fields=${encodeURIComponent(fields)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      cache: "no-store"
    }
  );

  const payload = (await response.json()) as {
    data?: { user?: TikTokUser };
    error?: { code?: string | number; message?: string };
  };

  const errorCode = payload.error?.code;
  const hasApiError =
    errorCode !== undefined && errorCode !== "ok" && errorCode !== 0;

  if (!response.ok || hasApiError || !payload.data?.user?.open_id) {
    throw new Error(
      payload.error?.message ||
        `TikTok user info failed with HTTP ${response.status}.`
    );
  }

  return payload.data.user;
}

export async function fetchTikTokVideos(
  accessToken: string,
  maxPages = 1
): Promise<TikTokVideo[]> {
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

  const videos: TikTokVideo[] = [];
  let cursor: number | undefined;

  for (let page = 0; page < maxPages; page += 1) {
    const body: { max_count: number; cursor?: number } = { max_count: 20 };
    if (cursor !== undefined) body.cursor = cursor;

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
      error?: { code?: string | number; message?: string };
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

    videos.push(...(payload.data?.videos ?? []));

    if (!payload.data?.has_more || payload.data.cursor === undefined) break;
    cursor = payload.data.cursor;
  }

  return videos;
}
