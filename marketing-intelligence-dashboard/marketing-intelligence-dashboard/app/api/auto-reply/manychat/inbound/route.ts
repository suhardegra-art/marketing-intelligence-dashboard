import { createHash, timingSafeEqual } from "crypto";
import { after, NextRequest, NextResponse } from "next/server";

import {
  autoReplySupabaseRequest,
  writeAutoReplyActivity
} from "@/lib/auto-reply-comments";

import {
  generateCustomerServiceDraft,
  type AutoReplyConversationTurn,
  type AutoReplyAIDraft
} from "@/lib/auto-reply-ai";

import {
  sendManyChatInstagramText
} from "@/lib/manychat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Payload = Record<string, any>;

const DIRECT_SEND_INTENTS = new Set([
  "PRICE",
  "DEALER",
  "CORPORATE"
]);

function directSendEnabled() {
  return (
    process.env.AUTO_REPLY_DIRECT_SEND_ENABLED?.trim().toLowerCase() !==
    "false"
  );
}

function directSendMinConfidence() {
  const raw = Number(
    process.env.AUTO_REPLY_DIRECT_SEND_MIN_CONFIDENCE || "90"
  );

  if (!Number.isFinite(raw)) return 90;

  return Math.max(0, Math.min(100, raw));
}

function directSendAccounts() {
  const raw =
    process.env.AUTO_REPLY_DIRECT_SEND_ACCOUNTS ||
    "imriders.official";

  return new Set(
    raw
      .split(",")
      .map((value) =>
        value.trim().replace(/^@/, "").toLowerCase()
      )
      .filter(Boolean)
  );
}

function normalizeIntent(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "_");
}

function shouldDirectSend(
  inbound: NormalizedInbound,
  draft: AutoReplyAIDraft
) {
  if (!directSendEnabled()) return false;

  if (inbound.platform !== "instagram") return false;

  if (!directSendAccounts().has(inbound.accountKey)) {
    return false;
  }

  if (!/^\d+$/.test(inbound.contactId)) {
    return false;
  }

  const intent = normalizeIntent(draft.intent);

  if (!DIRECT_SEND_INTENTS.has(intent)) {
    return false;
  }

  if (draft.needsConfirmation) {
    return false;
  }

  if (draft.priority === "HIGH") {
    return false;
  }

  return draft.confidence >= directSendMinConfidence();
}


type NormalizedInbound = {
  platform: string;
  accountKey: string;
  contactId: string;
  displayName: string | null;
  username: string | null;
  messageText: string;
  createdAt: string;
  inboxUrl: string | null;
  platformContentId: string;
  platformCommentId: string;
  commentUrl: string | null;
};

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

function normalizeAccountKey(value: unknown) {
  const key = str(value)
    .replace(/^@/, "")
    .toLowerCase();

  // Keep dashboard account keys consistent.
  if (
    key === "indomobil-emotor" ||
    key === "indomobilemotor" ||
    key === "im.indomobil"
  ) {
    return "im.indomobil";
  }

  if (
    key === "imriders" ||
    key === "imriders.official"
  ) {
    return "imriders.official";
  }

  return key || "im.indomobil";
}

function normalizeInbound(
  body: Payload,
  accountKeyFromQuery: string
): NormalizedInbound {
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

  const accountKey = normalizeAccountKey(
    accountKeyFromQuery ||
      body.account_key ||
      body.accountKey
  );

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
    throw new Error(
      "ManyChat payload does not contain message text."
    );
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

  return {
    platform,
    accountKey,
    contactId,
    displayName,
    username,
    messageText,
    createdAt,
    inboxUrl,
    platformContentId,
    platformCommentId,
    commentUrl: str(body.comment_url) || null
  };
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
    contactId ? `ManyChat contact: ${contactId}` : null,
    inboxUrl ? `Inbox: ${inboxUrl}` : null
  ]
    .filter(Boolean)
    .join(" • ");
}

async function safeWriteActivity(
  commentId: string,
  action: string,
  actor: string,
  note?: string | null
) {
  try {
    await writeAutoReplyActivity(
      commentId,
      action,
      actor,
      note
    );
  } catch (error) {
    console.error("Unable to write auto-reply activity", {
      commentId,
      action,
      error:
        error instanceof Error
          ? error.message
          : String(error)
    });
  }
}

