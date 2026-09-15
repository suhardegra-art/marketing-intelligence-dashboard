export type AutoReplyComment = {
  id: string;
  platform: string;
  accountKey: string | null;
  platformCommentId: string;
  platformContentId: string | null;
  username: string | null;
  displayName: string | null;
  commentText: string;
  commentUrl: string | null;
  commentCreatedAt: string | null;
  intent: string | null;
  sentiment: string | null;
  priority: string;
  aiConfidence: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  reply: {
    id: string;
    aiDraft: string | null;
    finalReply: string | null;
    aiModel: string | null;
    aiConfidence: number | null;
    approvedBy: string | null;
    approvedAt: string | null;
    sentAt: string | null;
    errorMessage: string | null;
  } | null;
};

export type AutoReplyActivity = {
  id: string;
  commentId: string;
  platform: string;
  commentText: string;
  action: string;
  actor: string | null;
  note: string | null;
  createdAt: string;
};

export type AutoReplyDashboardData = {
  counts: {
    newComments: number;
    pendingApproval: number;
    aiDraftReady: number;
    repliedToday: number;
    escalated: number;
  };
  pending: AutoReplyComment[];
  recentActivity: AutoReplyActivity[];
};

type SupabaseConfig = {
  url: string;
  secretKey: string;
};

function getConfig(): SupabaseConfig {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error("Supabase server configuration is missing.");
  }

  return {
    url,
    secretKey
  };
}

export async function autoReplySupabaseRequest(
  path: string,
  init: RequestInit = {}
) {
  const config = getConfig();

  const response = await fetch(
    `${config.url}${path}`,
    {
      ...init,
      headers: {
        apikey: config.secretKey,
        Authorization: `Bearer ${config.secretKey}`,
        "Content-Type": "application/json",
        ...(init.headers || {})
      },
      cache: "no-store"
    }
  );

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `Supabase HTTP ${response.status}: ${body}`
    );
  }

  const text = await response.text();

  return text
    ? JSON.parse(text)
    : null;
}

async function countByStatus(
  status: string
) {
  const config = getConfig();

  const response = await fetch(
    `${config.url}/rest/v1/social_comments?status=eq.${encodeURIComponent(
      status
    )}&select=id`,
    {
      method: "HEAD",
      headers: {
        apikey: config.secretKey,
        Authorization: `Bearer ${config.secretKey}`,
        Prefer: "count=exact"
      },
      cache: "no-store"
    }
  );

  if (!response.ok) {
    return 0;
  }

  const range =
    response.headers.get(
      "content-range"
    );

  const total =
    range?.split("/")?.[1];

  return total &&
    total !== "*"
    ? Number(total)
    : 0;
}

async function countRepliedToday() {
  const config = getConfig();

  const today =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }
    ).format(new Date());

  const from =
    `${today}T00:00:00+07:00`;

  const response =
    await fetch(
      `${config.url}/rest/v1/social_comment_replies?sent_at=gte.${encodeURIComponent(
        from
      )}&select=id`,
      {
        method: "HEAD",
        headers: {
          apikey:
            config.secretKey,
          Authorization:
            `Bearer ${config.secretKey}`,
          Prefer: "count=exact"
        },
        cache: "no-store"
      }
    );

  if (!response.ok) {
    return 0;
  }

  const range =
    response.headers.get(
      "content-range"
    );

  const total =
    range?.split("/")?.[1];

  return total &&
    total !== "*"
    ? Number(total)
    : 0;
}

async function loadReplies(
  commentIds: string[]
) {
  if (
    commentIds.length === 0
  ) {
    return new Map();
  }

  const ids =
    commentIds
      .map(
        (id) => `"${id}"`
      )
      .join(",");

  const rows =
    (await autoReplySupabaseRequest(
      `/rest/v1/social_comment_replies?comment_id=in.(${encodeURIComponent(
        ids
      )})&select=*&limit=200`
    )) as any[];

  return new Map(
    rows.map(
      (row) => [
        row.comment_id,
        row
      ]
    )
  );
}

