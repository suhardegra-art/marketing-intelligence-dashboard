import {
  getValidYouTubeAccessToken
} from "@/lib/youtube-oauth";

import {
  getAllUploadedVideoIds,
  getMyYouTubeChannel,
  getVideoMetadata,
  safeAnalyticsRows,
  safeAnalyticsRowsForAllVideos,
  type YouTubeChannel
} from "@/lib/youtube-google";

import {
  saveYouTubeChannelSnapshot
} from "@/lib/youtube-supabase";

import type {
  YouTubePreviewContent
} from "@/app/youtube/youtubePreviewData";

export type YouTubeDailyPoint = {
  date: string;
  views: number;
  watchMinutes: number;
  subscribersGained: number;
  subscribersLost: number;
  likes: number;
  comments: number;
  shares: number;
};

export type YouTubeDashboardData = {
  connected: true;
  channel: YouTubeChannel;
  fromDate: string;
  toDate: string;
  overview: {
    views: number;
    watchHours: number;
    subscribersNet: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
    averageViewDuration: number;
    averageViewPercentage: number;
  };
  previousOverview: {
    views: number;
    watchHours: number;
    subscribersNet: number;
    engagementRate: number;
  };
  daily: YouTubeDailyPoint[];
  growthDaily: YouTubeDailyPoint[];
  trafficSources: Array<{
    label: string;
    views: number;
    percentage: number;
  }>;
  contentTypes: Array<{
    label: string;
    views: number;
    percentage: number;
  }>;
  ages: Array<{
    label: string;
    percentage: number;
  }>;
  genders: Array<{
    label: string;
    percentage: number;
  }>;
  devices: Array<{
    label: string;
    views: number;
    percentage: number;
  }>;
  geographies: Array<{
    label: string;
    views: number;
    percentage: number;
  }>;
  subscribedStatus: Array<{
    label: string;
    watchMinutes: number;
    percentage: number;
  }>;
  content: YouTubePreviewContent[];
};

export type YouTubeDashboardResult =
  | YouTubeDashboardData
  | {
      connected: false;
      configured: boolean;
      message: string;
    };

function isoDate(
  date: Date
) {
  return date
    .toISOString()
    .slice(0, 10);
}

function defaultPeriod() {
  const end =
    new Date();

  end.setUTCDate(
    end.getUTCDate() - 1
  );

  const start =
    new Date(end);

  start.setUTCDate(
    start.getUTCDate() - 27
  );

  return {
    fromDate:
      isoDate(start),
    toDate:
      isoDate(end)
  };
}

function dateDiffInclusive(
  fromDate: string,
  toDate: string
) {
  const from =
    new Date(
      `${fromDate}T00:00:00Z`
    ).getTime();

  const to =
    new Date(
      `${toDate}T00:00:00Z`
    ).getTime();

  return Math.max(
    1,
    Math.round(
      (to - from) /
        86400000
    ) + 1
  );
}

function shiftPeriodBack(
  fromDate: string,
  days: number
) {
  const end =
    new Date(
      `${fromDate}T00:00:00Z`
    );

  end.setUTCDate(
    end.getUTCDate() - 1
  );

  const start =
    new Date(end);

  start.setUTCDate(
    start.getUTCDate() -
      (days - 1)
  );

  return {
    fromDate:
      isoDate(start),
    toDate:
      isoDate(end)
  };
}

function numberValue(
  row:
    | Record<
        string,
        string | number
      >
    | undefined,
  key: string
) {
  return Number(
    row?.[key] || 0
  );
}

function formatDuration(
  seconds: number
) {
  const total =
    Math.max(
      0,
      Math.round(seconds)
    );

  const hours =
    Math.floor(
      total / 3600
    );

  const minutes =
    Math.floor(
      (total % 3600) /
        60
    );

  const secs =
    total % 60;

  if (hours > 0) {
    return `${hours}:${String(
      minutes
    ).padStart(
      2,
      "0"
    )}:${String(
      secs
    ).padStart(
      2,
      "0"
    )}`;
  }

  return `${minutes}:${String(
    secs
  ).padStart(
    2,
    "0"
  )}`;
}

