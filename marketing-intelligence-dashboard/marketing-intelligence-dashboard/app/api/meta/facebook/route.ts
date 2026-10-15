import { NextRequest, NextResponse } from "next/server";
import { metaConfig, metaGraph, publicMetaPaging } from "@/lib/meta-graph";

export const dynamic = "force-dynamic";

type FacebookPost = {
  id: string;
  message?: string;
  created_time?: string;
  permalink_url?: string;
  shares?: { count?: number };
  comments?: { summary?: { total_count?: number } };
  reactions?: { summary?: { total_count?: number } };
};

function insightValue(payload: any, metric: string) {
  const row = payload?.data?.find((item: any) => item?.name === metric);
  if (!row) return null;

  const values = row.values;
  if (Array.isArray(values) && values.length) {
    const last = values[values.length - 1];
    if (typeof last?.value === "number") return last.value;
    if (last?.value && typeof last.value === "object") return last.value;
  }

  return null;
}

async function postInsights(postId: string) {
  try {
    const payload = await metaGraph<any>(
      `/${postId}/insights`,
      {
        metric:
          "post_media_view,post_clicks,post_reactions_by_type_total"
      },
      {},
      "facebook"
    );

    // Unique Media Viewers replaces the deprecated Facebook reach metric.
    // Query separately so an unsupported metric cannot break media views/clicks.
    let uniqueViewers: number | null = null;
    try {
      const viewersPayload = await metaGraph<any>(
        `/${postId}/insights`,
        { metric: "post_total_media_view_unique" },
        {},
        "facebook"
      );
      uniqueViewers = insightValue(viewersPayload, "post_total_media_view_unique");
    } catch { /* Unsupported/permission-limited; preserve other metrics. */ }

    return {
      mediaViews: insightValue(payload, "post_media_view"),
      uniqueViewers,
      clicks: insightValue(payload, "post_clicks"),
      reactionsByType:
        insightValue(payload, "post_reactions_by_type_total")
    };
  } catch (error) {
    return {
      mediaViews: null,
      uniqueViewers: null,
      clicks: null,
      reactionsByType: null,
      insightError:
        error instanceof Error
          ? error.message
          : "Unable to fetch post insights."
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
    const { facebookPageId } = metaConfig();

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

    const page = await metaGraph<any>(
      `/${facebookPageId}`,
      {
        fields:
          "id,name,link,fan_count,followers_count,picture.type(large)"
      },
      {},
      "facebook"
    );

    const postsPayload = await metaGraph<any>(
      `/${facebookPageId}/posts`,
      {
        fields:
          "id,message,created_time,permalink_url,shares,comments.limit(0).summary(true),reactions.limit(0).summary(true)",
        since: from || undefined,
        until: to || undefined,
        limit,
        after: after || undefined
      },
      {},
      "facebook"
    );

    const posts: FacebookPost[] = Array.isArray(postsPayload?.data)
      ? postsPayload.data
      : [];

    const enriched = await mapConcurrent(posts, 5, async (post) => ({
        ...post,
        reactions:
          post.reactions?.summary?.total_count ?? 0,
        comments:
          post.comments?.summary?.total_count ?? 0,
        shares: post.shares?.count ?? 0,
        insights: await postInsights(post.id)
      }));

    return NextResponse.json({
      ok: true,
      page,
      posts: enriched,
      paging: publicMetaPaging(postsPayload?.paging)
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load Facebook data."
      },
      { status: 500 }
    );
  }
}
