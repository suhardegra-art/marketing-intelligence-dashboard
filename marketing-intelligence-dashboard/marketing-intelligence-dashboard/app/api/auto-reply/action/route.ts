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
  generateCustomerServiceDraft,
  type AutoReplyConversationTurn
} from "@/lib/auto-reply-ai";

import {
  sendManyChatInstagramText
} from "@/lib/manychat";

type ActionName =
  | "approve"
  | "reject"
  | "escalate"
  | "ignore"
  | "retry_ai";

type RequestBody = {
  commentId?: string;
  action?: ActionName;
  finalReply?: string;
  note?: string;
};

type CommentRow = {
  id: string;
  platform: string;
  account_key: string | null;
  status: string;
  platform_comment_id: string;
  username: string | null;
  user_display_name: string | null;
  comment_text: string;
  intent: string | null;
};

type ReplyRow = {
  id: string;
  ai_draft: string | null;
  final_reply: string | null;
  ai_model: string | null;
  ai_confidence: number | null;
  sent_at: string | null;
  error_message: string | null;
};

async function getDispatchContext(commentId: string) {
  const [comments, replies, activity] = await Promise.all([
    autoReplySupabaseRequest(
      `/rest/v1/social_comments?id=eq.${encodeURIComponent(
        commentId
      )}&select=id,platform,account_key,status,platform_comment_id,username,user_display_name,comment_text,intent&limit=1`
    ) as Promise<CommentRow[]>,
    autoReplySupabaseRequest(
      `/rest/v1/social_comment_replies?comment_id=eq.${encodeURIComponent(
        commentId
      )}&select=id,ai_draft,final_reply,ai_model,ai_confidence,sent_at,error_message&order=updated_at.desc&limit=1`
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

async function loadConversationHistory(
  platform: string,
  contactId: string | null,
  currentCommentId: string
): Promise<AutoReplyConversationTurn[]> {
  if (!contactId) return [];

  const prefix = `manychat-${contactId}-`;

  const comments =
    (await autoReplySupabaseRequest(
      `/rest/v1/social_comments?platform=eq.${encodeURIComponent(
        platform
      )}&platform_comment_id=like.${encodeURIComponent(
        `${prefix}%`
      )}&select=id,comment_text,created_at&order=created_at.desc&limit=9`
    )) as Array<{
      id: string;
      comment_text: string;
      created_at: string;
    }>;

  const previous = comments
    .filter((row) => row.id !== currentCommentId)
    .slice(0, 8);

  if (!previous.length) return [];

  const ids = previous
    .map((row) => `"${row.id}"`)
    .join(",");

  const replies =
    (await autoReplySupabaseRequest(
      `/rest/v1/social_comment_replies?comment_id=in.(${encodeURIComponent(
        ids
      )})&select=comment_id,final_reply,sent_at&limit=50`
    )) as Array<{
      comment_id: string;
      final_reply: string | null;
      sent_at: string | null;
    }>;

  const replyByComment = new Map(
    replies.map((row) => [row.comment_id, row])
  );

  const turns: AutoReplyConversationTurn[] = [];

  for (const row of [...previous].reverse()) {
    if (row.comment_text?.trim()) {
      turns.push({
        role: "customer",
        text: row.comment_text.trim()
      });
    }

    const reply = replyByComment.get(row.id);

    if (reply?.sent_at && reply.final_reply?.trim()) {
      turns.push({
        role: "admin",
        text: reply.final_reply.trim()
      });
    }
  }

  return turns.slice(-10);
}

async function saveAIDraftResult(input: {
  commentId: string;
  replyId: string | null;
  aiDraft: string | null;
  aiModel: string | null;
  aiConfidence: number | null;
  errorMessage: string | null;
}) {
  const payload = {
    ai_draft: input.aiDraft,
    ai_model: input.aiModel,
    ai_confidence: input.aiConfidence,
    error_message: input.errorMessage,
    updated_at: new Date().toISOString()
  };

  if (input.replyId) {
    await autoReplySupabaseRequest(
      `/rest/v1/social_comment_replies?id=eq.${encodeURIComponent(
        input.replyId
      )}`,
      {
        method: "PATCH",
        headers: {
          Prefer: "return=minimal"
        },
        body: JSON.stringify(payload)
      }
    );

    return;
  }

  await autoReplySupabaseRequest(
    "/rest/v1/social_comment_replies",
    {
      method: "POST",
      headers: {
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        comment_id: input.commentId,
        final_reply: null,
        ...payload
      })
    }
  );
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

    if (body.action === "retry_ai") {
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
        return NextResponse.json(
          {
            error:
              "This message has already been sent and cannot be regenerated."
          },
          { status: 400 }
        );
      }

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
            intent: "AI_RETRYING",
            ai_confidence: null,
            status: "PENDING_APPROVAL",
            updated_at: new Date().toISOString()
          })
        }
      );

      await writeAutoReplyActivity(
        body.commentId,
        "AI_RETRY_REQUESTED",
        actor,
        "Manual AI draft retry requested from Approval Inbox."
      );

      const manyChatContactId =
        extractManyChatContactId(
          context.activity,
          context.comment.platform_comment_id
        );

      const conversationHistory =
        await loadConversationHistory(
          context.comment.platform,
          manyChatContactId,
          body.commentId
        );

      try {
        const draft =
          await generateCustomerServiceDraft({
            platform:
              context.comment.platform,
            customerName:
              context.comment.user_display_name,
            username:
              context.comment.username,
            commentText:
              context.comment.comment_text,
            conversationHistory
          });

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
              intent: draft.intent,
              sentiment:
                draft.sentiment.toLowerCase(),
              priority:
                draft.priority === "HIGH"
                  ? "urgent"
                  : draft.priority === "LOW"
                    ? "low"
                    : "normal",
              ai_confidence:
                draft.confidence,
              status: "PENDING_APPROVAL",
              updated_at:
                new Date().toISOString()
            })
          }
        );

        await saveAIDraftResult({
          commentId: body.commentId,
          replyId:
            context.reply?.id || null,
          aiDraft: draft.draftReply,
          aiModel: draft.model,
          aiConfidence:
            draft.confidence,
          errorMessage: null
        });

        await writeAutoReplyActivity(
          body.commentId,
          "AI_RETRY_SUCCEEDED",
          "Vercel AI",
          [
            `AI draft regenerated using ${draft.model}.`,
            conversationHistory.length
              ? `Conversation context: ${conversationHistory.length} prior turns.`
              : "No prior conversation context."
          ].join(" • ")
        );

        return NextResponse.json({
          ok: true,
          action: body.action,
          commentId: body.commentId,
          aiDraft: draft.draftReply,
          confidence: draft.confidence,
          intent: draft.intent,
          model: draft.model
        });
      } catch (aiError) {
        const message =
          aiError instanceof Error
            ? aiError.message
            : "Unable to generate AI draft.";

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
              intent: "AI_ERROR",
              ai_confidence: null,
              status: "PENDING_APPROVAL",
              updated_at:
                new Date().toISOString()
            })
          }
        );

        await saveAIDraftResult({
          commentId: body.commentId,
          replyId:
            context.reply?.id || null,
          aiDraft: null,
          aiModel:
            process.env.AUTO_REPLY_GEMINI_MODEL ||
            process.env.GEMINI_MODEL ||
            "gemini-3.8-flash",
          aiConfidence: null,
          errorMessage: message.slice(0, 1000)
        });

        await writeAutoReplyActivity(
          body.commentId,
          "AI_RETRY_FAILED",
          "Vercel AI",
          `Fallback reply remains available for manual review. ${message}`
        );

        return NextResponse.json(
          {
            error:
              `AI retry failed: ${message}`
          },
          { status: 502 }
        );
      }
    }

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
