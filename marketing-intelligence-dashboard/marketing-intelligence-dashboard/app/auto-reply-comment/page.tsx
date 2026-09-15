import Sidebar from "@/components/Sidebar";

export const dynamic = "force-dynamic";

const kpis = [
  { label: "New Comments", value: "0", note: "Waiting for integrations" },
  { label: "Pending Approval", value: "0", note: "Human review required" },
  { label: "AI Draft Ready", value: "0", note: "Gemini-generated replies" },
  { label: "Replied Today", value: "0", note: "Approved & sent" },
  { label: "Escalated", value: "0", note: "Needs human handling" }
];

const connections = [
  {
    platform: "Instagram",
    detail: "Meta comment webhook + reply API",
    status: "Not configured",
    badge: "IG"
  },
  {
    platform: "TikTok",
    detail: "Comment capability to be verified",
    status: "Pending API",
    badge: "TT"
  },
  {
    platform: "YouTube",
    detail: "YouTube comments + reply API",
    status: "Not configured",
    badge: "YT"
  },
  {
    platform: "n8n",
    detail: "Collector, AI draft & reply dispatcher",
    status: "Not connected",
    badge: "n8n"
  }
];

const policies = [
  "AI only prepares a reply draft — it cannot send automatically.",
  "Every reply must be approved by a human before dispatch.",
  "Reviewer can edit the AI draft before approving.",
  "Low-confidence, complaint, legal, warranty, or unknown questions are escalated.",
  "All approval and reply activity will be stored for audit and reporting."
];

