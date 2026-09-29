export type YouTubeChannel = {
  id: string;
  title: string;
  handle: string | null;
  channelUrl: string;
  thumbnailUrl: string | null;
  subscribers: number;
  totalViews: number;
  totalVideos: number;
  uploadsPlaylistId: string | null;
};

export type YouTubeVideoMetadata = {
  id: string;
  title: string;
  publishedAt: string;
  permalink: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
};

type AnalyticsReport = {
  columnHeaders?: Array<{ name: string }>;
  rows?: Array<Array<string | number>>;
};

type AnalyticsQueryInput = {
  startDate: string;
  endDate: string;
  metrics: string;
  dimensions?: string;
  filters?: string;
  sort?: string;
  maxResults?: number;
  startIndex?: number;
};

function authHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`
  };
}

async function fetchJson<T>(
  url: string,
  accessToken: string
): Promise<T> {
  const response = await fetch(url, {
    headers: authHeaders(accessToken),
    cache: "no-store"
  });

  const body = await response.text();
  let payload: any = {};

  try {
    payload = body ? JSON.parse(body) : {};
  } catch {
    throw new Error(
      `YouTube API returned a non-JSON response (${response.status}).`
    );
  }

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.error?.errors?.[0]?.message ||
      `YouTube API error ${response.status}`;

    throw new Error(message);
  }

  return payload as T;
}

export async function getMyYouTubeChannel(
  accessToken: string
): Promise<YouTubeChannel> {
  const params = new URLSearchParams({
    part: "snippet,statistics,contentDetails",
    mine: "true"
  });

  const payload = await fetchJson<{
    items?: Array<{
      id: string;
      snippet?: {
        title?: string;
        customUrl?: string;
        thumbnails?: {
          high?: { url?: string };
          default?: { url?: string };
        };
      };
      statistics?: {
        subscriberCount?: string;
        viewCount?: string;
        videoCount?: string;
      };
      contentDetails?: {
        relatedPlaylists?: {
          uploads?: string;
        };
      };
    }>;
  }>(
    `https://www.googleapis.com/youtube/v3/channels?${params.toString()}`,
    accessToken
  );

  const item = payload.items?.[0];

  if (!item) {
    throw new Error(
      "No YouTube channel is available for this Google account."
    );
  }

  const customUrl =
    item.snippet?.customUrl || null;

  return {
    id: item.id,
    title:
      item.snippet?.title ||
      "YouTube Channel",
    handle: customUrl,
    channelUrl: customUrl
      ? `https://www.youtube.com/${customUrl}`
      : `https://www.youtube.com/channel/${item.id}`,
    thumbnailUrl:
      item.snippet?.thumbnails?.high?.url ||
      item.snippet?.thumbnails?.default?.url ||
      null,
    subscribers: Number(
      item.statistics?.subscriberCount || 0
    ),
    totalViews: Number(
      item.statistics?.viewCount || 0
    ),
    totalVideos: Number(
      item.statistics?.videoCount || 0
    ),
    uploadsPlaylistId:
      item.contentDetails
        ?.relatedPlaylists
        ?.uploads || null
  };
}

/*
 * Fetch EVERY current upload from the channel uploads playlist.
 *
 * YouTube Data API limits one playlistItems request to 50 items,
 * so this function keeps following nextPageToken until there are
 * no more pages. There is intentionally no dashboard-level content cap.
 */
export async function getAllUploadedVideoIds(
  accessToken: string,
  uploadsPlaylistId: string
): Promise<string[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;

  do {
    const params =
      new URLSearchParams({
        part: "contentDetails",
        playlistId:
          uploadsPlaylistId,
        maxResults: "50"
      });

    if (pageToken) {
      params.set(
        "pageToken",
        pageToken
      );
    }

    const payload =
      await fetchJson<{
        nextPageToken?: string;
        items?: Array<{
          contentDetails?: {
            videoId?: string;
          };
        }>;
      }>(
        `https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`,
        accessToken
      );

    for (
      const item of
        payload.items || []
    ) {
      const videoId =
        item.contentDetails
          ?.videoId;

      if (videoId) {
        ids.push(videoId);
      }
    }

    pageToken =
      payload.nextPageToken;
  } while (pageToken);

  /*
   * Preserve uploads-playlist order while removing any accidental duplicate.
   */
  return Array.from(
    new Set(ids)
  );
}

function parseISODuration(
  value: string | undefined
) {
  if (!value) return 0;

  const match =
    value.match(
      /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
    );

  if (!match) return 0;

  return (
    Number(match[1] || 0) *
      3600 +
    Number(match[2] || 0) *
      60 +
    Number(match[3] || 0)
  );
}

export async function getVideoMetadata(
  accessToken: string,
  videoIds: string[]
): Promise<
  Map<
    string,
    YouTubeVideoMetadata
  >
