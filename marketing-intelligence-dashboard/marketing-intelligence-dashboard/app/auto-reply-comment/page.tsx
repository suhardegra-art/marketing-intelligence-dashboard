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
  if (platform === "instagram") return "Instagram";
  if (platform === "youtube") return "YouTube";
  if (platform === "tiktok") return "TikTok";
  if (platform === "facebook") return "Facebook";
  return platform;
}

export default async function AutoReplyCommentPage() {
  const data =
    await getAutoReplyDashboardData();

  const collectorConfigured =
    Boolean(
      process.env.MANYCHAT_WEBHOOK_SECRET
    );

  const dispatcherConfigured =
    Boolean(
      process.env.MANYCHAT_API_KEY
    );

  const kpis = [
    {
      label: "New Comments",
      value: compact(
        data.counts.newComments
      ),
      note: "Waiting for AI draft"
    },
    {
      label: "Pending Approval",
      value: compact(
        data.counts.pendingApproval
      ),
      note: "Human review required"
    },
    {
      label: "AI Draft Ready",
      value: compact(
        data.counts.pendingApproval
      ),
      note: "Gemini-generated draft"
    },
    {
      label: "Replied Today",
      value: compact(
        data.counts.repliedToday
      ),
      note: "Approved & sent"
    },
    {
      label: "Escalated",
      value: compact(
        data.counts.escalated
      ),
      note: "Needs human handling"
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
              ManyChat intake, Vercel AI draft, mandatory human approval, and controlled dispatch
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
                  margin: "0 0 7px",
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
                  margin: "8px 0 0",
                  maxWidth: 650,
                  fontSize: 12,
                  lineHeight: 1.6,
                  color:
                    "rgba(255,255,255,.78)"
                }}
              >
                ManyChat sends the inbound event to Vercel. Gemini prepares a draft.
                The exact edited text is sent only after a dashboard user approves it.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(5,auto)",
                alignItems: "center",
                gap: 7,
                fontSize: 10,
                fontWeight: 800
              }}
            >
              {[
                "Comment / DM",
                "ManyChat",
                "Gemini",
                "Approve",
                "Send"
              ].map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7
                    }}
                  >
                    <span
                      style={{
                        display:
                          "inline-flex",
                        minHeight: 32,
                        alignItems:
                          "center",
                        padding:
                          "0 10px",
                        borderRadius: 9,
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

                    {index < 4 ? (
                      <span
                        style={{
                          opacity: 0.6
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
                key={item.label}
              >
                <p>
                  {item.label}
                </p>

                <strong>
                  {item.value}
                </strong>

                <span
                  style={{
                    display: "block",
                    marginTop: 5,
                    color: "#9aa2b7",
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
          comments={data.pending}
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
                  Current ManyChat → Vercel → approval → ManyChat architecture
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
                  "Comments, drafts, approvals, send status, and audit history"
                ],
                [
                  "Approval Dashboard",
                  "Ready",
                  "Edit, approve & send, reject, escalate, or ignore"
                ],
                [
                  "ManyChat Collector",
                  collectorConfigured
                    ? "Configured"
                    : "Missing Secret",
                  "Inbound External Request from ManyChat"
                ],
                [
                  "ManyChat Dispatcher",
                  dispatcherConfigured
                    ? "Configured"
                    : "Missing API Key",
                  "Approved Instagram DM sent with exact dashboard text"
                ]
              ].map(
                ([
                  name,
                  status,
                  detail
                ]) => {
                  const ready =
                    status ===
                      "Connected" ||
                    status ===
                      "Ready" ||
                    status ===
                      "Configured";

                  return (
                    <div
                      key={name}
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "140px 110px 1fr",
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
                          fontSize: 10
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
                            ready
                              ? "#ecfdf3"
                              : "#fff4ed",
                          color:
                            ready
                              ? "#067647"
                              : "#b54708",
                          fontSize: 8,
                          fontWeight: 800
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
                  );
                }
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
                  Exact-text human approval before ManyChat dispatch
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 9,
                color: "#59617a",
                fontSize: 10,
                lineHeight: 1.55
              }}
            >
              <div>
                ✓ AI draft remains editable before approval.
              </div>

              <div>
                ✓ Approve asks for confirmation before sending.
              </div>

              <div>
                ✓ ManyChat receives the exact approved text.
              </div>

              <div>
                ✓ Failed sends return to Pending Approval for retry.
              </div>

              <div>
                ✓ Reject, Ignore, and Escalate never dispatch.
              </div>

              <div>
                ✓ Sent time and dispatcher activity are stored in Supabase.
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
                Audit trail for reviewed and dispatched replies
              </p>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Updated</th>
                  <th>Platform</th>
                  <th>Comment</th>
                  <th>Action</th>
                  <th>Reviewer</th>
                  <th>Note</th>
                </tr>
              </thead>

              <tbody>
                {data.recentActivity.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
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
                    (item) => (
                      <tr
                        key={item.id}
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
                            maxWidth: 360
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
          Auto Reply Comment • ManyChat + Vercel Human-in-the-loop Customer Care
        </footer>
      </main>
    </div>
  );
}