export default function AutoReplyCommentPage() {
  return (
    <div className="app-shell">
      <Sidebar activeItem="Auto Reply Comment" />

      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>Auto Reply Comment</h1>
            <p>
              AI-assisted social media comment response with mandatory human approval
            </p>
          </div>

          <div className="topbar-actions">
            <div className="period-select">
              <span>MODE</span>
              <strong>Approval Required</strong>
            </div>

            <div className="avatar">AI</div>

            <form action="/api/logout" method="post">
              <button className="logout-button">Logout</button>
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
            boxShadow: "0 12px 30px rgba(45,44,120,.14)"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 24,
              alignItems: "center",
              flexWrap: "wrap"
            }}
          >
            <div>
              <p
                style={{
                  margin: "0 0 7px",
                  fontSize: 9,
                  fontWeight: 900,
                  letterSpacing: ".14em",
                  color: "rgba(255,255,255,.76)"
                }}
              >
                SOCIAL CUSTOMER CARE AI
              </p>

              <h2 style={{ margin: 0, fontSize: 28 }}>
                AI Reply Approval Center
              </h2>

              <p
                style={{
                  margin: "8px 0 0",
                  maxWidth: 650,
                  fontSize: 12,
                  lineHeight: 1.6,
                  color: "rgba(255,255,255,.78)"
                }}
              >
                Collect comments from Instagram, TikTok, and YouTube.
                Gemini creates the draft, your team reviews it, and n8n sends
                the approved reply back to the correct platform.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5,auto)",
                alignItems: "center",
                gap: 7,
                fontSize: 10,
                fontWeight: 800
              }}
            >
              {["Comment", "n8n", "Gemini", "Approve", "Reply"].map(
                (item, index) => (
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
                        display: "inline-flex",
                        minHeight: 32,
                        alignItems: "center",
                        padding: "0 10px",
                        borderRadius: 9,
                        border: "1px solid rgba(255,255,255,.24)",
                        background: "rgba(255,255,255,.10)",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {item}
                    </span>

                    {index < 4 ? (
                      <span style={{ opacity: 0.6 }}>→</span>
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
            gridTemplateColumns: "repeat(5,minmax(0,1fr))",
            gap: 12,
            marginBottom: 16
          }}
        >
          {kpis.map((item) => (
            <article className="kpi-card" key={item.label}>
              <p>{item.label}</p>
              <strong>{item.value}</strong>
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
          ))}
        </section>

        <section className="panel" style={{ marginBottom: 16, padding: 16 }}>
          <div className="panel-header" style={{ alignItems: "flex-start" }}>
            <div>
              <h3>Approval Inbox</h3>
              <p>
                Incoming comments will appear here after n8n and platform
                connectors are activated.
              </p>
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["All", "Instagram", "TikTok", "YouTube"].map(
                (label, index) => (
                  <button
                    key={label}
                    type="button"
                    disabled
                    style={{
                      minHeight: 32,
                      borderRadius: 8,
                      border:
                        index === 0
                          ? "1px solid #5368e8"
                          : "1px solid #e4e7ef",
                      background: index === 0 ? "#eef1ff" : "#fff",
                      color: index === 0 ? "#4059d7" : "#7a839d",
                      padding: "0 11px",
                      fontSize: 10,
                      fontWeight: 800,
                      opacity: 1
                    }}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </div>

          <div
            style={{
              minHeight: 230,
              border: "1px dashed #dfe4ef",
              borderRadius: 14,
              background: "#fbfcff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: 22
            }}
          >
            <div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  margin: "0 auto 12px",
                  borderRadius: 14,
                  background: "linear-gradient(135deg,#eef1ff,#f5edff)",
                  color: "#5368e8",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 20,
                  fontWeight: 900
                }}
              >
                AI
              </div>

              <strong
                style={{
                  display: "block",
                  color: "#344054",
                  fontSize: 13,
                  marginBottom: 5
                }}
              >
                No live comments yet
              </strong>

              <span
                style={{
                  color: "#8b93a7",
                  fontSize: 11,
                  lineHeight: 1.6
                }}
              >
                Next step: connect Instagram / YouTube comments to n8n,
                then save the AI draft into Supabase for approval here.
              </span>
            </div>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1.15fr .85fr",
            gap: 12,
            marginBottom: 16
          }}
        >
          <article className="panel">
            <div className="panel-header">
              <div>
                <h3>Automation Connections</h3>
                <p>Readiness of each source and workflow connector</p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                gap: 10
              }}
            >
              {connections.map((item) => (
                <div
                  key={item.platform}
                  style={{
                    border: "1px solid #e8ebf3",
                    borderRadius: 12,
                    padding: 13,
                    background: "#fff"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      alignItems: "flex-start"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 9,
                        alignItems: "center"
                      }}
                    >
                      <div
                        style={{
                          minWidth: 34,
                          height: 34,
                          borderRadius: 9,
                          background: "#f4f6fb",
                          display: "grid",
                          placeItems: "center",
                          color: "#5364d8",
                          fontSize: 10,
                          fontWeight: 900
                        }}
                      >
                        {item.badge}
                      </div>

                      <div>
                        <strong
                          style={{
                            display: "block",
                            color: "#27324a",
                            fontSize: 11
                          }}
                        >
                          {item.platform}
                        </strong>

                        <span
                          style={{
                            display: "block",
                            marginTop: 3,
                            color: "#8b93a7",
                            fontSize: 9,
                            lineHeight: 1.45
                          }}
                        >
                          {item.detail}
                        </span>
                      </div>
                    </div>

                    <span
                      style={{
                        borderRadius: 999,
                        padding: "5px 8px",
                        background: "#f7f8fc",
                        color: "#7a839d",
                        border: "1px solid #e7eaf2",
                        fontSize: 8,
                        fontWeight: 800,
                        whiteSpace: "nowrap"
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <h3>Approval Policy</h3>
                <p>Guardrails before any public reply is sent</p>
              </div>
            </div>

            <div style={{ display: "grid", gap: 9 }}>
              {policies.map((policy, index) => (
                <div
                  key={policy}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "24px 1fr",
                    gap: 9,
                    alignItems: "start"
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 999,
                      background: "#eef1ff",
                      color: "#5368e8",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 9,
                      fontWeight: 900
                    }}
                  >
                    {index + 1}
                  </span>

                  <span
                    style={{
                      color: "#59617a",
                      fontSize: 10,
                      lineHeight: 1.55
                    }}
                  >
                    {policy}
                  </span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="panel table-panel">
          <div className="panel-header">
            <div>
              <h3>Recent Approval Activity</h3>
              <p>Audit trail for reviewed comments and replies</p>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Comment</th>
                  <th>Intent</th>
                  <th>AI Confidence</th>
                  <th>Reviewer</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      color: "#9aa2b7",
                      padding: "28px 12px"
                    }}
                  >
                    No approval activity yet. Live data will appear after the
                    comment collector is connected.
                  </td>
                </tr>
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
