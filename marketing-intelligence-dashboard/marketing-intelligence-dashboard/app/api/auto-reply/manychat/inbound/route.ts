import { createHash, timingSafeEqual } from "crypto";
import { after, NextRequest, NextResponse } from "next/server";

import {
  autoReplySupabaseRequest,
  writeAutoReplyActivity
} from "@/lib/auto-reply-comments";

import {
  generateCustomerServiceDraft,
  type AutoReplyConversationTurn
} from "@/lib/auto-reply-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Payload = Record<string, any>;

function str(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function obj(value: unknown): Record<string, any> {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<string, any>;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        return parsed as Record<string, any>;
      }
    } catch {
      return {};
    }
  }

  return {};
}

function secureEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);

  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function authorized(request: NextRequest) {
  const expected =
    process.env.MANYCHAT_WEBHOOK_SECRET?.trim();

  if (!expected) {
    throw new Error(
      "MANYCHAT_WEBHOOK_SECRET is not configured."
    );
  }

  const received =
    request.headers.get("x-manychat-secret")?.trim() || "";

  return secureEqual(received, expected);
}

function fallbackEventId(input: {
  contactId: string;
  contentId: string;
  text: string;
  createdAt?: string;
}) {
  return createHash("sha256")
    .update(
      `${input.contactId}|${input.contentId}|${input.text}|${input.createdAt || ""}`
    )
    .digest("hex")
    .slice(0, 24);
}

async function findExisting(
  platform: string,
  platformCommentId: string
) {
  const rows =
    (await autoReplySupabaseRequest(
      `/rest/v1/social_comments?platform=eq.${encodeURIComponent(
        platform
      )}&platform_comment_id=eq.${encodeURIComponent(
        platformCommentId
      )}&select=id,status&limit=1`
    )) as Array<{ id: string; status: string }>;

  return rows[0] || null;
}

function buildManyChatLinkNote(
  contactId: string,
  inboxUrl: string | null
) {
  return [
    `ManyChat contact: ${contactId}`,
    inboxUrl ? `Inbox: ${inboxUrl}` : null
  ]
    .filter(Boolean)
    .join(" • ");
}

async function loadConversationHistory(
  platform: string,
  contactId: string
): Promise<AutoReplyConversationTurn[]> {
  if (!contactId) return [];

  const prefix = `manychat-${contactId}-`;

  const comments =
    (await autoReplySupabaseRequest(
      `/rest/v1/social_comments?platform=eq.${encodeURIComponent(
        platform
      )}&platform_comment_id=like.${encodeURIComponent(
        `${prefix}%`
      )}&select=id,comment_text,created_at&order=created_at.desc&limit=8`
    )) as Array<{
      id: string;
      comment_text: string;
      created_at: string;
    }>;

  if (!comments.length) return [];

  const ids = comments
    .map((row) => `"${row.id}"`)
    .join(",");

  const replies =
    (await autoReplySupabaseRequest(
      `/rest/v1/social_comment_replies?comment_id=in.(${encodeURIComponent(
        ids
      )})&select=comment_id,final_reply,ai_draft,sent_at,approved_at&limit=50`
    )) as Array<{
      comment_id: string;
      final_reply: string | null;
      ai_draft: string | null;
      sent_at: string | null;
      approved_at: string | null;
    }>;

  const replyByComment = new Map(
    replies.map((row) => [row.comment_id, row])
  );

  const chronological = [...comments].reverse();
  const turns: AutoReplyConversationTurn[] = [];

  for (const row of chronological) {
    if (row.comment_text?.trim()) {
      turns.push({
        role: "customer",
        text: row.comment_text.trim()
      });
    }

    const reply = replyByComment.get(row.id);
    const sentText =
      reply?.sent_at && reply.final_reply
        ? reply.final_reply.trim()
        : "";

    if (sentText) {
      turns.push({
        role: "admin",
        text: sentText
      });
    }
  }

  return turns.slice(-10);
}

/**
 * All AI/database work happens here.
 *
 * The public POST handler below acknowledges ManyChat immediately.
 * Next.js `after()` keeps this work alive after the HTTP response,
 * so Gemini latency no longer consumes ManyChat's 10-second response window.
 */