function trafficSourceLabel(
  value: string
) {
  const map:
    Record<
      string,
      string
    > = {
      YT_SEARCH:
        "YouTube search",
      SHORTS:
        "Shorts feed",
      BROWSE:
        "Browse features",
      RELATED_VIDEO:
        "Suggested videos",
      YT_CHANNEL:
        "Channel pages",
      EXT_URL:
        "External",
      PLAYLIST:
        "Playlists",
      NOTIFICATION:
        "Notifications",
      SUBSCRIBER:
        "Subscriptions feed",
      NO_LINK_OTHER:
        "Other YouTube features",
      YT_OTHER_PAGE:
        "Other YouTube pages"
    };

  return (
    map[value] ||
    value
      .replaceAll(
        "_",
        " "
      )
      .toLowerCase()
      .replace(
        /\b\w/g,
        (char) =>
          char.toUpperCase()
      )
  );
}

function contentTypeLabel(
  value: string
) {
  if (
    value === "SHORTS"
  ) {
    return "Shorts";
  }

  if (
    value ===
    "LIVE_STREAM"
  ) {
    return "Live";
  }

  if (
    value ===
    "VIDEO_ON_DEMAND"
  ) {
    return "Videos";
  }

  return value
    .replaceAll(
      "_",
      " "
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      (char) =>
        char.toUpperCase()
    );
}

function ageLabel(
  value: string
) {
  return (
    value
      .replace(
        "age",
        ""
      )
      .replace(
        "65-",
        "65+"
      )
      .replace(
        "65plus",
        "65+"
      )
      .replace(
        "_",
        "–"
      )
      .replace(
        "-",
        "–"
      ) + " years"
  );
}

function deviceLabel(
  value: string
) {
  const map:
    Record<
      string,
      string
    > = {
      MOBILE:
        "Mobile phone",
      DESKTOP:
        "Computer",
      TV:
        "TV",
      TABLET:
        "Tablet",
      GAME_CONSOLE:
        "Game console"
    };

  return (
    map[value] ||
    value
  );
}

function creatorContentTypeToPreview(
  value: string
): YouTubePreviewContent["contentType"] {
  if (
    value === "SHORTS"
  ) {
    return "Shorts";
  }

  if (
    value ===
    "LIVE_STREAM"
  ) {
    return "Live";
  }

  return "Videos";
}

function inferContentTypeFromDuration(
  durationSeconds:
    | number
    | undefined
): YouTubePreviewContent["contentType"] {
  if (
    durationSeconds &&
    durationSeconds <= 180
  ) {
    return "Shorts";
  }

  return "Videos";
}

function overviewFromRow(
  row:
    | Record<
        string,
        string | number
      >
    | undefined
) {
  const views =
    numberValue(
      row,
      "views"
    );

  const likes =
    numberValue(
      row,
      "likes"
    );

  const comments =
    numberValue(
      row,
      "comments"
    );

  const shares =
    numberValue(
      row,
      "shares"
    );

  const subscribersNet =
    numberValue(
      row,
      "subscribersGained"
    ) -
    numberValue(
      row,
      "subscribersLost"
    );

  const interactions =
    likes +
    comments +
    shares;

  return {
    views,
    watchHours:
      numberValue(
        row,
        "estimatedMinutesWatched"
      ) / 60,
    subscribersNet,
    likes,
    comments,
    shares,
    engagementRate:
      views
        ? (interactions /
            views) *
          100
        : 0,
    averageViewDuration:
      numberValue(
        row,
        "averageViewDuration"
      ),
    averageViewPercentage:
      numberValue(
        row,
        "averageViewPercentage"
      )
  };
}

