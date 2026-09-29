export type YouTubeStoredConnection = {
  externalAccountId: string;
  accessToken: string;
  refreshToken: string | null;
  accessTokenExpiresAt: string | null;
  scopes: string[];
  updatedAt: string | null;
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
  const body = await response.text();
  return body || `HTTP ${response.status}`;
}

export async function getStoredYouTubeConnection(): Promise<YouTubeStoredConnection | null> {
  if (!getConfig()) return null;

  const response = await supabaseFetch(
    "/rest/v1/social_connections?platform=eq.youtube&select=external_account_id,access_token,refresh_token,access_token_expires_at,scopes,updated_at&order=updated_at.desc&limit=1"
  );

  if (!response.ok) {
    throw new Error(`Unable to read YouTube connection: ${await readError(response)}`);
  }

  const rows = (await response.json()) as Array<{
    external_account_id: string;
    access_token: string;
    refresh_token: string | null;
    access_token_expires_at: string | null;
    scopes: string[] | null;
    updated_at: string | null;
  }>;

  const row = rows[0];
  if (!row) return null;

  return {
    externalAccountId: row.external_account_id,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    accessTokenExpiresAt: row.access_token_expires_at,
    scopes: row.scopes ?? [],
    updatedAt: row.updated_at
  };
}

export async function saveYouTubeConnection(input: {
  externalAccountId: string;
  accessToken: string;
  refreshToken?: string | null;
  expiresIn?: number | null;
  scopes?: string[];
  tokenType?: string | null;
}) {
  const now = Date.now();
  const expiresAt = input.expiresIn
    ? new Date(now + input.expiresIn * 1000).toISOString()
    : null;

  const existing = await getStoredYouTubeConnection();

  const response = await supabaseFetch(
    "/rest/v1/social_connections?on_conflict=platform,external_account_id",
    {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify({
        platform: "youtube",
        external_account_id: input.externalAccountId,
        access_token: input.accessToken,
        refresh_token: input.refreshToken ?? existing?.refreshToken ?? null,
        access_token_expires_at: expiresAt,
        refresh_token_expires_at: null,
        scopes: input.scopes ?? existing?.scopes ?? [],
        raw_token_response: {
          token_type: input.tokenType ?? "Bearer",
          expires_in: input.expiresIn ?? null
        },
        updated_at: new Date().toISOString()
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Unable to save YouTube connection: ${await readError(response)}`);
  }
}

export async function deleteYouTubeConnection() {
  if (!getConfig()) return;

  const response = await supabaseFetch(
    "/rest/v1/social_connections?platform=eq.youtube",
    { method: "DELETE" }
  );

  if (!response.ok) {
    throw new Error(`Unable to delete YouTube connection: ${await readError(response)}`);
  }
}

export async function saveYouTubeChannelSnapshot(input: {
  channelId: string;
  channelName: string;
  handle: string | null;
  channelUrl: string;
  subscribers: number;
  totalViews: number;
  totalVideos: number;
}) {
  if (!getConfig()) return;

  const lookup = await supabaseFetch(
    `/rest/v1/social_accounts?platform=eq.youtube&external_account_id=eq.${encodeURIComponent(
      input.channelId
    )}&select=id&limit=1`
  );

  if (!lookup.ok) {
    throw new Error(`Unable to find YouTube account: ${await readError(lookup)}`);
  }

  const existing = (await lookup.json()) as Array<{ id: string }>;
  let accountId = existing[0]?.id ?? null;

  const accountPayload = {
    platform: "youtube",
    account_name: input.channelName,
    username: input.handle,
    external_account_id: input.channelId,
    profile_url: input.channelUrl,
    is_active: true,
    updated_at: new Date().toISOString()
  };

  if (accountId) {
    const update = await supabaseFetch(
      `/rest/v1/social_accounts?id=eq.${encodeURIComponent(accountId)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(accountPayload)
      }
    );

    if (!update.ok) {
      throw new Error(`Unable to update YouTube account: ${await readError(update)}`);
    }
  } else {
    const create = await supabaseFetch("/rest/v1/social_accounts", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(accountPayload)
    });

    if (!create.ok) {
      throw new Error(`Unable to create YouTube account: ${await readError(create)}`);
    }

    const created = (await create.json()) as Array<{ id: string }>;
    accountId = created[0]?.id ?? null;
  }

  if (!accountId) return;

  const metricDate = new Date().toISOString().slice(0, 10);
  const metricsResponse = await supabaseFetch(
    "/rest/v1/social_account_metrics?on_conflict=account_id,metric_date",
    {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify({
        account_id: accountId,
        metric_date: metricDate,
        followers: input.subscribers,
        following: 0,
        likes: 0,
        posts_count: input.totalVideos,
        extra_metrics: {
          total_views: input.totalViews,
          source: "youtube_data_api"
        }
      })
    }
  );

  if (!metricsResponse.ok) {
    throw new Error(`Unable to save YouTube metrics: ${await readError(metricsResponse)}`);
  }
}
