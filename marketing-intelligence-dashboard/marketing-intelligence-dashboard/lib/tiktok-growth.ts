export type GrowthPoint = {
  date: string;
  value: number;
};

export type GrowthMetric = {
  key: "followers" | "views" | "likes" | "commentsShares" | "newFollowers";
  title: string;
  primaryValue: number | null;
  periodChange: number | null;
  periodChangePercent: number | null;
  previousValue: number | null;
  comparisonPercent: number | null;
  currentSeries: GrowthPoint[];
  previousSeries: GrowthPoint[];
  previousAvailable: boolean;
};

export type TikTokGrowthData = {
  mode: "trend" | "comparison";
  currentFrom: string;
  currentTo: string;
  previousFrom: string | null;
  previousTo: string | null;
  periodDays: number;
  metrics: GrowthMetric[];
  snapshotCount: number;
  message: string;
};

type AccountMetricRow = {
  metric_date: string;
  followers: number | null;
  following: number | null;
  likes: number | null;
  posts_count: number | null;
};

type ContentTotalRow = {
  snapshot_date: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  interactions: number | null;
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

function validDate(value?: string | null) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function inclusiveDays(from: string, to: string) {
  const start = new Date(`${from}T00:00:00Z`).getTime();
  const end = new Date(`${to}T00:00:00Z`).getTime();
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
}

function between<T extends { metric_date?: string; snapshot_date?: string }>(
  rows: T[],
  from: string,
  to: string
) {
  return rows.filter((row) => {
    const date = row.metric_date ?? row.snapshot_date ?? "";
    return date >= from && date <= to;
  });
}

function numberOrZero(value: number | null | undefined) {
  return Number(value ?? 0);
}

function percentageChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function periodDelta(values: GrowthPoint[]) {
  if (values.length < 2) return null;
  return values[values.length - 1].value - values[0].value;
}

function currentFollowerSeries(rows: AccountMetricRow[]): GrowthPoint[] {
  return rows.map((row) => ({
    date: row.metric_date,
    value: numberOrZero(row.followers)
  }));
}

function cumulativeGainSeries(
  rows: ContentTotalRow[],
  key: "views" | "likes" | "commentsShares"
): GrowthPoint[] {
  if (rows.length === 0) return [];

  const start = rows[0];

  const baseline =
    key === "views"
      ? numberOrZero(start.views)
      : key === "likes"
        ? numberOrZero(start.likes)
        : numberOrZero(start.comments) + numberOrZero(start.shares);

  return rows.map((row) => {
    const raw =
      key === "views"
        ? numberOrZero(row.views)
        : key === "likes"
          ? numberOrZero(row.likes)
          : numberOrZero(row.comments) + numberOrZero(row.shares);

    return {
      date: row.snapshot_date,
      value: raw - baseline
    };
  });
}

function newFollowerSeries(rows: AccountMetricRow[]): GrowthPoint[] {
  if (rows.length < 2) return [];

  return rows.slice(1).map((row, index) => ({
    date: row.metric_date,
    value:
      numberOrZero(row.followers) -
      numberOrZero(rows[index].followers)
  }));
}

function metric(
  key: GrowthMetric["key"],
  title: string,
  currentSeries: GrowthPoint[],
  previousSeries: GrowthPoint[],
  primaryValue: number | null,
  currentChange: number | null,
  previousChange: number | null
): GrowthMetric {
  return {
    key,
    title,
    primaryValue,
    periodChange: currentChange,
    periodChangePercent:
      currentSeries.length >= 2 && currentSeries[0].value !== 0
        ? percentageChange(
            currentSeries[currentSeries.length - 1].value,
            currentSeries[0].value
          )
        : null,
    previousValue: previousChange,
    comparisonPercent:
      currentChange !== null && previousChange !== null
        ? percentageChange(currentChange, previousChange)
        : null,
    currentSeries,
    previousSeries,
    previousAvailable: previousSeries.length >= 2
  };
}

export async function getTikTokGrowthData(options: {
  from?: string | null;
  to?: string | null;
}): Promise<TikTokGrowthData | null> {
  try {
    const accounts = (await supabaseGet(
      "/rest/v1/social_accounts?platform=eq.tiktok&select=id&order=updated_at.desc&limit=1"
    )) as Array<{ id: string }>;

    const accountId = accounts[0]?.id;
    if (!accountId) return null;

    const latestRows = (await supabaseGet(
      `/rest/v1/social_account_metrics?account_id=eq.${encodeURIComponent(
        accountId
      )}&select=metric_date&order=metric_date.desc&limit=1`
    )) as Array<{ metric_date: string }>;

    const latestDate = latestRows[0]?.metric_date;
    if (!latestDate) return null;

    let from = validDate(options.from);
    let to = validDate(options.to);

    const comparisonMode = Boolean(from && to);

    if (from && to && from > to) {
      [from, to] = [to, from];
    }

    const currentTo = comparisonMode && to ? to : latestDate;
    const currentFrom =
      comparisonMode && from ? from : addDays(currentTo, -29);

    const periodDays = inclusiveDays(currentFrom, currentTo);

    const previousTo = comparisonMode ? addDays(currentFrom, -1) : null;
    const previousFrom =
      comparisonMode && previousTo
        ? addDays(previousTo, -(periodDays - 1))
        : null;

    const fetchFrom =
      previousFrom ?? addDays(currentFrom, -1);

    const accountRows = (await supabaseGet(
      `/rest/v1/social_account_metrics?account_id=eq.${encodeURIComponent(
        accountId
      )}&metric_date=gte.${encodeURIComponent(
        fetchFrom
      )}&metric_date=lte.${encodeURIComponent(
        currentTo
      )}&select=metric_date,followers,following,likes,posts_count&order=metric_date.asc&limit=500`
    )) as AccountMetricRow[];

    const contentRows = (await supabaseGet(
      `/rest/v1/social_content_daily_totals?account_id=eq.${encodeURIComponent(
        accountId
      )}&snapshot_date=gte.${encodeURIComponent(
        fetchFrom
      )}&snapshot_date=lte.${encodeURIComponent(
        currentTo
      )}&select=snapshot_date,views,likes,comments,shares,interactions&order=snapshot_date.asc&limit=500`
    )) as ContentTotalRow[];

    const currentAccount = between(accountRows, currentFrom, currentTo);
    const currentContent = between(contentRows, currentFrom, currentTo);

    const previousAccount =
      previousFrom && previousTo
        ? between(accountRows, previousFrom, previousTo)
        : [];

    const previousContent =
      previousFrom && previousTo
        ? between(contentRows, previousFrom, previousTo)
        : [];

    const followerCurrent = currentFollowerSeries(currentAccount);
    const followerPrevious = currentFollowerSeries(previousAccount);

    const viewsCurrent = cumulativeGainSeries(currentContent, "views");
    const viewsPrevious = cumulativeGainSeries(previousContent, "views");

    const likesCurrent = cumulativeGainSeries(currentContent, "likes");
    const likesPrevious = cumulativeGainSeries(previousContent, "likes");

    const commentsSharesCurrent = cumulativeGainSeries(
      currentContent,
      "commentsShares"
    );
    const commentsSharesPrevious = cumulativeGainSeries(
      previousContent,
      "commentsShares"
    );

    const newFollowersCurrent = newFollowerSeries(currentAccount);
    const newFollowersPrevious = newFollowerSeries(previousAccount);

    const currentFollowers =
      followerCurrent.length > 0
        ? followerCurrent[followerCurrent.length - 1].value
        : null;

    const followerChange = periodDelta(followerCurrent);
    const previousFollowerChange = periodDelta(followerPrevious);

    const viewsChange =
      viewsCurrent.length >= 2
        ? viewsCurrent[viewsCurrent.length - 1].value
        : null;

    const previousViewsChange =
      viewsPrevious.length >= 2
        ? viewsPrevious[viewsPrevious.length - 1].value
        : null;

    const likesChange =
      likesCurrent.length >= 2
        ? likesCurrent[likesCurrent.length - 1].value
        : null;

    const previousLikesChange =
      likesPrevious.length >= 2
        ? likesPrevious[likesPrevious.length - 1].value
        : null;

    const commentsSharesChange =
      commentsSharesCurrent.length >= 2
        ? commentsSharesCurrent[commentsSharesCurrent.length - 1].value
        : null;

    const previousCommentsSharesChange =
      commentsSharesPrevious.length >= 2
        ? commentsSharesPrevious[commentsSharesPrevious.length - 1].value
        : null;

    const newFollowersTotal =
      followerChange;

    const previousNewFollowersTotal =
      previousFollowerChange;

    return {
      mode: comparisonMode ? "comparison" : "trend",
      currentFrom,
      currentTo,
      previousFrom,
      previousTo,
      periodDays,
      snapshotCount: Math.max(currentAccount.length, currentContent.length),
      message:
        comparisonMode
          ? "Current date range compared with the immediately preceding period of equal length."
          : "Default view shows the latest available 30-day trend only.",
      metrics: [
        metric(
          "followers",
          "Follower Growth",
          followerCurrent,
          followerPrevious,
          currentFollowers,
          followerChange,
          previousFollowerChange
        ),
        metric(
          "views",
          "Views",
          viewsCurrent,
          viewsPrevious,
          viewsChange,
          viewsChange,
          previousViewsChange
        ),
        metric(
          "likes",
          "Likes",
          likesCurrent,
          likesPrevious,
          likesChange,
          likesChange,
          previousLikesChange
        ),
        metric(
          "commentsShares",
          "Comments & Shares",
          commentsSharesCurrent,
          commentsSharesPrevious,
          commentsSharesChange,
          commentsSharesChange,
          previousCommentsSharesChange
        ),
        metric(
          "newFollowers",
          "New Followers",
          newFollowersCurrent,
          newFollowersPrevious,
          newFollowersTotal,
          newFollowersTotal,
          previousNewFollowersTotal
        )
      ]
    };
  } catch (error) {
    console.error("TikTok growth comparison error", error);
    return null;
  }
}
