import Link from "next/link";
import styles from "../legal.module.css";

export const metadata = {
  title: "Terms of Service | Marketing Intelligence Dashboard",
  description:
    "Terms of Service for the Indomobil eMotor Marketing Intelligence Dashboard and connected social media integrations.",
};

export default function TermsPage() {
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
          <h1>Terms of Service</h1>

          <p className={styles.updated}>
            Last updated: September 18, 2026
          </p>

          <section className={styles.section}>
            <h2>1. Purpose</h2>

            <p>
              The Indomobil eMotor Marketing Intelligence Dashboard is an
              internal and authorized business tool used to review, analyze,
              and manage social media information and engagement across
              supported platforms.
            </p>

            <p>
              Supported integrations may include Facebook, Instagram, TikTok,
              YouTube, and related platform services.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. Authorized use</h2>

            <p>
              You may use this service only for social media accounts, Pages,
              profiles, channels, or business assets that you own, manage, or
              are otherwise authorized to access.
            </p>

            <p>
              You are responsible for ensuring that your use of the dashboard
              complies with all applicable laws and the terms, policies, and
              developer requirements of each connected platform.
            </p>
          </section>

          <section className={styles.section}>
            <h2>3. Connected platform access</h2>

            <p>
              The service may request permission to access information through
              official APIs provided by Facebook, Instagram, TikTok, YouTube,
              Google, and related platform services.
            </p>

            <p>
              Access is limited to permissions granted by the authorized
              account owner or administrator and may include account
              information, public content, analytics, engagement data,
              comments, and replies.
            </p>
          </section>

          <section className={styles.section}>
            <h2>4. Social media engagement features</h2>

            <p>
              The dashboard may include tools for monitoring incoming comments,
              generating AI-assisted reply drafts, reviewing proposed
              responses, approving or rejecting drafts, and publishing
              approved replies through supported platform APIs.
            </p>

            <p>
              Where human approval is enabled, AI-generated responses are not
              intended to be published until they have been reviewed and
              approved by an authorized user.
            </p>
          </section>

          <section className={styles.section}>
            <h2>5. Artificial intelligence features</h2>

            <p>
              Artificial intelligence may be used to classify social media
              interactions, analyze sentiment or intent, and generate suggested
              responses.
            </p>

            <p>
              AI-generated content may contain errors, incomplete information,
              or inappropriate suggestions. Authorized users are responsible
              for reviewing content before approval or publication where review
              is required.
            </p>
          </section>

          <section className={styles.section}>
            <h2>6. Platform-specific terms</h2>

            <h3>Facebook and Instagram</h3>

            <p>
              Use of Facebook and Instagram integrations is subject to Meta's
              applicable terms, platform policies, permissions, and developer
              requirements.
            </p>

            <h3>TikTok</h3>

            <p>
              Use of TikTok integrations is subject to TikTok's applicable
              terms, developer policies, and API requirements.
            </p>

            <h3>YouTube</h3>

            <p>
              Use of YouTube integrations is subject to the YouTube Terms of
              Service and the policies governing YouTube API Services.
            </p>

            <p>
              YouTube Terms of Service are available at{" "}
              <a
                href="https://www.youtube.com/t/terms"
                target="_blank"
                rel="noreferrer"
              >
                YouTube Terms of Service
              </a>
              .
            </p>
          </section>

          <section className={styles.section}>
            <h2>7. No misuse</h2>

            <p>You must not use the service to:</p>

            <ul>
              <li>access accounts or business assets without authorization;</li>
              <li>
                circumvent platform security, authentication, access controls,
                or rate limits;
              </li>
              <li>
                collect, use, sell, redistribute, or disclose platform data in
                violation of applicable policies;
              </li>
              <li>
                send spam, deceptive, abusive, unlawful, or unauthorized
                automated communications;
              </li>
              <li>
                impersonate another person, organization, or account without
                authorization;
              </li>
              <li>
                interfere with the availability, security, or operation of the
                connected platforms or dashboard; or
              </li>
              <li>use the service for unlawful purposes.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>8. Data and privacy</h2>

            <p>
              Information processed through the dashboard is handled in
              accordance with our{" "}
              <Link href="/privacy">
                Privacy Policy
              </Link>
              .
            </p>

            <p>
              Instructions for requesting deletion of stored data are available
              on our{" "}
              <Link href="/data-deletion">
                Data Deletion page
              </Link>
              .
            </p>
          </section>

          <section className={styles.section}>
            <h2>9. Access tokens and credentials</h2>

            <p>
              Users must not intentionally disclose, misuse, share, or expose
              authentication credentials, API keys, or access tokens used by
              the service.
            </p>

            <p>
              Access credentials may be revoked when access is no longer
              required or when unauthorized use is suspected.
            </p>
          </section>

          <section className={styles.section}>
            <h2>10. Availability and platform changes</h2>

            <p>
              The availability of dashboard features depends on APIs, services,
              permissions, and policies provided by third-party platforms.
            </p>

            <p>
              Features, metrics, permissions, and integrations may be changed,
              suspended, limited, or discontinued when a connected platform
              changes its API or policies.
            </p>
          </section>

          <section className={styles.section}>
            <h2>11. Accuracy and disclaimer</h2>

            <p>
              The service is provided on an "as available" basis. Analytics,
              metrics, AI-generated content, and synchronized social media data
              may be delayed, incomplete, or inaccurate.
            </p>

            <p>
              Users remain responsible for reviewing information and decisions
              made using the dashboard.
            </p>
          </section>

          <section className={styles.section}>
            <h2>12. Suspension or termination</h2>

            <p>
              Access to the service may be restricted or terminated when
              unauthorized access, misuse, security concerns, or violations of
              applicable platform policies are identified.
            </p>
          </section>

          <section className={styles.section}>
            <h2>13. Changes to these terms</h2>

            <p>
              These Terms of Service may be updated when dashboard features,
              integrations, applicable laws, or platform requirements change.
              The latest version will be published on this page.
            </p>
          </section>

          <section className={styles.section}>
            <h2>14. Contact</h2>

            <p>
              Questions regarding these Terms of Service may be sent to:
            </p>

            <p>
              <strong>indomobilemotorofficial@gmail.com</strong>
            </p>
          </section>
        </article>

        <div className={styles.footer}>
          <span>Marketing Intelligence Dashboard • Indomobil eMotor</span>

          <Link href="/privacy">
            Privacy Policy
          </Link>

          <Link href="/data-deletion">
            Data Deletion
          </Link>
        </div>
      </div>
    </main>
  );
}