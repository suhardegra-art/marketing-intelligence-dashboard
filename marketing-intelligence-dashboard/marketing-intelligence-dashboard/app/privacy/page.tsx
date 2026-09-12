import Link from "next/link";
import styles from "../legal.module.css";

export const metadata = {
  title: "Privacy Policy | Marketing Intelligence Dashboard",
  description: "Privacy Policy for the Marketing Intelligence Dashboard prototype."
};

export default function PrivacyPage() {
  return (
    <main className={styles.shell}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <div className={styles.mark}>MI</div>
          <div className={styles.brandText}>
            <strong>Marketing Intelligence Dashboard</strong>
            <span>Personal analytics prototype</span>
          </div>
        </div>

        <article className={styles.card}>
          <h1>Privacy Policy</h1>
          <p className={styles.updated}>Last updated: September 12, 2026</p>

          <section className={styles.section}>
            <h2>1. Information we process</h2>
            <p>
              When an authorized TikTok account is connected, the dashboard may process information made available through approved TikTok APIs, such as:
            </p>
            <ul>
              <li>basic account and profile information;</li>
              <li>follower, following, like, and public video counts when permitted;</li>
              <li>public video metadata, including publishing date and links;</li>
              <li>video performance metrics such as views, likes, comment counts, and share counts when available; and</li>
              <li>technical synchronization information required to keep dashboard data current.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>2. How information is used</h2>
            <p>Information is used only to:</p>
            <ul>
              <li>display social media analytics and historical performance;</li>
              <li>compare account and content performance over time;</li>
              <li>support internal reporting and analysis; and</li>
              <li>maintain and troubleshoot the API integration.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>3. Storage and security</h2>
            <p>
              Analytics data may be stored in the project database used by this dashboard. API credentials and access tokens are intended to be kept in protected server-side configuration and are not intentionally exposed in the public browser interface.
            </p>
          </section>

          <section className={styles.section}>
            <h2>4. Data sharing</h2>
            <p>
              Personal information obtained through connected platform APIs is not sold. Data is used only for the operation of this private prototype and may be processed by infrastructure providers required to host the application and database.
            </p>
          </section>

          <section className={styles.section}>
            <h2>5. Retention and deletion</h2>
            <p>
              Access to a connected TikTok account can be revoked through TikTok account settings. Data stored by this prototype may also be deleted when it is no longer needed for testing or when deletion is requested by the authorized account owner.
            </p>
          </section>

          <section className={styles.section}>
            <h2>6. Third-party services</h2>
            <p>
              TikTok and other connected platforms operate under their own privacy policies and terms. This policy applies only to the Marketing Intelligence Dashboard prototype.
            </p>
          </section>

          <section className={styles.section}>
            <h2>7. Contact</h2>
            <p>
              Privacy questions or data deletion requests may be submitted through the contact information associated with this application’s TikTok Developer account.
            </p>
          </section>
        </article>

        <div className={styles.footer}>
          <span>Marketing Intelligence Dashboard</span>
          <Link href="/terms">Terms of Service</Link>
        </div>
      </div>
    </main>
  );
}