async function processInbound(body: Payload) {
  try {
    const directContactBody =
      body.id ||
      body.key ||
      body.last_input_text ||
      body.live_chat_url
        ? body
        : null;

    const fullContact = obj(
      body.full_contact_data ??
        body.contact ??
        body.contact_data ??
        directContactBody
    );

    const customFields = obj(
      body.custom_fields ??
        fullContact.custom_fields
    );

    const platform =
      str(body.platform).toLowerCase() || "instagram";

    const contactId = str(
      body.manychat_contact_id ??
        body.contact_id ??
        body.subscriber_id ??
        body.id ??
        fullContact.id
    );

    const displayName =
      str(
        body.display_name ??
          body.name ??
          fullContact.name ??
          fullContact.first_name
      ) || null;

    const username =
      str(
        body.username ??
          body.instagram_username ??
          customFields.instagram_username ??
          customFields.username
      ) || null;

    const messageText = str(
      body.comment_text ??
        body.message ??
        body.text ??
        body.last_input_text ??
        fullContact.last_input_text
    );

    if (!messageText) {
      console.error(
        "ManyChat background processing: no message text received."
      );
      return;
    }

    const createdAt =
      str(
        body.comment_created_at ??
          body.created_at ??
          body.timestamp ??
          body.last_interaction ??
          fullContact.last_interaction
      ) || new Date().toISOString();

    const inboxUrl =
      str(
        body.inbox_url ??
          body.live_chat_url ??
          fullContact.live_chat_url
      ) || null;

    const platformContentId =
      str(
        body.platform_content_id ??
          body.content_id ??
          body.post_id
      );

    const platformCommentId =
      str(
        body.platform_comment_id ??
          body.comment_id ??
          body.event_id ??
          body.message_id
      ) ||
      `manychat-${contactId || "unknown"}-${fallbackEventId({
        contactId: contactId || "unknown",
        contentId: platformContentId || "direct-message",
        text: messageText,
        createdAt
      })}`;

    const existing = await findExisting(
      platform,
      platformCommentId
    );

    if (existing) {
      if (contactId) {
        await writeAutoReplyActivity(
          existing.id,
          "MANYCHAT_CONTACT_LINKED",
          "ManyChat Collector",
          buildManyChatLinkNote(contactId, inboxUrl)
        );
      }

      return;
    }

    const conversationHistory =
      await loadConversationHistory(
        platform,
        contactId
      );

    const draft = await generateCustomerServiceDraft({
      platform,
      customerName: displayName,
      username,
      commentText: messageText,
      conversationHistory
    });

    if (!draft.draftReply) {
      throw new Error("AI draft is empty.");
    }

    const commentRows =
      (await autoReplySupabaseRequest(
        "/rest/v1/social_comments",
        {
          method: "POST",
          headers: {
            Prefer: "return=representation"
          },
          body: JSON.stringify({
            platform,
            account_key:
              str(body.account_key) || "indomobil-emotor",
            platform_comment_id: platformCommentId,
            platform_content_id:
              platformContentId || null,
            username,
            user_display_name: displayName,
            comment_text: messageText,
            comment_url:
              str(body.comment_url) || null,
            comment_created_at: createdAt,
            intent: draft.intent,
            sentiment: draft.sentiment.toLowerCase(),
            priority:
              draft.priority === "HIGH"
                ? "urgent"
                : draft.priority === "LOW"
                  ? "low"
                  : "normal",
            ai_confidence: draft.confidence,
            status: "PENDING_APPROVAL",
            updated_at: new Date().toISOString()
          })
        }
      )) as Array<{ id: string }>;

    const commentId = commentRows[0]?.id;

    if (!commentId) {
      throw new Error(
        "Supabase did not return a message ID."
      );
    }

    await autoReplySupabaseRequest(
      "/rest/v1/social_comment_replies",
      {
        method: "POST",
        headers: {
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          comment_id: commentId,
          ai_draft: draft.draftReply,
          final_reply: null,
          ai_model: draft.model,
          ai_confidence: draft.confidence,
          error_message: null,
          updated_at: new Date().toISOString()
        })
      }
    );

    await writeAutoReplyActivity(
      commentId,
      "AI_DRAFTED",
      "Vercel AI",
      [
        draft.needsConfirmation
          ? "Needs information confirmation."
          : "Draft generated for human approval.",
        draft.priority === "HIGH"
          ? "High-priority review."
          : null,
        draft.note || null,
        conversationHistory.length
          ? `Conversation context: ${conversationHistory.length} prior turns.`
          : "No prior conversation context.",
        contactId
          ? `ManyChat contact: ${contactId}`
          : null,
        inboxUrl ? `Inbox: ${inboxUrl}` : null
      ]
        .filter(Boolean)
        .join(" • ")
    );

    console.log(
      "ManyChat background processing complete",
      {
        commentId,
        platform,
        accountKey:
          str(body.account_key) || "indomobil-emotor",
        conversationTurns:
          conversationHistory.length
      }
    );
  } catch (error) {
    console.error(
      "ManyChat background AI draft error",
      error
    );
  }
}

/**
 * Fast acknowledgement endpoint for ManyChat.
 *
 * IMPORTANT:
 * ManyChat has a 10-second External Request timeout.
 * We authenticate and parse the request, schedule the actual
 * AI/database work with Next.js `after()`, then return 200 immediately.
 */
export async function POST(request: NextRequest) {
  try {
    if (!authorized(request)) {
      return NextResponse.json(
        { error: "Invalid ManyChat secret." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as Payload;

    after(async () => {
      await processInbound(body);
    });

    return NextResponse.json(
      {
        ok: true,
        received: true,
        processing: "BACKGROUND"
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "ManyChat inbound acknowledgement error",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to acknowledge ManyChat request."
      },
      { status: 500 }
    );
  }
}
