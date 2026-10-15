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

    return {
      mediaViews: insightValue(payload, "post_media_view"),
      clicks: insightValue(payload, "post_clicks"),
      reactionsByType:
        insightValue(payload, "post_reactions_by_type_total")
    };
  } catch (error) {
    return {
      mediaViews: null,
      clicks: null,
      reactionsByType: null,
      insightError:
        error instanceof Error
          ? error.message
          : "Unable to fetch post insights."
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { facebookPageId } = metaConfig();

    const from = request.nextUrl.searchParams.get("from");
    const to = request.nextUrl.searchParams.get("to");
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
        limit
      },
      {},
      "facebook"
    );

    const posts: FacebookPost[] = Array.isArray(postsPayload?.data)
      ? postsPayload.data
      : [];

    const enriched = await Promise.all(
      posts.map(async (post) => ({
        ...post,
        reactions:
          post.reactions?.summary?.total_count ?? 0,
        comments:
          post.comments?.summary?.total_count ?? 0,
        shares: post.shares?.count ?? 0,
        insights: await postInsights(post.id)
      }))
    );

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
