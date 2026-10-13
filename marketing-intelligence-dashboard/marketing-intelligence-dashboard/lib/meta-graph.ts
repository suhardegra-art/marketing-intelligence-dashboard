type MetaParams = Record<string, string | number | boolean | undefined | null>;

function required(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

export function metaConfig() {
  return {
    version: process.env.META_GRAPH_VERSION?.trim() || "v26.0",
    pageAccessToken: required("META_PAGE_ACCESS_TOKEN"),
    facebookPageId: required("META_FACEBOOK_PAGE_ID"),
    instagramUserId: required("META_INSTAGRAM_USER_ID")
  };
}

export async function metaGraph<T>(
  path: string,
  params: MetaParams = {},
  init: RequestInit = {}
): Promise<T> {
  const { version, pageAccessToken } = metaConfig();

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(
    `https://graph.facebook.com/${version}${normalizedPath}`
  );

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });

  url.searchParams.set("access_token", pageAccessToken);

  const response = await fetch(url, {
    ...init,
    cache: "no-store"
  });

  const raw = await response.text();
  let payload: any = {};

  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(
      `Meta Graph API returned a non-JSON response (${response.status}).`
    );
  }

  if (!response.ok || payload?.error) {
    const message =
      payload?.error?.message ||
      `Meta Graph API HTTP ${response.status}`;

    throw new Error(message);
  }

  return payload as T;
}

export function unixDate(date: string | null | undefined) {
  if (!date) return undefined;
  const value = Math.floor(new Date(`${date}T00:00:00Z`).getTime() / 1000);
  return Number.isFinite(value) ? value : undefined;
}
