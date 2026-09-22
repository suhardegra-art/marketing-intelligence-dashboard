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

import {
  sendManyChatInstagramText
} from "@/lib/manychat";

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

type CommentRow = {
  id: string;
  platform: string;
  status: string;
  platform_comment_id: string;
};

type ReplyRow = {
  id: string;
  final_reply: string | null;
  sent_at: string | null;
};

async function getDispatchContext(commentId: string) {
  const [comments, replies, activity] = await Promise.all([
    autoReplySupabaseRequest(
      `/rest/v1/social_comments?id=eq.${encodeURIComponent(
        commentId
      )}&select=id,platform,status,platform_comment_id&limit=1`
    ) as Promise<CommentRow[]>,
    autoReplySupabaseRequest(
      `/rest/v1/social_comment_replies?comment_id=eq.${encodeURIComponent(
        commentId
      )}&select=id,final_reply,sent_at&order=updated_at.desc&limit=1`
    ) as Promise<ReplyRow[]>,
    autoReplySupabaseRequest(
      `/rest/v1/social_comment_activity?comment_id=eq.${encodeURIComponent(
        commentId
      )}&select=action,note,created_at&order=created_at.desc&limit=50`
    ) as Promise<
      Array<{
        action: string;
        note: string | null;
        created_at: string;
      }>
    >
  ]);

  return {
    comment: comments[0] || null,
    reply: replies[0] || null,
    activity
  };
}

function extractManyChatContactId(
  activity: Array<{
    action: string;
    note: string | null;
  }>,
  platformCommentId?: string | null
) {
  for (const item of activity) {
    const note = item.note || "";
    const match = note.match(
      /ManyChat contact:\s*([0-9]+)/i
    );

    if (match?.[1]) {
      return match[1];
    }
  }

  if (platformCommentId) {
    const fallback = platformCommentId.match(
      /^manychat-([0-9]+)-/i
    );

    if (fallback?.[1]) {
      return fallback[1];
    }
  }

  return null;
}

async function markSendFailure(
  commentId: string,
  errorMessage: string
) {
  await Promise.all([
    autoReplySupabaseRequest(
      `/rest/v1/social_comment_replies?comment_id=eq.${encodeURIComponent(
        commentId
      )}`,
      {
        method: "PATCH",
        headers: {
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          error_message: errorMessage,
          updated_at: new Date().toISOString()
        })
      }
    ),
    autoReplySupabaseRequest(
      `/rest/v1/social_comments?id=eq.${encodeURIComponent(
        commentId
      )}`,
      {
        method: "PATCH",
        headers: {
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          status: "PENDING_APPROVAL",
          updated_at: new Date().toISOString()
        })
      }
    )
  ]);

  await writeAutoReplyActivity(
    commentId,
    "SEND_FAILED",
    "ManyChat Dispatcher",
    errorMessage
  );
}

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
      { error: "Unauthorized" },
      { status: 401 }
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
        { status: 400 }
      );
    }

    const actor = "Dashboard User";

    if (body.action === "approve") {
      const finalReply =
        body.finalReply?.trim();

      if (!finalReply) {
        return NextResponse.json(
          {
            error:
              "Reply text cannot be empty."
          },
          { status: 400 }
        );
      }

      const context =
        await getDispatchContext(
          body.commentId
        );

      if (!context.comment) {
        return NextResponse.json(
          {
            error:
              "Comment record was not found."
          },
          { status: 404 }
        );
      }

      if (context.reply?.sent_at) {
        return NextResponse.json({
          ok: true,
          alreadySent: true,
          action: "approve",
          commentId: body.commentId
        });
      }

      if (
        context.comment.platform !==
        "instagram"
      ) {
        return NextResponse.json(
          {
            error:
              `ManyChat dispatcher currently supports Instagram only. Platform: ${context.comment.platform}`
          },
          { status: 400 }
        );
      }

      const manyChatContactId =
        extractManyChatContactId(
          context.activity,
          context.comment.platform_comment_id
        );

      if (!manyChatContactId) {
        return NextResponse.json(
          {
            error:
              "ManyChat contact ID is still missing. Run the same contact through the ManyChat External Request again after installing the contact-link fix."
          },
          { status: 400 }
        );
      }

      await autoReplySupabaseRequest(
        `/rest/v1/social_comment_replies?comment_id=eq.${encodeURIComponent(
          body.commentId
        )}`,
        {
          method: "PATCH",
          headers: {
            Prefer: "return=minimal"
          },
          body: JSON.stringify({
            final_reply: finalReply,
            approved_by: actor,
            approved_at: new Date().toISOString(),
            error_message: null,
            updated_at: new Date().toISOString()
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
            Prefer: "return=minimal"
          },
          body: JSON.stringify({
            status: "APPROVED",
            updated_at: new Date().toISOString()
          })
        }
      );

      await writeAutoReplyActivity(
        body.commentId,
        "APPROVED",
        actor,
        body.note ||
          "Exact reply approved for immediate ManyChat dispatch."
      );

      try {
        await sendManyChatInstagramText(
          manyChatContactId,
          finalReply
        );
      } catch (sendError) {
        const message =
          sendError instanceof Error
            ? sendError.message
            : "Unable to send through ManyChat.";

        await markSendFailure(
          body.commentId,
          message
        );

        return NextResponse.json(
          {
            error:
              `Approved, but ManyChat send failed: ${message}`
          },
          { status: 502 }
        );
      }

      const sentAt =
        new Date().toISOString();

      await autoReplySupabaseRequest(
        `/rest/v1/social_comment_replies?comment_id=eq.${encodeURIComponent(
          body.commentId
        )}`,
        {
          method: "PATCH",
          headers: {
            Prefer: "return=minimal"
          },
          body: JSON.stringify({
            sent_at: sentAt,
            error_message: null,
            updated_at: sentAt
          })
        }
      );

      await writeAutoReplyActivity(
        body.commentId,
        "SENT",
        "ManyChat Dispatcher",
        `Approved reply sent to ManyChat contact ${manyChatContactId}.`
      );

      return NextResponse.json({
        ok: true,
        sent: true,
        action: body.action,
        commentId: body.commentId,
        sentAt
      });
    }

    if (body.action === "reject") {
      await autoReplySupabaseRequest(
        `/rest/v1/social_comments?id=eq.${encodeURIComponent(
          body.commentId
        )}`,
        {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            status: "REJECTED",
            updated_at: new Date().toISOString()
          })
        }
      );

      await autoReplySupabaseRequest(
        `/rest/v1/social_comment_replies?comment_id=eq.${encodeURIComponent(
          body.commentId
        )}`,
        {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            rejected_reason:
              body.note ||
              "Rejected by reviewer.",
            updated_at: new Date().toISOString()
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

    if (body.action === "escalate") {
      await autoReplySupabaseRequest(
        `/rest/v1/social_comments?id=eq.${encodeURIComponent(
          body.commentId
        )}`,
        {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            status: "ESCALATED",
            updated_at: new Date().toISOString()
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

    if (body.action === "ignore") {
      await autoReplySupabaseRequest(
        `/rest/v1/social_comments?id=eq.${encodeURIComponent(
          body.commentId
        )}`,
        {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            status: "IGNORED",
            updated_at: new Date().toISOString()
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
      action: body.action,
      commentId: body.commentId
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
      { status: 500 }
    );
  }
}