export async function getYouTubeDashboardData(
  input?: {
    from?: string;
    to?: string;
  }
): Promise<YouTubeDashboardResult> {
  const configured =
    Boolean(
      process.env
        .GOOGLE_CLIENT_ID &&
        process.env
          .GOOGLE_CLIENT_SECRET &&
        process.env
          .GOOGLE_REDIRECT_URI &&
        process.env
          .SUPABASE_URL &&
        process.env
          .SUPABASE_SECRET_KEY
    );

  if (!configured) {
    return {
      connected: false,
      configured: false,
      message:
        "YouTube OAuth environment variables are not configured yet."
    };
  }

  let accessToken:
    | string
    | null = null;

  try {
    accessToken =
      await getValidYouTubeAccessToken();
  } catch (error) {
    return {
      connected: false,
      configured: true,
      message:
        error instanceof
        Error
          ? error.message
          : "Unable to load YouTube authorization."
    };
  }

  if (!accessToken) {
    return {
      connected: false,
      configured: true,
      message:
        "YouTube has not been connected yet."
    };
  }

  const defaults =
    defaultPeriod();

  const fromDate =
    input?.from ||
    defaults.fromDate;

  const toDate =
    input?.to ||
    defaults.toDate;

  const periodDays =
    dateDiffInclusive(
      fromDate,
      toDate
    );

  const previous =
    shiftPeriodBack(
      fromDate,
      periodDays
    );

  const growthEnd =
    toDate;

  const growthStartDate =
    new Date(
      `${growthEnd}T00:00:00Z`
    );

  growthStartDate.setUTCDate(
    growthStartDate.getUTCDate() -
      364
  );

  const growthStart =
    isoDate(
      growthStartDate
    );

  const channel =
    await getMyYouTubeChannel(
      accessToken
    );

  await saveYouTubeChannelSnapshot({
    channelId:
      channel.id,
    channelName:
      channel.title,
    handle:
      channel.handle,
    channelUrl:
      channel.channelUrl,
    subscribers:
      channel.subscribers,
    totalViews:
      channel.totalViews,
    totalVideos:
      channel.totalVideos
  }).catch((error) =>
    console.warn(
      "YouTube snapshot save skipped",
      error
    )
  );

  /*
   * IMPORTANT:
   * The old dashboard built its content list from YouTube Analytics'
   * "Top videos" report, which can only return up to 200 videos.
   *
   * The new dashboard first enumerates the COMPLETE uploads playlist.
   * That list is now the source of truth for content count.
   */
  const allUploadedVideoIds =
    channel.uploadsPlaylistId
      ? await getAllUploadedVideoIds(
          accessToken,
          channel.uploadsPlaylistId
        )
      : [];

  const [
    overviewRows,
    previousRows,
    dailyRows,
    growthRows,
    trafficRows,
    contentTypeRows,
    ageRows,
    genderRows,
    deviceRows,
    countryRows,
    subscribedRows
  ] =
    await Promise.all([
      safeAnalyticsRows(
        accessToken,
        {
          startDate:
            fromDate,
          endDate:
            toDate,
          metrics:
            "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,subscribersLost,likes,comments,shares"
        }
      ),

      safeAnalyticsRows(
        accessToken,
        {
          startDate:
            previous.fromDate,
          endDate:
            previous.toDate,
          metrics:
            "views,estimatedMinutesWatched,subscribersGained,subscribersLost,likes,comments,shares"
        }
      ),

      safeAnalyticsRows(
        accessToken,
        {
          startDate:
            fromDate,
          endDate:
            toDate,
          dimensions:
            "day",
          metrics:
            "views,estimatedMinutesWatched,subscribersGained,subscribersLost,likes,comments,shares"
        }
      ),

      safeAnalyticsRows(
        accessToken,
        {
          startDate:
            growthStart,
          endDate:
            growthEnd,
          dimensions:
            "day",
          metrics:
            "views,estimatedMinutesWatched,subscribersGained,subscribersLost,likes,comments,shares"
        }
      ),

      safeAnalyticsRows(
        accessToken,
        {
          startDate:
            fromDate,
          endDate:
            toDate,
          dimensions:
            "insightTrafficSourceType",
          metrics:
            "views,estimatedMinutesWatched",
          sort:
            "-views"
        }
      ),

      safeAnalyticsRows(
        accessToken,
        {
          startDate:
            fromDate,
          endDate:
            toDate,
          dimensions:
            "creatorContentType",
          metrics:
            "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage"
        }
      ),

      safeAnalyticsRows(
        accessToken,
        {
          startDate:
            fromDate,
          endDate:
            toDate,
          dimensions:
            "ageGroup",
          metrics:
            "viewerPercentage"
        }
      ),

      safeAnalyticsRows(
        accessToken,
        {
          startDate:
            fromDate,
          endDate:
            toDate,
          dimensions:
            "gender",
          metrics:
            "viewerPercentage"
        }
      ),

      safeAnalyticsRows(
        accessToken,
        {
          startDate:
            fromDate,
          endDate:
            toDate,
          dimensions:
            "deviceType",
          metrics:
            "views,estimatedMinutesWatched",
          sort:
            "-views"
        }
      ),

      safeAnalyticsRows(
        accessToken,
        {
          startDate:
            fromDate,
          endDate:
            toDate,
          dimensions:
            "country",
          metrics:
            "views,estimatedMinutesWatched",
          sort:
            "-views",
          maxResults: 10
        }
      ),

      safeAnalyticsRows(
        accessToken,
        {
          startDate:
            fromDate,
          endDate:
            toDate,
          dimensions:
            "subscribedStatus",
          metrics:
            "views,estimatedMinutesWatched"
        }
      )
    ]);

  /*
   * Query content analytics for ALL uploaded IDs.
   *
   * The helper batches requests internally, so 437, 800, 1,500, etc.
   * videos are all processed. There is no 200-total-video dashboard cap.
   */
  let videoRows:
    Array<
      Record<
        string,
        string | number
      >
    > = [];

  let videoTypeRows:
    Array<
      Record<
        string,
        string | number
      >
    > = [];

  if (
    allUploadedVideoIds.length >
    0
  ) {
    [
      videoRows,
      videoTypeRows
    ] =
      await Promise.all([
        safeAnalyticsRowsForAllVideos(
          accessToken,
          allUploadedVideoIds,
          {
            startDate:
              fromDate,
            endDate:
              toDate,
            dimensions:
              "video",
            metrics:
              "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes,comments,shares,subscribersGained,subscribersLost"
          }
        ),

        safeAnalyticsRowsForAllVideos(
          accessToken,
          allUploadedVideoIds,
          {
            startDate:
              fromDate,
            endDate:
              toDate,
            dimensions:
              "video,creatorContentType",
            metrics:
              "views"
          }
        )
      ]);
  } else {
    /*
     * Fallback only for channels where an uploads playlist cannot be read.
     * This preserves the old behavior rather than breaking the page.
     */
    [
      videoRows,
      videoTypeRows
    ] =
      await Promise.all([
        safeAnalyticsRows(
          accessToken,
          {
            startDate:
              fromDate,
            endDate:
              toDate,
            dimensions:
              "video",
            metrics:
              "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes,comments,shares,subscribersGained,subscribersLost",
            sort:
              "-views",
            maxResults: 200
          }
        ),

        safeAnalyticsRows(
          accessToken,
          {
            startDate:
              fromDate,
            endDate:
              toDate,
            dimensions:
              "video,creatorContentType",
            metrics:
              "views",
            sort:
              "-views",
            maxResults: 200
          }
        )
      ]);
  }

  const overview =
    overviewFromRow(
      overviewRows[0]
    );

  const previousOverviewBase =
    overviewFromRow(
      previousRows[0]
    );

  const previousOverview = {
    views:
      previousOverviewBase.views,
    watchHours:
      previousOverviewBase.watchHours,
    subscribersNet:
      previousOverviewBase.subscribersNet,
    engagementRate:
      previousOverviewBase.engagementRate
  };

  const daily:
    YouTubeDailyPoint[] =
      dailyRows.map(
        (row) => ({
          date:
            String(
              row.day ||
                ""
            ),
          views:
            numberValue(
              row,
              "views"
            ),
          watchMinutes:
            numberValue(
              row,
              "estimatedMinutesWatched"
            ),
          subscribersGained:
            numberValue(
              row,
              "subscribersGained"
            ),
          subscribersLost:
            numberValue(
              row,
              "subscribersLost"
            ),
          likes:
            numberValue(
              row,
              "likes"
            ),
          comments:
            numberValue(
              row,
              "comments"
            ),
          shares:
            numberValue(
              row,
              "shares"
            )
        })
      );

  const growthDaily:
    YouTubeDailyPoint[] =
      growthRows.map(
        (row) => ({
          date:
            String(
              row.day ||
                ""
            ),
          views:
            numberValue(
              row,
              "views"
            ),
          watchMinutes:
            numberValue(
              row,
              "estimatedMinutesWatched"
            ),
          subscribersGained:
            numberValue(
              row,
              "subscribersGained"
            ),
          subscribersLost:
            numberValue(
              row,
              "subscribersLost"
            ),
          likes:
            numberValue(
              row,
              "likes"
            ),
          comments:
            numberValue(
              row,
              "comments"
            ),
          shares:
            numberValue(
              row,
              "shares"
            )
        })
      );

  const trafficTotal =
    trafficRows.reduce(
      (sum, row) =>
        sum +
        numberValue(
          row,
          "views"
        ),
      0
    );

  const trafficSources =
    trafficRows
      .slice(
        0,
        7
      )
      .map((row) => {
        const views =
          numberValue(
            row,
            "views"
          );

        return {
          label:
            trafficSourceLabel(
              String(
                row.insightTrafficSourceType ||
                  "OTHER"
              )
            ),
          views,
          percentage:
            trafficTotal
              ? (views /
                  trafficTotal) *
                100
              : 0
        };
      });

  const contentTotal =
    contentTypeRows.reduce(
      (sum, row) =>
        sum +
        numberValue(
          row,
          "views"
        ),
      0
    );

  const contentTypes =
    contentTypeRows.map(
      (row) => {
        const views =
          numberValue(
            row,
            "views"
          );

        return {
          label:
            contentTypeLabel(
              String(
                row.creatorContentType ||
                  "OTHER"
              )
            ),
          views,
          percentage:
            contentTotal
              ? (views /
                  contentTotal) *
                100
              : 0
        };
      }
    );

  const ages =
    ageRows.map(
      (row) => ({
        label:
          ageLabel(
            String(
              row.ageGroup ||
                ""
            )
          ),
        percentage:
          numberValue(
            row,
            "viewerPercentage"
          )
      })
    );

  const genders =
    genderRows.map(
      (row) => ({
        label:
          String(
            row.gender ||
              "Unknown"
          ),
        percentage:
          numberValue(
            row,
            "viewerPercentage"
          )
      })
    );

  const deviceTotal =
    deviceRows.reduce(
      (sum, row) =>
        sum +
        numberValue(
          row,
          "views"
        ),
      0
    );

  const devices =
    deviceRows.map(
      (row) => {
        const views =
          numberValue(
            row,
            "views"
          );

        return {
          label:
            deviceLabel(
              String(
                row.deviceType ||
                  "OTHER"
              )
            ),
          views,
          percentage:
            deviceTotal
              ? (views /
                  deviceTotal) *
                100
              : 0
        };
      }
    );

  const countryTotal =
    countryRows.reduce(
      (sum, row) =>
        sum +
        numberValue(
          row,
          "views"
        ),
      0
    );

  const geographies =
    countryRows.map(
      (row) => {
        const views =
          numberValue(
            row,
            "views"
          );

        return {
          label:
            String(
              row.country ||
                "Unknown"
            ),
          views,
          percentage:
            countryTotal
              ? (views /
                  countryTotal) *
                100
              : 0
        };
      }
    );

  const subscribedTotal =
    subscribedRows.reduce(
      (sum, row) =>
        sum +
        numberValue(
          row,
          "estimatedMinutesWatched"
        ),
      0
    );

  const subscribedStatus =
    subscribedRows.map(
      (row) => {
        const watchMinutes =
          numberValue(
            row,
            "estimatedMinutesWatched"
          );

        return {
          label:
            String(
              row.subscribedStatus ||
                "UNKNOWN"
            ),
          watchMinutes,
          percentage:
            subscribedTotal
              ? (watchMinutes /
                  subscribedTotal) *
                100
              : 0
        };
      }
    );

  const typeByVideo =
    new Map<
      string,
      string
    >();

  for (
    const row of
      videoTypeRows
  ) {
    const videoId =
      String(
        row.video || ""
      );

    const creatorContentType =
      String(
        row.creatorContentType ||
          ""
      );

    if (
      videoId &&
      creatorContentType
    ) {
      typeByVideo.set(
        videoId,
        creatorContentType
      );
    }
  }

  /*
   * Build an analytics lookup so uploads that have no Analytics row
   * yet are still shown in All Content with 0 pending metrics.
   */
  const analyticsByVideo =
    new Map<
      string,
      Record<
        string,
        string | number
      >
    >();

  for (
    const row of
      videoRows
  ) {
    const videoId =
      String(
        row.video || ""
      );

    if (videoId) {
      analyticsByVideo.set(
        videoId,
        row
      );
    }
  }

  const contentVideoIds =
    allUploadedVideoIds.length
      ? allUploadedVideoIds
      : videoRows
          .map(
            (row) =>
              String(
                row.video ||
                  ""
              )
          )
          .filter(Boolean);

  const metadata =
    await getVideoMetadata(
      accessToken,
      contentVideoIds
    );

  /*
   * COMPLETE CONTENT LIST:
   * source = uploads playlist, not Top-200 Analytics report.
   */
  const content:
    YouTubePreviewContent[] =
      contentVideoIds.map(
        (id) => {
          const row =
            analyticsByVideo.get(
              id
            );

          const meta =
            metadata.get(id);

          const contentTypeFromAnalytics =
            typeByVideo.get(
              id
            );

          const contentType =
            contentTypeFromAnalytics
              ? creatorContentTypeToPreview(
                  contentTypeFromAnalytics
                )
              : inferContentTypeFromDuration(
                  meta?.durationSeconds
                );

          return {
            id,
            title:
              meta?.title ||
              id,
            publishedAt:
              meta?.publishedAt ||
              `${fromDate}T00:00:00Z`,
            views:
              numberValue(
                row,
                "views"
              ),
            likes:
              numberValue(
                row,
                "likes"
              ),
            comments:
              numberValue(
                row,
                "comments"
              ),
            shares:
              numberValue(
                row,
                "shares"
              ),
            avgViewDuration:
              formatDuration(
                numberValue(
                  row,
                  "averageViewDuration"
                )
              ),
            avgViewed:
              numberValue(
                row,
                "averageViewPercentage"
              ),
            permalink:
              meta?.permalink ||
              `https://www.youtube.com/watch?v=${id}`,
            contentType
          };
        }
      );

  return {
    connected: true,
    channel,
    fromDate,
    toDate,
    overview,
    previousOverview,
    daily,
    growthDaily,
    trafficSources,
    contentTypes,
    ages,
    genders,
    devices,
    geographies,
    subscribedStatus,
    content
  };
}