function mapComment(
  row: any,
  reply: any
): AutoReplyComment {
  return {
    id: row.id,
    platform: row.platform,
    accountKey:
      row.account_key,
    platformCommentId:
      row.platform_comment_id,
    platformContentId:
      row.platform_content_id,
    username: row.username,
    displayName:
      row.user_display_name,
    commentText:
      row.comment_text,
    commentUrl:
      row.comment_url,
    commentCreatedAt:
      row.comment_created_at,
    intent: row.intent,
    sentiment:
      row.sentiment,
    priority:
      row.priority,
    aiConfidence:
      row.ai_confidence ===
      null
        ? null
        : Number(
            row.ai_confidence
          ),
    status: row.status,
    createdAt:
      row.created_at,
    updatedAt:
      row.updated_at,
    reply: reply
      ? {
          id: reply.id,
          aiDraft:
            reply.ai_draft,
          finalReply:
            reply.final_reply,
          aiModel:
            reply.ai_model,
          aiConfidence:
            reply.ai_confidence ===
            null
              ? null
              : Number(
                  reply.ai_confidence
                ),
          approvedBy:
            reply.approved_by,
          approvedAt:
            reply.approved_at,
          sentAt:
            reply.sent_at,
          errorMessage:
            reply.error_message
        }
      : null
  };
}

export async function getAutoReplyDashboardData(): Promise<AutoReplyDashboardData> {
  const [
    newComments,
    pendingApproval,
    aiDraftReady,
    repliedToday,
    escalated,
    pendingRows,
    activityRows
  ] = await Promise.all([
    countByStatus("NEW"),
    countByStatus(
      "PENDING_APPROVAL"
    ),
    countByStatus(
      "AI_DRAFTED"
    ),
    countRepliedToday(),
    countByStatus(
      "ESCALATED"
    ),
    autoReplySupabaseRequest(
      "/rest/v1/social_comments?status=in.(PENDING_APPROVAL,AI_DRAFTED)&select=*&order=created_at.desc&limit=100"
    ) as Promise<any[]>,
    autoReplySupabaseRequest(
      "/rest/v1/social_comment_activity?select=*&order=created_at.desc&limit=30"
    ) as Promise<any[]>
  ]);

  const pendingIds =
    pendingRows.map(
      (row) => row.id
    );

  const replies =
    await loadReplies(
      pendingIds
    );

  const pending =
    pendingRows.map(
      (row) =>
        mapComment(
          row,
          replies.get(row.id)
        )
    );

  const activityCommentIds =
    Array.from(
      new Set(
        activityRows.map(
          (row) =>
            row.comment_id
        )
      )
    );

  const activityComments =
    activityCommentIds.length > 0
      ? ((await autoReplySupabaseRequest(
          `/rest/v1/social_comments?id=in.(${encodeURIComponent(
            activityCommentIds
              .map(
                (id) =>
                  `"${id}"`
              )
              .join(",")
          )})&select=id,platform,comment_text&limit=100`
        )) as any[])
      : [];

  const commentById =
    new Map(
      activityComments.map(
        (row) => [
          row.id,
          row
        ]
      )
    );

  const recentActivity =
    activityRows.map(
      (row) => {
        const comment =
          commentById.get(
            row.comment_id
          );

        return {
          id: row.id,
          commentId:
            row.comment_id,
          platform:
            comment?.platform ||
            "unknown",
          commentText:
            comment?.comment_text ||
            "",
          action:
            row.action,
          actor: row.actor,
          note: row.note,
          createdAt:
            row.created_at
        };
      }
    );

  return {
    counts: {
      newComments,
      pendingApproval,
      aiDraftReady,
      repliedToday,
      escalated
    },
    pending,
    recentActivity
  };
}

export async function writeAutoReplyActivity(
  commentId: string,
  action: string,
  actor: string,
  note?: string | null
) {
  await autoReplySupabaseRequest(
    "/rest/v1/social_comment_activity",
    {
      method: "POST",
      headers: {
        Prefer:
          "return=minimal"
      },
      body: JSON.stringify({
        comment_id:
          commentId,
        action,
        actor,
        note:
          note || null
      })
    }
  );
}
