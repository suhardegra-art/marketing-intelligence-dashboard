export type TikTokDashboardContent = {
  id: string;
  title: string;
  caption: string | null;
  publishedAt: string | null;
  permalink: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  interactions: number;
};

export type TikTokDashboardData = {
  connected: boolean;
  accountName: string;
  username: string | null;
  profileUrl: string | null;
  followers: number;
  following: number;
  totalAccountLikes: number;
  videoCount: number;
  loadedVideos: number;
  totalViews: number;
  totalVideoLikes: number;
  totalComments: number;
  totalShares: number;
  totalInteractions: number;
  snapshotDate: string | null;
  content: TikTokDashboardContent[];
  message: string;
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

export async function getTikTokDashboardData(): Promise<TikTokDashboardData> {
  const empty: TikTokDashboardData = {
    connected: false,
    accountName: "TikTok",
    username: null,
    profileUrl: null,
    followers: 0,
    following: 0,
    totalAccountLikes: 0,
    videoCount: 0,
    loadedVideos: 0,
    totalViews: 0,
    totalVideoLikes: 0,
    totalComments: 0,
    totalShares: 0,
    totalInteractions: 0,
    snapshotDate: null,
    content: [],
    message: "TikTok data is not available yet."
  };

  try {
    const accounts = (await supabaseGet(
      "/rest/v1/social_accounts?platform=eq.tiktok&select=id,account_name,username,profile_url&order=updated_at.desc&limit=1"
    )) as Array<{
      id: string;
      account_name: string;
      username: string | null;
      profile_url: string | null;
    }>;

    if (accounts.length === 0) return empty;

    const account = accounts[0];

    const metrics = (await supabaseGet(
      `/rest/v1/social_account_metrics?account_id=eq.${encodeURIComponent(
        account.id
      )}&select=metric_date,followers,following,likes,posts_count&order=metric_date.desc&limit=1`
    )) as Array<{
      metric_date: string;
      followers: number | null;
      following: number | null;
      likes: number | null;
      posts_count: number | null;
    }>;

    const latestMetric = metrics[0];

    const contentRows = (await supabaseGet(
      `/rest/v1/social_content?account_id=eq.${encodeURIComponent(
        account.id
      )}&select=id,title,caption,published_at,permalink,thumbnail_url,duration_seconds&order=published_at.desc&limit=100`
    )) as Array<{
      id: string;
      title: string | null;
      caption: string | null;
      published_at: string | null;
      permalink: string | null;
      thumbnail_url: string | null;
      duration_seconds: number | null;
    }>;

    let contentMetrics: Array<{
      content_id: string;
      snapshot_date: string;
      views: number | null;
      likes: number | null;
      comments: number | null;
      shares: number | null;
      interactions: number | null;
    }> = [];

    if (contentRows.length > 0) {
      const ids = contentRows.map((item) => `"${item.id}"`).join(",");
      contentMetrics = (await supabaseGet(
        `/rest/v1/social_content_metrics?content_id=in.(${encodeURIComponent(
          ids
        )})&select=content_id,snapshot_date,views,likes,comments,shares,interactions&order=snapshot_date.desc`
      )) as typeof contentMetrics;
    }

    const latestByContent = new Map<string, (typeof contentMetrics)[number]>();
    for (const metric of contentMetrics) {
      if (!latestByContent.has(metric.content_id)) {
        latestByContent.set(metric.content_id, metric);
      }
    }

    const content: TikTokDashboardContent[] = contentRows.map((item) => {
      const metric = latestByContent.get(item.id);
      return {
        id: item.id,
        title: item.title || item.caption || "Untitled TikTok video",
        caption: item.caption,
        publishedAt: item.published_at,
        permalink: item.permalink,
        thumbnailUrl: item.thumbnail_url,
        durationSeconds: item.duration_seconds,
        views: metric?.views ?? 0,
        likes: metric?.likes ?? 0,
        comments: metric?.comments ?? 0,
        shares: metric?.shares ?? 0,
        interactions: metric?.interactions ?? 0
      };
    });

    const totalViews = content.reduce((sum, item) => sum + item.views, 0);
    const totalVideoLikes = content.reduce((sum, item) => sum + item.likes, 0);
    const totalComments = content.reduce((sum, item) => sum + item.comments, 0);
    const totalShares = content.reduce((sum, item) => sum + item.shares, 0);
    const totalInteractions = content.reduce(
      (sum, item) => sum + item.interactions,
      0
    );

    const latestContentSnapshot =
      contentMetrics.length > 0 ? contentMetrics[0].snapshot_date : null;

    return {
      connected: true,
      accountName: account.account_name,
      username: account.username,
      profileUrl: account.profile_url,
      followers: latestMetric?.followers ?? 0,
      following: latestMetric?.following ?? 0,
      totalAccountLikes: latestMetric?.likes ?? 0,
      videoCount: latestMetric?.posts_count ?? 0,
      loadedVideos: content.length,
      totalViews,
      totalVideoLikes,
      totalComments,
      totalShares,
      totalInteractions,
      snapshotDate: latestMetric?.metric_date ?? latestContentSnapshot,
      content,
      message:
        "Live TikTok profile and public video metrics loaded from Supabase."
    };
  } catch (error) {
    console.error("TikTok dashboard data error", error);
    return {
      ...empty,
      message:
        error instanceof Error
          ? `Unable to load TikTok data: ${error.message}`
          : "Unable to load TikTok data."
    };
  }
}
