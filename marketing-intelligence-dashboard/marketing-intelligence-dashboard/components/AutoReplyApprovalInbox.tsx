"use client";

import {
  useMemo,
  useState
} from "react";

import type {
  AutoReplyComment
} from "@/lib/auto-reply-comments";

type Props = {
  comments: AutoReplyComment[];
};

type Filter =
  | "all"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "facebook";

function platformLabel(
  platform: string
) {
  if (
    platform ===
    "instagram"
  ) {
    return "Instagram";
  }

  if (
    platform ===
    "youtube"
  ) {
    return "YouTube";
  }

  if (
    platform ===
    "tiktok"
  ) {
    return "TikTok";
  }

  if (
    platform ===
    "facebook"
  ) {
    return "Facebook";
  }

  return platform;
}

function formatDateTime(
  value: string | null
) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  ).format(
    new Date(value)
  );
}

export default function AutoReplyApprovalInbox({
  comments
}: Props) {
  const [filter, setFilter] =
    useState<Filter>("all");

  const [
    drafts,
    setDrafts
  ] = useState<
    Record<string, string>
  >(
    Object.fromEntries(
      comments.map(
        (comment) => [
          comment.id,
          comment.reply
            ?.finalReply ||
            comment.reply
              ?.aiDraft ||
            ""
        ]
      )
    )
  );

  const [
    loadingId,
    setLoadingId
  ] =
    useState<string | null>(
      null
    );

  const [
    error,
    setError
  ] =
    useState<string | null>(
      null
    );

  const filtered =
    useMemo(
      () =>
        filter === "all"
          ? comments
          : comments.filter(
              (comment) =>
                comment.platform ===
                filter
            ),
      [
        comments,
        filter
      ]
    );

  async function act(
    commentId: string,
    action:
      | "approve"
      | "reject"
      | "escalate"
      | "ignore"
  ) {
    setLoadingId(
      commentId
    );
    setError(null);

    try {
      const response =
        await fetch(
          "/api/auto-reply/action",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body:
              JSON.stringify({
                commentId,
                action,
                finalReply:
                  drafts[
                    commentId
                  ] || ""
              })
          }
        );

      const payload =
        await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            "Unable to update comment."
        );
      }

      window.location.reload();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update comment."
      );
    } finally {
      setLoadingId(
        null
      );
    }
  }

  return (
    <section
      className="panel"
      style={{
        marginBottom: 16,
        padding: 16
      }}
    >
      <div
        className="panel-header"
        style={{
          alignItems:
            "flex-start"
        }}
      >
        <div>
          <h3>
            Approval Inbox
          </h3>

          <p>
            Review, edit, approve, reject, or escalate every AI-generated reply.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap"
          }}
        >
          {[
            [
              "all",
              "All"
            ],
            [
              "instagram",
              "Instagram"
            ],
            [
              "tiktok",
              "TikTok"
            ],
            [
              "youtube",
              "YouTube"
            ],
            [
              "facebook",
              "Facebook"
            ]
          ].map(
            ([
              value,
              label
            ]) => {
              const active =
                filter ===
                value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setFilter(
                      value as Filter
                    )
                  }
                  style={{
                    minHeight: 32,
                    borderRadius:
                      8,
                    border:
                      active
                        ? "1px solid #5368e8"
                        : "1px solid #e4e7ef",
                    background:
                      active
                        ? "#eef1ff"
                        : "#fff",
                    color:
                      active
                        ? "#4059d7"
                        : "#7a839d",
                    padding:
                      "0 11px",
                    fontSize: 10,
                    fontWeight:
                      800,
                    cursor:
                      "pointer"
                  }}
                >
                  {label}
                </button>
              );
            }
          )}
        </div>
      </div>

      {error ? (
        <div
          style={{
            marginBottom: 12,
            padding: 11,
            borderRadius: 9,
            border:
              "1px solid #ffd8d8",
            background:
              "#fff5f5",
            color: "#b42318",
            fontSize: 10
          }}
        >
          {error}
        </div>
      ) : null}

      {filtered.length ===
      0 ? (
        <div
          style={{
            minHeight: 210,
            border:
              "1px dashed #dfe4ef",
            borderRadius: 14,
            background:
              "#fbfcff",
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            textAlign: "center",
            padding: 22
          }}
        >
          <div>
            <strong
              style={{
                display:
                  "block",
                color:
                  "#344054",
                fontSize: 13,
                marginBottom: 5
              }}
            >
              No pending approvals
            </strong>

            <span
              style={{
                color:
                  "#8b93a7",
                fontSize: 11
              }}
            >
              Comments will appear here after the n8n collector and AI draft workflow are connected.
            </span>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 12
          }}
        >
          {filtered.map(
            (comment) => {
              const busy =
                loadingId ===
                comment.id;

              const confidence =
                comment.reply
                  ?.aiConfidence ??
                comment.aiConfidence;

              return (
                <article
                  key={
                    comment.id
                  }
                  style={{
                    border:
                      "1px solid #e5e9f2",
                    borderRadius:
                      14,
                    padding: 15,
                    background:
                      "#fff"
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      gap: 12,
                      alignItems:
                        "flex-start",
                      flexWrap:
                        "wrap",
                      marginBottom:
                        12
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display:
                            "flex",
                          gap: 7,
                          alignItems:
                            "center",
                          flexWrap:
                            "wrap"
                        }}
                      >
                        <strong
                          style={{
                            color:
                              "#27324a",
                            fontSize:
                              12
                          }}
                        >
                          {platformLabel(
                            comment.platform
                          )}
                        </strong>

                        <span
                          style={{
                            color:
                              "#8b93a7",
                            fontSize:
                              10
                          }}
                        >
                          @
                          {comment.username ||
                            "unknown"}
                        </span>

                        {comment.intent ? (
                          <span
                            style={{
                              borderRadius:
                                999,
                              padding:
                                "4px 7px",
                              background:
                                "#eef1ff",
                              color:
                                "#5368e8",
                              fontSize:
                                8,
                              fontWeight:
                                800
                            }}
                          >
                            {
                              comment.intent
                            }
                          </span>
                        ) : null}

                        {confidence !==
                        null ? (
                          <span
                            style={{
                              borderRadius:
                                999,
                              padding:
                                "4px 7px",
                              background:
                                confidence >=
                                80
                                  ? "#ecfdf3"
                                  : "#fff7ed",
                              color:
                                confidence >=
                                80
                                  ? "#067647"
                                  : "#b54708",
                              fontSize:
                                8,
                              fontWeight:
                                800
                            }}
                          >
                            AI{" "}
                            {confidence.toFixed(
                              0
                            )}
                            %
                          </span>
                        ) : null}
                      </div>

                      <span
                        style={{
                          display:
                            "block",
                          marginTop: 5,
                          color:
                            "#98a2b3",
                          fontSize: 9
                        }}
                      >
                        {formatDateTime(
                          comment.commentCreatedAt ||
                            comment.createdAt
                        )}
                      </span>
                    </div>

                    <span
                      style={{
                        borderRadius:
                          999,
                        padding:
                          "5px 8px",
                        background:
                          "#fff7ed",
                        color:
                          "#b54708",
                        fontSize: 8,
                        fontWeight:
                          800
                      }}
                    >
                      {
                        comment.status
                      }
                    </span>
                  </div>

                  <div
                    style={{
                      borderRadius:
                        11,
                      background:
                        "#f8f9fd",
                      padding: 12,
                      marginBottom:
                        12
                    }}
                  >
                    <div
                      style={{
                        color:
                          "#8b93a7",
                        fontSize: 8,
                        fontWeight:
                          900,
                        letterSpacing:
                          ".07em",
                        textTransform:
                          "uppercase",
                        marginBottom:
                          5
                      }}
                    >
                      Customer Comment
                    </div>

                    <div
                      style={{
                        color:
                          "#344054",
                        fontSize: 11,
                        lineHeight: 1.6
                      }}
                    >
                      {
                        comment.commentText
                      }
                    </div>
                  </div>

                  <label
                    style={{
                      display: "grid",
                      gap: 6
                    }}
                  >
                    <span
                      style={{
                        color:
                          "#7259dc",
                        fontSize: 8,
                        fontWeight:
                          900,
                        letterSpacing:
                          ".07em",
                        textTransform:
                          "uppercase"
                      }}
                    >
                      AI Suggested Reply — editable before approval
                    </span>

                    <textarea
                      value={
                        drafts[
                          comment.id
                        ] || ""
                      }
                      onChange={(
                        event
                      ) =>
                        setDrafts(
                          (
                            current
                          ) => ({
                            ...current,
                            [comment.id]:
                              event
                                .target
                                .value
                          })
                        )
                      }
                      rows={4}
                      style={{
                        width:
                          "100%",
                        resize:
                          "vertical",
                        boxSizing:
                          "border-box",
                        border:
                          "1px solid #dce1ef",
                        borderRadius:
                          10,
                        padding: 11,
                        font:
                          "inherit",
                        fontSize: 11,
                        lineHeight: 1.55,
                        color:
                          "#344054",
                        background:
                          "#fff"
                      }}
                    />
                  </label>

                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      gap: 10,
                      flexWrap:
                        "wrap",
                      alignItems:
                        "center",
                      marginTop: 12
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        gap: 7,
                        flexWrap:
                          "wrap"
                      }}
                    >
                      {comment.commentUrl ? (
                        <a
                          href={
                            comment.commentUrl
                          }
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            minHeight:
                              34,
                            display:
                              "inline-flex",
                            alignItems:
                              "center",
                            border:
                              "1px solid #e4e7ef",
                            borderRadius:
                              9,
                            padding:
                              "0 10px",
                            color:
                              "#667085",
                            textDecoration:
                              "none",
                            fontSize:
                              9,
                            fontWeight:
                              800
                          }}
                        >
                          Open Comment ↗
                        </a>
                      ) : null}

                      <button
                        type="button"
                        disabled={
                          busy
                        }
                        onClick={() =>
                          act(
                            comment.id,
                            "ignore"
                          )
                        }
                        style={{
                          minHeight:
                            34,
                          border:
                            "1px solid #e4e7ef",
                          borderRadius:
                            9,
                          background:
                            "#fff",
                          color:
                            "#667085",
                          padding:
                            "0 10px",
                          fontSize:
                            9,
                          fontWeight:
                            800,
                          cursor:
                            "pointer"
                        }}
                      >
                        Ignore
                      </button>

                      <button
                        type="button"
                        disabled={
                          busy
                        }
                        onClick={() =>
                          act(
                            comment.id,
                            "reject"
                          )
                        }
                        style={{
                          minHeight:
                            34,
                          border:
                            "1px solid #ffd4d4",
                          borderRadius:
                            9,
                          background:
                            "#fff7f7",
                          color:
                            "#b42318",
                          padding:
                            "0 10px",
                          fontSize:
                            9,
                          fontWeight:
                            800,
                          cursor:
                            "pointer"
                        }}
                      >
                        Reject
                      </button>

                      <button
                        type="button"
                        disabled={
                          busy
                        }
                        onClick={() =>
                          act(
                            comment.id,
                            "escalate"
                          )
                        }
                        style={{
                          minHeight:
                            34,
                          border:
                            "1px solid #fedf89",
                          borderRadius:
                            9,
                          background:
                            "#fffaeb",
                          color:
                            "#b54708",
                          padding:
                            "0 10px",
                          fontSize:
                            9,
                          fontWeight:
                            800,
                          cursor:
                            "pointer"
                        }}
                      >
                        Escalate
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={
                        busy ||
                        !(
                          drafts[
                            comment.id
                          ] || ""
                        ).trim()
                      }
                      onClick={() =>
                        act(
                          comment.id,
                          "approve"
                        )
                      }
                      style={{
                        minHeight:
                          36,
                        border: 0,
                        borderRadius:
                          9,
                        background:
                          "#4059d7",
                        color:
                          "#fff",
                        padding:
                          "0 14px",
                        fontSize:
                          10,
                        fontWeight:
                          900,
                        cursor:
                          busy
                            ? "wait"
                            : "pointer",
                        opacity:
                          (
                            drafts[
                              comment.id
                            ] || ""
                          ).trim()
                            ? 1
                            : 0.5
                      }}
                    >
                      {busy
                        ? "Saving..."
                        : "✓ Approve & Queue"}
                    </button>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}
