import {
  getStoredYouTubeConnection,
  saveYouTubeConnection
} from "@/lib/youtube-supabase";

export const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly"
];

function getOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI are required."
    );
  }

  return { clientId, clientSecret, redirectUri };
}

export function buildYouTubeAuthorizationUrl(state: string) {
  const { clientId, redirectUri } = getOAuthConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    scope: YOUTUBE_SCOPES.join(" "),
    state
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

type GoogleTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

export async function exchangeYouTubeCode(code: string) {
  const { clientId, clientSecret, redirectUri } = getOAuthConfig();

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    }),
    cache: "no-store"
  });

  const payload = (await response.json()) as GoogleTokenResponse & {
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description || payload.error || "Google OAuth token exchange failed."
    );
  }

  return payload;
}

async function refreshYouTubeToken(refreshToken: string) {
  const { clientId, clientSecret } = getOAuthConfig();

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token"
    }),
    cache: "no-store"
  });

  const payload = (await response.json()) as GoogleTokenResponse & {
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description || payload.error || "Unable to refresh YouTube access token."
    );
  }

  return payload;
}

export async function getValidYouTubeAccessToken() {
  const connection = await getStoredYouTubeConnection();
  if (!connection) return null;

  const expiresAt = connection.accessTokenExpiresAt
    ? new Date(connection.accessTokenExpiresAt).getTime()
    : null;

  const stillValid = expiresAt
    ? expiresAt > Date.now() + 5 * 60 * 1000
    : true;

  if (stillValid) return connection.accessToken;

  if (!connection.refreshToken) {
    throw new Error("YouTube access token expired and no refresh token is stored.");
  }

  const refreshed = await refreshYouTubeToken(connection.refreshToken);

  await saveYouTubeConnection({
    externalAccountId: connection.externalAccountId,
    accessToken: refreshed.access_token,
    refreshToken: connection.refreshToken,
    expiresIn: refreshed.expires_in ?? null,
    scopes: refreshed.scope
      ? refreshed.scope.split(" ").filter(Boolean)
      : connection.scopes,
    tokenType: refreshed.token_type ?? "Bearer"
  });

  return refreshed.access_token;
}
