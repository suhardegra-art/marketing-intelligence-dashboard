import { NextRequest, NextResponse } from "next/server";
import { metaConfig, metaGraph, unixDate, publicMetaPaging } from "@/lib/meta-graph";

export const dynamic = "force-dynamic";

type Media = {
  id: string;
  caption?: string;
  media_type?: string;
  media_product_type?: string;
  permalink?: string;
  timestamp?: string;
  like_count?: number;
  comments_count?: number;
  thumbnail_url?: string;
};

function insightValue(payload: any, metric: string) {
  const row = payload?.data?.find((item: any) => item?.name === metric);

  if (!row) return null;

  if (row.total_value && typeof row.total_value.value === "number") {
    return row.total_value.value;
  }

  const values = row.values;

  if (Array.isArray(values) && values.length) {
    const last = values[values.length - 1];
    return typeof last?.value === "number" ? last.value : null;
  }

  return null;
}

async function mediaInsights(media: Media) {
  const product = media.media_product_type || media.media_type || "FEED";

  const metrics =
    product === "STORY"
      ? "views,reach,shares,total_interactions"
      : "views,reach,likes,comments,saved,shares,total_interactions";

  try {
    const payload = await metaGraph<any>(
      `/${media.id}/insights`,
      { metric: metrics }
    );

    return {
      views: insightValue(payload, "views"),
      reach: insightValue(payload, "reach"),
      likes:
        insightValue(payload, "likes") ??
        media.like_count ??
        0,
      comments:
        insightValue(payload, "comments") ??
        media.comments_count ??
        0,
      saves: insightValue(payload, "saved"),
      shares: insightValue(payload, "shares"),
      totalInteractions:
        insightValue(payload, "total_interactions")
    };
  } catch (error) {
    return {
      views: null,
      reach: null,
      likes: media.like_count ?? 0,
      comments: media.comments_count ?? 0,
      saves: null,
      shares: null,
      totalInteractions: null,
      insightError:
        error instanceof Error
          ? error.message
          : "Unable to fetch media insights."
    };
  }
}


// Avoid bursts of dozens of simultaneous Insights requests to Meta.
async function mapConcurrent<T, U>(items: T[], max: number, mapper: (item: T) => Promise<U>): Promise<U[]> {
  const result: U[] = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(max, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      result[index] = await mapper(items[index]);
    }
  }));
  return result;
}

export async function GET(request: NextRequest) {
  try {
    const { instagramUserId } = metaConfig();

    const after = request.nextUrl.searchParams.get("after");
    const from = request.nextUrl.searchParams.get("from");
    const to = request.nextUrl.searchParams.get("to");
    if (after && (after.length > 2048 || /[\x00-\x20]/.test(after))) {
      return NextResponse.json({ ok: false, error: "Invalid pagination cursor." }, { status: 400 });
    }
    const limit = Math.min(
      50,
      Math.max(
        1,
        Number(request.nextUrl.searchParams.get("limit") || "25")
      )
    );

    const account = await metaGraph<any>(
      `/${instagramUserId}`,
      {
        fields:
          "id,username,name,followers_count,media_count,profile_picture_url"
      }
    );

    const mediaPayload = await metaGraph<any>(
      `/${instagramUserId}/media`,
      {
        fields:
          "id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count,thumbnail_url",
        limit,
        after: after || undefined
      }
    );

    let media: Media[] = Array.isArray(mediaPayload?.data)
      ? mediaPayload.data
      : [];

    if (from || to) {
      const fromMs = from
        ? new Date(`${from}T00:00:00Z`).getTime()
        : -Infinity;
      const toMs = to
        ? new Date(`${to}T23:59:59Z`).getTime()
        : Infinity;

      media = media.filter((item) => {
        const time = item.timestamp
          ? new Date(item.timestamp).getTime()
          : 0;

        return time >= fromMs && time <= toMs;
      });
    }

    const enriched = await mapConcurrent(media, 5, async (item) => ({
        ...item,
        insights: await mediaInsights(item)
      }));

    let accountInsights: any = null;

    try {
      accountInsights = await metaGraph<any>(
        `/${instagramUserId}/insights`,
        {
          metric:
            "views,reach,total_interactions,profile_links_taps,follows_and_unfollows",
          period: "day",
          metric_type: "total_value",
          since: unixDate(from),
          until: unixDate(to)
        }
      );
    } catch (error) {
      accountInsights = {
        data: [],
        warning:
          error instanceof Error
            ? error.message
            : "Unable to fetch account insights."
      };
    }

    return NextResponse.json({
      ok: true,
      account,
      accountInsights: {
        data: Array.isArray(accountInsights?.data) ? accountInsights.data : [],
        ...(accountInsights?.warning ? { warning: accountInsights.warning } : {})
      },
      media: enriched,
      paging: publicMetaPaging(mediaPayload?.paging)
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load Instagram data."
      },
      { status: 500 }
    );
  }
}