async function loadConversationHistory(
  platform: string,
  contactId: string,
  currentPlatformCommentId: string
): Promise<AutoReplyConversationTurn[]> {
  if (!contactId) return [];

  const prefix = `manychat-${contactId}-`;

  const comments =
    (await autoReplySupabaseRequest(
      `/rest/v1/social_comments?platform=eq.${encodeURIComponent(
        platform
      )}&platform_comment_id=like.${encodeURIComponent(
        `${prefix}%`
      )}&select=id,platform_comment_id,comment_text,created_at&order=created_at.desc&limit=9`
    )) as Array<{
      id: string;
      platform_comment_id: string;
      comment_text: string;
      created_at: string;
    }>;

  const previousComments = comments
    .filter(
      (row) =>
        row.platform_comment_id !== currentPlatformCommentId
    )
    .slice(0, 8);

  if (!previousComments.length) return [];

  const ids = previousComments
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

  const chronological = [...previousComments].reverse();
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
 * Persist the inbound message BEFORE acknowledging ManyChat.
 *
 * This guarantees that a Gemini outage cannot make a customer
 * message disappear from the dashboard.
 */
async function persistInbound(
  inbound: NormalizedInbound
) {
  const existing = await findExisting(
    inbound.platform,
    inbound.platformCommentId
  );

  if (existing) {
    return {
      commentId: existing.id,
      duplicate: true
    };
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
          platform: inbound.platform,
          account_key: inbound.accountKey,
          platform_comment_id:
            inbound.platformCommentId,
          platform_content_id:
            inbound.platformContentId || null,
          username: inbound.username,
          user_display_name: inbound.displayName,
          comment_text: inbound.messageText,
          comment_url: inbound.commentUrl,
          comment_created_at: inbound.createdAt,

          // Keep the message out of the Approval Inbox while AI decides
          // whether it can be sent directly or needs human approval.
          intent: "AI_PENDING",
          sentiment: null,
          priority: "normal",
          ai_confidence: null,
          status: "NEW",

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

  await safeWriteActivity(
    commentId,
    "MANYCHAT_RECEIVED",
    "ManyChat Collector",
    [
      `Account: @${inbound.accountKey}`,
      buildManyChatLinkNote(
        inbound.contactId,
        inbound.inboxUrl
      )
    ]
      .filter(Boolean)
      .join(" • ")
  );

  return {
    commentId,
    duplicate: false
  };
}

async function insertReplyResult(input: {
  commentId: string;
  aiDraft: string | null;
  aiModel: string | null;
  aiConfidence: number | null;
  errorMessage: string | null;
}) {
  await autoReplySupabaseRequest(
    "/rest/v1/social_comment_replies",
    {
      method: "POST",
      headers: {
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        comment_id: input.commentId,
        ai_draft: input.aiDraft,
        final_reply: null,
        ai_model: input.aiModel,
        ai_confidence: input.aiConfidence,
        error_message: input.errorMessage,
        updated_at: new Date().toISOString()
      })
    }
  );
}

async function markDirectSendSuccess(input: {
  commentId: string;
  finalReply: string;
  sentAt: string;
}) {
  await Promise.all([
    autoReplySupabaseRequest(
      `/rest/v1/social_comment_replies?comment_id=eq.${encodeURIComponent(
        input.commentId
      )}`,
      {
        method: "PATCH",
        headers: {
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          final_reply: input.finalReply,
          sent_at: input.sentAt,
          error_message: null,
          updated_at: input.sentAt
        })
      }
    ),
    autoReplySupabaseRequest(
      `/rest/v1/social_comments?id=eq.${encodeURIComponent(
        input.commentId
      )}`,
      {
        method: "PATCH",
        headers: {
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          status: "AUTO_REPLIED",
          updated_at: input.sentAt
        })
      }
    )
  ]);
}

async function markDirectSendFailure(
  commentId: string,
  message: string
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
          error_message: message.slice(0, 1000),
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
}

function errorMessage(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  return message.slice(0, 1000);
}

/**
 * Runs only AFTER the customer message has already been saved
 * and ManyChat has received a successful acknowledgement.
 */
