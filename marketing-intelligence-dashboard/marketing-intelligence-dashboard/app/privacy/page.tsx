import Link from "next/link";
import styles from "../legal.module.css";

export const metadata = {
  title: "Privacy Policy | Marketing Intelligence Dashboard",
  description:
    "Privacy Policy for the Indomobil eMotor Marketing Intelligence Dashboard and connected social media integrations.",
};

export default function PrivacyPage() {
  return (
    <main className={styles.shell}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <div className={styles.mark}>MI</div>

          <div className={styles.brandText}>
            <strong>Marketing Intelligence Dashboard</strong>
            <span>Indomobil eMotor</span>
          </div>
        </div>

        <article className={styles.card}>
          <h1>Privacy Policy</h1>

          <p className={styles.updated}>
            Last updated: September 18, 2026
          </p>

          <section className={styles.section}>
            <h2>1. Scope of this policy</h2>

            <p>
              This Privacy Policy explains how the Indomobil eMotor Marketing
              Intelligence Dashboard processes information obtained through
              authorized social media integrations.
            </p>

            <p>
              The dashboard may connect to official APIs provided by Facebook,
              Instagram, TikTok, YouTube, and related platform services.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. Information we may process</h2>

            <p>
              Depending on the platform, permissions granted, and features being
              used, the dashboard may process:
            </p>

            <ul>
              <li>basic account, Page, profile, or channel information;</li>
              <li>usernames, display names, and public profile information;</li>
              <li>public posts, videos, reels, and content metadata;</li>
              <li>publishing dates and public content links;</li>
              <li>
                engagement data such as views, likes, shares, comments, and
                follower statistics;
              </li>
              <li>comments and replies associated with managed accounts;</li>
              <li>social media analytics and historical performance data;</li>
              <li>technical synchronization and API activity records;</li>
              <li>AI-generated reply drafts;</li>
              <li>human approval and response activity records; and</li>
              <li>
                authentication tokens required to maintain authorized API
                connections.
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>3. Platform-specific data</h2>

            <h3>Facebook and Instagram</h3>

            <p>
              When an authorized Meta account, Facebook Page, or Instagram
              account is connected, the dashboard may process Page or account
              information, public content, engagement metrics, comments, and
              replies where permitted by Meta APIs and the permissions granted
              to the application.
            </p>

            <h3>TikTok</h3>

            <p>
              When an authorized TikTok account is connected, the dashboard may
              process account information, public video information, audience
              statistics, and performance metrics made available through
              approved TikTok APIs.
            </p>

            <h3>YouTube</h3>

            <p>
              When an authorized YouTube channel is connected, the dashboard may
              process channel information, public video metadata, analytics,
              engagement metrics, and other information available through
              YouTube API Services.
            </p>
          </section>

          <section className={styles.section}>
            <h2>4. How information is used</h2>

            <p>Information may be used to:</p>

            <ul>
              <li>display social media analytics and performance dashboards;</li>
              <li>compare account and content performance over time;</li>
              <li>support internal marketing reporting and analysis;</li>
              <li>monitor engagement and incoming social media comments;</li>
              <li>
                generate AI-assisted draft responses to customer comments;
              </li>
              <li>
                allow authorized users to review, edit, approve, reject, or
                escalate suggested responses;
              </li>
              <li>
                publish approved responses through official platform APIs where
                that functionality is enabled;
              </li>
              <li>maintain historical reporting records;</li>
              <li>maintain and troubleshoot API integrations; and</li>
              <li>protect the security and reliability of the application.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>5. AI-assisted processing</h2>

            <p>
              The dashboard may use artificial intelligence services to analyze
              social media comments and generate suggested responses.
            </p>

            <p>
              Where human approval is configured, AI-generated replies remain
              drafts until an authorized user reviews and approves them.
            </p>
          </section>

          <section className={styles.section}>
            <h2>6. Authentication and access tokens</h2>

            <p>
              Official authentication methods such as OAuth may be used to
              connect supported social media accounts.
            </p>

            <p>
              Access tokens and API credentials are intended to be stored in
              protected server-side systems and are not intentionally exposed
              through the public browser interface.
            </p>

            <p>
              The dashboard does not require users to provide their social media
              account passwords directly to the application.
            </p>
          </section>

          <section className={styles.section}>
            <h2>7. Storage and security</h2>

            <p>
              Information may be stored in databases and infrastructure used to
              operate the Marketing Intelligence Dashboard.
            </p>

            <p>
              Reasonable administrative and technical measures are used to
              protect stored information and API credentials from unauthorized
              access, disclosure, alteration, or loss.
            </p>
          </section>

          <section className={styles.section}>
            <h2>8. Data sharing and sale</h2>

            <p>
              Personal information obtained through connected platform APIs is
              not sold.
            </p>

            <p>
              Information may be processed by service providers required to
              operate the application, including hosting, database,
              authentication, automation, and AI infrastructure providers.
            </p>
          </section>

          <section className={styles.section}>
            <h2>9. Retention and deletion</h2>

            <p>
              Information is retained only for as long as reasonably necessary
              for the purposes described in this policy, internal reporting,
              troubleshooting, security, or legal obligations.
            </p>

            <p>
              Users may request deletion of information associated with a
              connected account.
            </p>

            <p>
              Instructions are available on our{" "}
              <Link href="/data-deletion">
                Data Deletion page
              </Link>
              .
            </p>
          </section>

          <section className={styles.section}>
            <h2>10. Revoking platform access</h2>

            <p>
              Users may revoke application access through the account settings
              provided by Facebook, Instagram, TikTok, Google, or YouTube.
            </p>

            <p>
              Revoking access prevents future API access but may not
              automatically remove data previously stored by this application.
              A separate deletion request may therefore be required.
            </p>
          </section>

          <section className={styles.section}>
            <h2>11. Third-party platforms</h2>

            <p>
              Facebook, Instagram, TikTok, Google, and YouTube operate under
              their own privacy policies, terms, and developer policies.
            </p>

            <p>
              Use of information received from platform APIs is also subject to
              the applicable platform policies and permissions.
            </p>

            <p>
              YouTube API Services are provided by Google. Users may review
              Google's Privacy Policy at{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noreferrer"
              >
                Google Privacy Policy
              </a>
              .
            </p>
          </section>

          <section className={styles.section}>
            <h2>12. Changes to this policy</h2>

            <p>
              This Privacy Policy may be updated when integrations, platform
              requirements, or application features change. The latest version
              will be published on this page.
            </p>
          </section>

          <section className={styles.section}>
            <h2>13. Contact</h2>

            <p>
              Questions about privacy, platform data, or deletion requests may
              be sent to:
            </p>

            <p>
              <strong>indomobilemotorofficial@gmail.com</strong>
            </p>
          </section>
        </article>

        <div className={styles.footer}>
          <span>Marketing Intelligence Dashboard • Indomobil eMotor</span>

          <Link href="/terms">
            Terms of Service
          </Link>

          <Link href="/data-deletion">
            Data Deletion
          </Link>
        </div>
      </div>
    </main>
  );
}