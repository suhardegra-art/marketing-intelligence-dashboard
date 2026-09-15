import Sidebar from "@/components/Sidebar";
import AutoReplyApprovalInbox from "@/components/AutoReplyApprovalInbox";

import {
  getAutoReplyDashboardData
} from "@/lib/auto-reply-comments";

export const dynamic =
  "force-dynamic";

function compact(
  value: number
) {
  return new Intl.NumberFormat(
    "en-US"
  ).format(value);
}

function formatDateTime(
  value: string
) {
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

export default async function AutoReplyCommentPage() {
  const data =
    await getAutoReplyDashboardData();

  const kpis = [
    {
      label:
        "New Comments",
      value:
        compact(
          data.counts
            .newComments
        ),
      note:
        "Waiting for AI draft"
    },
    {
      label:
        "Pending Approval",
      value:
        compact(
          data.counts
            .pendingApproval
        ),
      note:
        "Human review required"
    },
    {
      label:
        "AI Draft Ready",
      value:
        compact(
          data.counts
            .aiDraftReady
        ),
      note:
        "Gemini-generated replies"
    },
    {
      label:
        "Replied Today",
      value:
        compact(
          data.counts
            .repliedToday
        ),
      note:
        "Approved & sent"
    },
    {
      label:
        "Escalated",
      value:
        compact(
          data.counts
            .escalated
        ),
      note:
        "Needs human handling"
    }
  ];

  return (
    <div className="app-shell">
      <Sidebar activeItem="Auto Reply Comment" />

      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>
              Auto Reply Comment
            </h1>

            <p>
              AI-assisted social media comment response with mandatory human approval
            </p>
          </div>

          <div className="topbar-actions">
            <div className="period-select">
              <span>
                MODE
              </span>

              <strong>
                Approval Required
              </strong>
            </div>

            <div className="avatar">
              AI
            </div>

            <form
              action="/api/logout"
              method="post"
            >
              <button className="logout-button">
                Logout
              </button>
            </form>
          </div>
        </header>

        <section
          style={{
            borderRadius: 18,
            padding: "26px 28px",
            marginBottom: 16,
            background:
              "linear-gradient(120deg,#243db7 0%,#624edc 54%,#b459cc 100%)",
            color: "#fff",
            boxShadow:
              "0 12px 30px rgba(45,44,120,.14)"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              gap: 24,
              alignItems:
                "center",
              flexWrap:
                "wrap"
            }}
          >
            <div>
              <p
                style={{
                  margin:
                    "0 0 7px",
                  fontSize: 9,
                  fontWeight: 900,
                  letterSpacing:
                    ".14em",
                  color:
                    "rgba(255,255,255,.76)"
                }}
              >
                SOCIAL CUSTOMER CARE AI
              </p>

              <h2
                style={{
                  margin: 0,
                  fontSize: 28
                }}
              >
                AI Reply Approval Center
              </h2>

              <p
                style={{
                  margin:
                    "8px 0 0",
                  maxWidth: 650,
                  fontSize: 12,
                  lineHeight: 1.6,
                  color:
                    "rgba(255,255,255,.78)"
                }}
              >
                AI drafts can be reviewed, edited, approved, rejected, or escalated here.
                Approved replies are only queued — they are not sent until the dispatcher workflow is connected.
              </p>
            </div>

            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(5,auto)",
                alignItems:
                  "center",
                gap: 7,
                fontSize: 10,
                fontWeight: 800
              }}
            >
              {[
                "Comment",
                "n8n",
                "Gemini",
                "Approve",
                "Reply"
              ].map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={
                      item
                    }
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap: 7
                    }}
                  >
                    <span
                      style={{
                        display:
                          "inline-flex",
                        minHeight:
                          32,
                        alignItems:
                          "center",
                        padding:
                          "0 10px",
                        borderRadius:
                          9,
                        border:
                          "1px solid rgba(255,255,255,.24)",
                        background:
                          "rgba(255,255,255,.10)",
                        whiteSpace:
                          "nowrap"
                      }}
                    >
                      {item}
                    </span>

                    {index <
                    4 ? (
                      <span
                        style={{
                          opacity:
                            0.6
                        }}
                      >
                        →
                      </span>
                    ) : null}
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(5,minmax(0,1fr))",
            gap: 12,
            marginBottom: 16
          }}
        >
          {kpis.map(
            (item) => (
              <article
                className="kpi-card"
                key={
                  item.label
                }
              >
                <p>
                  {item.label}
                </p>

                <strong>
                  {item.value}
                </strong>

                <span
                  style={{
                    display:
                      "block",
                    marginTop: 5,
                    color:
                      "#9aa2b7",
                    fontSize: 9
                  }}
                >
                  {item.note}
                </span>
              </article>
            )
          )}
        </section>

        <AutoReplyApprovalInbox
          comments={
            data.pending
          }
        />

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "1.15fr .85fr",
            gap: 12,
            marginBottom: 16
          }}
        >
          <article className="panel">
            <div className="panel-header">
              <div>
                <h3>
                  Workflow Status
                </h3>

                <p>
                  Current approval layer is active and ready for n8n ingestion
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 9
              }}
            >
              {[
                [
                  "Supabase",
                  "Connected",
                  "Comments, drafts, approvals, and activity history"
                ],
                [
                  "Approval Dashboard",
                  "Ready",
                  "Approve, edit, reject, escalate, or ignore"
                ],
                [
                  "n8n Collector",
                  "Next Step",
                  "Will insert incoming comments and AI drafts"
                ],
                [
                  "Reply Dispatcher",
                  "Not Active",
                  "Will only read APPROVED comments"
                ]
              ].map(
                ([
                  name,
                  status,
                  detail
                ]) => (
                  <div
                    key={
                      name
                    }
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "130px 100px 1fr",
                      gap: 10,
                      alignItems:
                        "center",
                      padding:
                        "10px 0",
                      borderBottom:
                        "1px solid #eef0f6"
                    }}
                  >
                    <strong
                      style={{
                        color:
                          "#344054",
                        fontSize:
                          10
                      }}
                    >
                      {name}
                    </strong>

                    <span
                      style={{
                        borderRadius:
                          999,
                        padding:
                          "5px 8px",
                        textAlign:
                          "center",
                        background:
                          status ===
                            "Connected" ||
                          status ===
                            "Ready"
                            ? "#ecfdf3"
                            : "#f7f8fc",
                        color:
                          status ===
                            "Connected" ||
                          status ===
                            "Ready"
                            ? "#067647"
                            : "#667085",
                        fontSize:
                          8,
                        fontWeight:
                          800
                      }}
                    >
                      {status}
                    </span>

                    <span
                      style={{
                        color:
                          "#8b93a7",
                        fontSize: 9
                      }}
                    >
                      {detail}
                    </span>
                  </div>
                )
              )}
            </div>
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <h3>
                  Approval Guardrails
                </h3>

                <p>
                  No public reply can be sent from this stage automatically
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 9,
                color:
                  "#59617a",
                fontSize: 10,
                lineHeight: 1.55
              }}
            >
              <div>
                ✓ AI draft remains editable before approval.
              </div>

              <div>
                ✓ Approved status only queues the reply.
              </div>

              <div>
                ✓ Reject and Ignore prevent dispatch.
              </div>

              <div>
                ✓ Escalated comments leave the automation queue.
              </div>

              <div>
                ✓ Approval actions are saved in an audit trail.
              </div>
            </div>
          </article>
        </section>

        <section className="panel table-panel">
          <div className="panel-header">
            <div>
              <h3>
                Recent Approval Activity
              </h3>

              <p>
                Audit trail for reviewed comments and replies
              </p>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>
                    Updated
                  </th>
                  <th>
                    Platform
                  </th>
                  <th>
                    Comment
                  </th>
                  <th>
                    Action
                  </th>
                  <th>
                    Reviewer
                  </th>
                  <th>
                    Note
                  </th>
                </tr>
              </thead>

              <tbody>
                {data
                  .recentActivity
                  .length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={
                        6
                      }
                      style={{
                        textAlign:
                          "center",
                        color:
                          "#9aa2b7",
                        padding:
                          "28px 12px"
                      }}
                    >
                      No approval activity yet.
                    </td>
                  </tr>
                ) : (
                  data.recentActivity.map(
                    (
                      item
                    ) => (
                      <tr
                        key={
                          item.id
                        }
                      >
                        <td>
                          {formatDateTime(
                            item.createdAt
                          )}
                        </td>

                        <td>
                          {platformLabel(
                            item.platform
                          )}
                        </td>

                        <td
                          style={{
                            maxWidth:
                              360
                          }}
                        >
                          <div
                            style={{
                              overflow:
                                "hidden",
                              whiteSpace:
                                "nowrap",
                              textOverflow:
                                "ellipsis"
                            }}
                          >
                            {item.commentText ||
                              "—"}
                          </div>
                        </td>

                        <td>
                          {item.action}
                        </td>

                        <td>
                          {item.actor ||
                            "—"}
                        </td>

                        <td>
                          {item.note ||
                            "—"}
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer>
          Auto Reply Comment • Human-in-the-loop Social Customer Care
        </footer>
      </main>
    </div>
  );
}