async function processAI(
  inbound: NormalizedInbound,
  commentId: string
) {
  try {
    const conversationHistory =
      await loadConversationHistory(
        inbound.platform,
        inbound.contactId,
        inbound.platformCommentId
      );

    const draft = await generateCustomerServiceDraft({
      platform: inbound.platform,
      customerName: inbound.displayName,
      username: inbound.username,
      commentText: inbound.messageText,
      conversationHistory
    });

    if (!draft.draftReply) {
      throw new Error("AI draft is empty.");
    }

    const normalizedIntent = normalizeIntent(draft.intent);
    const directSend = shouldDirectSend(inbound, draft);

    await autoReplySupabaseRequest(
      `/rest/v1/social_comments?id=eq.${encodeURIComponent(
        commentId
      )}`,
      {
        method: "PATCH",
        headers: {
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          intent: normalizedIntent,
          sentiment: draft.sentiment.toLowerCase(),
          priority:
            draft.priority === "HIGH"
              ? "urgent"
              : draft.priority === "LOW"
                ? "low"
                : "normal",
          ai_confidence: draft.confidence,
          // Direct-send candidates stay out of the approval queue.
          // They become AUTO_REPLIED after a successful ManyChat send.
          // If sending fails, markDirectSendFailure() moves them to
          // PENDING_APPROVAL so a human can handle them.
          status: directSend ? "NEW" : "PENDING_APPROVAL",
          updated_at: new Date().toISOString()
        })
      }
    );

    await insertReplyResult({
      commentId,
      aiDraft: draft.draftReply,
      aiModel: draft.model,
      aiConfidence: draft.confidence,
      errorMessage: null
    });

    await safeWriteActivity(
      commentId,
      "AI_DRAFTED",
      "Vercel AI",
      [
        directSend
          ? "Eligible for direct auto reply."
          : draft.needsConfirmation
            ? "Needs information confirmation."
            : "Draft generated for human approval.",
        `Intent: ${normalizedIntent}.`,
        `Confidence: ${draft.confidence}%.`,
        draft.priority === "HIGH"
          ? "High-priority review."
          : null,
        draft.note || null,
        conversationHistory.length
          ? `Conversation context: ${conversationHistory.length} prior turns.`
          : "No prior conversation context.",
        inbound.contactId
          ? `ManyChat contact: ${inbound.contactId}`
          : null,
        inbound.inboxUrl
          ? `Inbox: ${inbound.inboxUrl}`
          : null
      ]
        .filter(Boolean)
        .join(" • ")
    );

    if (directSend) {
      try {
        await sendManyChatInstagramText(
          inbound.contactId,
          draft.draftReply
        );

        const sentAt = new Date().toISOString();

        await markDirectSendSuccess({
          commentId,
          finalReply: draft.draftReply,
          sentAt
        });

        await safeWriteActivity(
          commentId,
          "AUTO_REPLIED",
          "Vercel AI + ManyChat",
          [
            `Direct reply sent automatically.`,
            `Intent: ${normalizedIntent}.`,
            `Confidence: ${draft.confidence}%.`,
            `ManyChat contact: ${inbound.contactId}.`
          ].join(" • ")
        );

        console.log(
          "ManyChat direct auto reply complete",
          {
            commentId,
            platform: inbound.platform,
            accountKey: inbound.accountKey,
            intent: normalizedIntent,
            confidence: draft.confidence,
            aiModel: draft.model
          }
        );

        return;
      } catch (sendError) {
        const sendMessage = errorMessage(sendError);

        await markDirectSendFailure(
          commentId,
          sendMessage
        );

        await safeWriteActivity(
          commentId,
          "AUTO_REPLY_SEND_FAILED",
          "ManyChat Dispatcher",
          `Automatic send failed; message kept in approval queue. ${sendMessage}`
        );

        console.error(
          "ManyChat direct auto reply send failed",
          {
            commentId,
            accountKey: inbound.accountKey,
            intent: normalizedIntent,
            error: sendMessage
          }
        );

        return;
      }
    }

    console.log(
      "ManyChat background processing complete",
      {
        commentId,
        platform: inbound.platform,
        accountKey: inbound.accountKey,
        intent: normalizedIntent,
        confidence: draft.confidence,
        directSend: false,
        conversationTurns:
          conversationHistory.length,
        aiModel: draft.model
      }
    );
  } catch (error) {
    const message = errorMessage(error);

    console.error(
      "ManyChat background AI draft error",
      {
        commentId,
        platform: inbound.platform,
        accountKey: inbound.accountKey,
        error: message
      }
    );

    // Keep the message visible in the human approval queue.
    try {
      await autoReplySupabaseRequest(
        `/rest/v1/social_comments?id=eq.${encodeURIComponent(
          commentId
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
            updated_at: new Date().toISOString()
          })
        }
      );
    } catch (updateError) {
      console.error(
        "Unable to mark inbound message as AI_ERROR",
        updateError
      );
    }

    try {
      await insertReplyResult({
        commentId,
        aiDraft: null,
        aiModel:
          process.env.AUTO_REPLY_GEMINI_MODEL ||
          process.env.GEMINI_MODEL ||
          "gemini-3.8-flash",
        aiConfidence: null,
        errorMessage: message
      });
    } catch (replyError) {
      console.error(
        "Unable to store AI error detail",
        replyError
      );
    }

    await safeWriteActivity(
      commentId,
      "AI_DRAFT_FAILED",
      "Vercel AI",
      `Message kept in approval queue. ${message}`
    );
  }
}

/**
 * ManyChat inbound endpoint.
 *
 * Final flow:
 * 1. Authenticate request.
 * 2. Read ?account_key=... from the webhook URL.
 * 3. Parse and persist the inbound message to Supabase.
 * 4. Return HTTP 200 to ManyChat.
 * 5. Generate the Gemini draft in Next.js after().
 *
 * Example:
 * /api/auto-reply/manychat/inbound?account_key=imriders.official
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

    const accountKeyFromQuery =
      request.nextUrl.searchParams.get(
        "account_key"
      ) || "";

    const inbound = normalizeInbound(
      body,
      accountKeyFromQuery
    );

    const persisted = await persistInbound(inbound);

    if (persisted.duplicate) {
      after(async () => {
        await safeWriteActivity(
          persisted.commentId,
          "MANYCHAT_DUPLICATE_RECEIVED",
          "ManyChat Collector",
          buildManyChatLinkNote(
            inbound.contactId,
            inbound.inboxUrl
          )
        );
      });

      return NextResponse.json(
        {
          ok: true,
          received: true,
          duplicate: true
        },
        { status: 200 }
      );
    }

    after(async () => {
      await processAI(
        inbound,
        persisted.commentId
      );
    });

    return NextResponse.json(
      {
        ok: true,
        received: true,
        persisted: true,
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
