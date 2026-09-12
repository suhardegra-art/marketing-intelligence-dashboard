export type TikTokHistoryRow = {
  metricDate: string;
  followers: number;
  following: number;
  likes: number;
  videoCount: number;
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

export async function getTikTokHistory(limit = 7): Promise<TikTokHistoryRow[]> {
  try {
    const accounts = (await supabaseGet(
      "/rest/v1/social_accounts?platform=eq.tiktok&select=id&order=updated_at.desc&limit=1"
    )) as Array<{ id: string }>;

    const accountId = accounts[0]?.id;
    if (!accountId) return [];

    const rows = (await supabaseGet(
      `/rest/v1/social_account_metrics?account_id=eq.${encodeURIComponent(
        accountId
      )}&select=metric_date,followers,following,likes,posts_count&order=metric_date.desc&limit=${limit}`
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
