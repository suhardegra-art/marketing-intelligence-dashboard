import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import {
  autoReplySupabaseRequest,
  writeAutoReplyActivity
} from "@/lib/auto-reply-comments";

import {
  generateCustomerServiceDraft
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
  text: string;
  createdAt: string;
}) {
  return createHash("sha256")
    .update(
      `${input.contactId}|${input.text}|${input.createdAt}`
    )
    .digest("hex")
    .slice(0, 32);
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

export async function POST(request: NextRequest) {
  try {
    if (!authorized(request)) {
      return NextResponse.json(
        { error: "Invalid ManyChat secret." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as Payload;

    const fullContact = obj(
      body.full_contact_data ??
        body.contact ??
        body.contact_data
    );

    const customFields = obj(fullContact.custom_fields);

    const platform =
      str(body.platform).toLowerCase() || "instagram";

    const contactId = str(
      body.manychat_contact_id ??
        body.contact_id ??
        body.subscriber_id ??
        fullContact.id
    );

    const displayName =
      str(
        body.display_name ??
          body.name ??
          fullContact.name
      ) || null;

    const username =
      str(
        body.username ??
          customFields.instagram_username ??
          customFields.username
      ) || null;

    const commentText = str(
      body.comment_text ??
        body.text ??
        body.last_input_text ??
        fullContact.last_input_text
    );

    if (!commentText) {
      return NextResponse.json(
        {
          error:
            "No comment/message text received. Map the trigger text to comment_text or send Full Contact Data."
        },
        { status: 400 }
      );
    }

    const createdAt =
      str(
        body.comment_created_at ??
          body.created_at ??
          body.timestamp ??
          fullContact.last_interaction
      ) || new Date().toISOString();

    const platformCommentId =
      str(
        body.platform_comment_id ??
          body.comment_id ??
          body.event_id
      ) ||
      `manychat-${fallbackEventId({
        contactId: contactId || "unknown",
        text: commentText,
        createdAt
      })}`;

    const existing = await findExisting(
      platform,
      platformCommentId
    );

    if (existing) {
      return NextResponse.json({
        ok: true,
        duplicate: true,
        commentId: existing.id,
        status: existing.status
      });
    }

    const draft = await generateCustomerServiceDraft({
      platform,
      customerName: displayName,
      username,
      commentText
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
              str(
                body.platform_content_id ??
                  body.content_id ??
                  body.post_id
              ) || null,
            username,
            user_display_name: displayName,
            comment_text: commentText,
            comment_url:
              str(body.comment_url) || null,
            comment_created_at: createdAt,
            intent: draft.intent,
            sentiment: draft.sentiment.toLowerCase(),
            priority:
              draft.priority === "HIGH"
                ? "urgent"
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
        "Supabase did not return a comment ID."
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

    const inboxUrl =
      str(
        body.inbox_url ??
          fullContact.live_chat_url
      ) || null;

    await writeAutoReplyActivity(
      commentId,
      "AI_DRAFTED",
      "Vercel AI",
      [
        draft.needsConfirmation
          ? "Needs information confirmation."
          : "Draft generated for human approval.",
        draft.note || null,
        contactId
          ? `ManyChat contact: ${contactId}`
          : null,
        inboxUrl ? `Inbox: ${inboxUrl}` : null
      ]
        .filter(Boolean)
        .join(" • ")
    );

    return NextResponse.json({
      ok: true,
      commentId,
      status: "PENDING_APPROVAL",
      approvalRequired: true,
      draftGenerated: true,
      needsConfirmation: draft.needsConfirmation
    });
  } catch (error) {
    console.error(
      "ManyChat inbound AI draft error",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create AI draft."
      },
      { status: 500 }
    );
  }
}