> {
  const output =
    new Map<
      string,
      YouTubeVideoMetadata
    >();

  /*
   * videos.list supports up to 50 IDs per call.
   * Iterate until EVERY supplied video ID has been requested.
   */
  for (
    let index = 0;
    index < videoIds.length;
    index += 50
  ) {
    const batch =
      videoIds.slice(
        index,
        index + 50
      );

    if (
      batch.length === 0
    ) {
      continue;
    }

    const params =
      new URLSearchParams({
        part:
          "snippet,contentDetails",
        id: batch.join(",")
      });

    const payload =
      await fetchJson<{
        items?: Array<{
          id: string;
          snippet?: {
            title?: string;
            publishedAt?: string;
            thumbnails?: {
              medium?: {
                url?: string;
              };
              default?: {
                url?: string;
              };
            };
          };
          contentDetails?: {
            duration?: string;
          };
        }>;
      }>(
        `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`,
        accessToken
      );

    for (
      const item of
        payload.items || []
    ) {
      output.set(
        item.id,
        {
          id: item.id,
          title:
            item.snippet
              ?.title ||
            "Untitled video",
          publishedAt:
            item.snippet
              ?.publishedAt ||
            "",
          permalink:
            `https://www.youtube.com/watch?v=${item.id}`,
          thumbnailUrl:
            item.snippet
              ?.thumbnails
              ?.medium?.url ||
            item.snippet
              ?.thumbnails
              ?.default?.url ||
            null,
          durationSeconds:
            parseISODuration(
              item.contentDetails
                ?.duration
            )
        }
      );
    }
  }

  return output;
}

export async function queryYouTubeAnalytics(
  accessToken: string,
  input: AnalyticsQueryInput
) {
  const params =
    new URLSearchParams({
      ids: "channel==MINE",
      startDate:
        input.startDate,
      endDate:
        input.endDate,
      metrics: input.metrics
    });

  if (input.dimensions) {
    params.set(
      "dimensions",
      input.dimensions
    );
  }

  if (input.filters) {
    params.set(
      "filters",
      input.filters
    );
  }

  if (input.sort) {
    params.set(
      "sort",
      input.sort
    );
  }

  if (input.maxResults) {
    params.set(
      "maxResults",
      String(
        input.maxResults
      )
    );
  }

  if (input.startIndex) {
    params.set(
      "startIndex",
      String(
        input.startIndex
      )
    );
  }

  return fetchJson<AnalyticsReport>(
    `https://youtubeanalytics.googleapis.com/v2/reports?${params.toString()}`,
    accessToken
  );
}

export function analyticsRowsToObjects(
  report: AnalyticsReport
) {
  const headers =
    report.columnHeaders?.map(
      (header) =>
        header.name
    ) || [];

  return (
    report.rows || []
  ).map((row) => {
    const result:
      Record<
        string,
        string | number
      > = {};

    headers.forEach(
      (
        header,
        index
      ) => {
        result[header] =
          row[index] ?? 0;
      }
    );

    return result;
  });
}

export async function safeAnalyticsRows(
  accessToken: string,
  input: AnalyticsQueryInput
) {
  try {
    const report =
      await queryYouTubeAnalytics(
        accessToken,
        input
      );

    return analyticsRowsToObjects(
      report
    );
  } catch (error) {
    console.warn(
      "YouTube Analytics query skipped",
      input,
      error
    );

    return [] as Array<
      Record<
        string,
        string | number
      >
    >;
  }
}

function combineFilters(
  current:
    | string
    | undefined,
  additional: string
) {
  return current
    ? `${current};${additional}`
    : additional;
}

/*
 * YouTube's generic Analytics filter accepts multiple video IDs.
 *
 * Instead of using the "Top videos" report (which is capped at 200),
 * this helper:
 *   1. starts from the COMPLETE uploads playlist,
 *   2. splits video IDs into API-safe batches,
 *   3. filters Analytics to those exact IDs,
 *   4. joins every batch into one result.
 *
 * The 200 below is ONLY the size of one API request.
 * It is NOT a total-content limit: the loop continues until all IDs
 * have been queried.
 */
export async function safeAnalyticsRowsForAllVideos(
  accessToken: string,
  videoIds: string[],
  input: Omit<
    AnalyticsQueryInput,
    "filters" | "maxResults"
  > & {
    filters?: string;
  }
) {
  const allRows: Array<
    Record<
      string,
      string | number
    >
  > = [];

  const batchSize = 200;

  for (
    let index = 0;
    index < videoIds.length;
    index += batchSize
  ) {
    const batch =
      videoIds.slice(
        index,
        index + batchSize
      );

    if (
      batch.length === 0
    ) {
      continue;
    }

    const rows =
      await safeAnalyticsRows(
        accessToken,
        {
          ...input,
          filters:
            combineFilters(
              input.filters,
              `video==${batch.join(
                ","
              )}`
            ),
          /*
           * maxResults covers the current API batch only.
           * Further batches continue automatically.
           */
          maxResults:
            batch.length
        }
      );

    allRows.push(
      ...rows
    );
  }

  return allRows;
}
