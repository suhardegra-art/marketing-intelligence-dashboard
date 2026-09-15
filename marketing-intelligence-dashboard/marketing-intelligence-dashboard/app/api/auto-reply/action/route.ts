import {
  NextRequest,
  NextResponse
} from "next/server";

import {
  verifySessionToken
} from "@/lib/session";

import {
  autoReplySupabaseRequest,
  writeAutoReplyActivity
} from "@/lib/auto-reply-comments";

type ActionName =
  | "approve"
  | "reject"
  | "escalate"
  | "ignore";

type RequestBody = {
  commentId?: string;
  action?: ActionName;
  finalReply?: string;
  note?: string;
};

export async function POST(
  request: NextRequest
) {
  const token =
    request.cookies.get(
      "mi_session"
    )?.value;

  const authenticated =
    await verifySessionToken(
      token,
      process.env.SESSION_SECRET
    );

  if (!authenticated) {
    return NextResponse.json(
      {
        error: "Unauthorized"
      },
      {
        status: 401
      }
    );
  }

  try {
    const body =
      (await request.json()) as RequestBody;

    if (
      !body.commentId ||
      !body.action
    ) {
      return NextResponse.json(
        {
          error:
            "commentId and action are required."
        },
        {
          status: 400
        }
      );
    }

    const actor =
      "Dashboard User";

    if (
      body.action ===
      "approve"
    ) {
      const finalReply =
        body.finalReply?.trim();

      if (!finalReply) {
        return NextResponse.json(
          {
            error:
              "Reply text cannot be empty."
          },
          {
            status: 400
          }
        );
      }

      await autoReplySupabaseRequest(
        `/rest/v1/social_comment_replies?comment_id=eq.${encodeURIComponent(
          body.commentId
        )}`,
        {
          method: "PATCH",
          headers: {
            Prefer:
              "return=minimal"
          },
          body:
            JSON.stringify({
              final_reply:
                finalReply,
              approved_by:
                actor,
              approved_at:
                new Date().toISOString(),
              updated_at:
                new Date().toISOString()
            })
        }
      );

      await autoReplySupabaseRequest(
        `/rest/v1/social_comments?id=eq.${encodeURIComponent(
          body.commentId
        )}`,
        {
          method: "PATCH",
          headers: {
            Prefer:
              "return=minimal"
          },
          body:
            JSON.stringify({
              status:
                "APPROVED",
              updated_at:
                new Date().toISOString()
            })
        }
      );

      await writeAutoReplyActivity(
        body.commentId,
        "APPROVED",
        actor,
        body.note ||
          "Reply approved and queued for dispatcher."
      );
    }

    if (
      body.action ===
      "reject"
    ) {
      await autoReplySupabaseRequest(
        `/rest/v1/social_comments?id=eq.${encodeURIComponent(
          body.commentId
        )}`,
        {
          method: "PATCH",
          headers: {
            Prefer:
              "return=minimal"
          },
          body:
            JSON.stringify({
              status:
                "REJECTED",
              updated_at:
                new Date().toISOString()
            })
        }
      );

      await autoReplySupabaseRequest(
        `/rest/v1/social_comment_replies?comment_id=eq.${encodeURIComponent(
          body.commentId
        )}`,
        {
          method: "PATCH",
          headers: {
            Prefer:
              "return=minimal"
          },
          body:
            JSON.stringify({
              rejected_reason:
                body.note ||
                "Rejected by reviewer.",
              updated_at:
                new Date().toISOString()
            })
        }
      );

      await writeAutoReplyActivity(
        body.commentId,
        "REJECTED",
        actor,
        body.note ||
          "AI draft rejected."
      );
    }

    if (
      body.action ===
      "escalate"
    ) {
      await autoReplySupabaseRequest(
        `/rest/v1/social_comments?id=eq.${encodeURIComponent(
          body.commentId
        )}`,
        {
          method: "PATCH",
          headers: {
            Prefer:
              "return=minimal"
          },
          body:
            JSON.stringify({
              status:
                "ESCALATED",
              updated_at:
                new Date().toISOString()
            })
        }
      );

      await writeAutoReplyActivity(
        body.commentId,
        "ESCALATED",
        actor,
        body.note ||
          "Escalated for human handling."
      );
    }

    if (
      body.action ===
      "ignore"
    ) {
      await autoReplySupabaseRequest(
        `/rest/v1/social_comments?id=eq.${encodeURIComponent(
          body.commentId
        )}`,
        {
          method: "PATCH",
          headers: {
            Prefer:
              "return=minimal"
          },
          body:
            JSON.stringify({
              status:
                "IGNORED",
              updated_at:
                new Date().toISOString()
            })
        }
      );

      await writeAutoReplyActivity(
        body.commentId,
        "IGNORED",
        actor,
        body.note ||
          "Comment intentionally ignored."
      );
    }

    return NextResponse.json({
      ok: true,
      action:
        body.action,
      commentId:
        body.commentId
    });
  } catch (error) {
    console.error(
      "Auto reply approval action error",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update comment."
      },
      {
        status: 500
      }
    );
  }
}
