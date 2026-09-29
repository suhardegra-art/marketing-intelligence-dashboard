export type TikTokHistoryRow = {
  metricDate: string;
  followers: number;
  following: number;
  likes: number;
  videoCount: number;
};

export type TikTokHistoryRange = {
  from?: string | null;
  to?: string | null;
  limit?: number;
};

function getConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) return null;
  return { url, secretKey };
}

async function supabaseGet(path: string) {
  const config = getConfig();
  if (!config) throw new Error("Supabase is not configured.");

  const response = await fetch(`${config.url}${path}`, {
    headers: {
      apikey: config.secretKey
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase HTTP ${response.status}: ${body}`);
  }

  return response.json();
}

function normalizeDate(value?: string | null) {
  if (!value) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export async function getTikTokHistory(
  options: TikTokHistoryRange = {}
): Promise<TikTokHistoryRow[]> {
  try {
    let from = normalizeDate(options.from);
    let to = normalizeDate(options.to);

    if (from && to && from > to) {
      [from, to] = [to, from];
    }

    const accounts = (await supabaseGet(
      "/rest/v1/social_accounts?platform=eq.tiktok&select=id&order=updated_at.desc&limit=1"
    )) as Array<{ id: string }>;

    const accountId = accounts[0]?.id;
    if (!accountId) return [];

    const filters = [
      `account_id=eq.${encodeURIComponent(accountId)}`,
      "select=metric_date,followers,following,likes,posts_count",
      "order=metric_date.desc"
    ];

    if (from) filters.push(`metric_date=gte.${encodeURIComponent(from)}`);
    if (to) filters.push(`metric_date=lte.${encodeURIComponent(to)}`);

    const limit = Math.max(1, Math.min(options.limit ?? (from || to ? 120 : 7), 365));
    filters.push(`limit=${limit}`);

    const rows = (await supabaseGet(
      `/rest/v1/social_account_metrics?${filters.join("&")}`
    )) as Array<{
      metric_date: string;
      followers: number | null;
      following: number | null;
      likes: number | null;
      posts_count: number | null;
    }>;

    return rows
      .map((row) => ({
        metricDate: row.metric_date,
        followers: row.followers ?? 0,
        following: row.following ?? 0,
        likes: row.likes ?? 0,
        videoCount: row.posts_count ?? 0
      }))
      .reverse();
  } catch (error) {
    console.error("TikTok history error", error);
    return [];
  }
}
