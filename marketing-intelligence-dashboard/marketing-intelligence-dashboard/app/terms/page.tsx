import Link from "next/link";
import styles from "../legal.module.css";

export const metadata = {
  title: "Terms of Service | Marketing Intelligence Dashboard",
  description: "Terms of Service for the Marketing Intelligence Dashboard prototype."
};

export default function TermsPage() {
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
          <h1>Terms of Service</h1>
          <p className={styles.updated}>Last updated: September 12, 2026</p>

          <section className={styles.section}>
            <h2>1. Purpose</h2>
            <p>
              Marketing Intelligence Dashboard is a private prototype used to review and analyze social media performance data for authorized accounts.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. Authorized use</h2>
            <p>
              You may use this service only for accounts that you own, manage, or are otherwise authorized to access. You are responsible for complying with the terms and policies of connected platforms, including TikTok.
            </p>
          </section>

          <section className={styles.section}>
            <h2>3. Connected platform access</h2>
            <p>
              The service may request permission to access account information, profile statistics, public content information, and performance metrics through official platform APIs. Access is limited to permissions granted by the account owner.
            </p>
          </section>

          <section className={styles.section}>
            <h2>4. Availability and changes</h2>
            <p>
              This prototype is provided for testing and internal evaluation. Features, supported metrics, and integrations may change or become unavailable when third-party platforms modify their APIs or policies.
            </p>
          </section>

          <section className={styles.section}>
            <h2>5. No misuse</h2>
            <p>You must not use the service to:</p>
            <ul>
              <li>access accounts without authorization;</li>
              <li>circumvent platform security, access controls, or rate limits;</li>
              <li>sell, redistribute, or misuse data obtained through connected APIs; or</li>
              <li>use the service for unlawful purposes.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>6. Disclaimer</h2>
            <p>
              Analytics are provided on an “as available” basis. The dashboard may display incomplete or delayed data when a connected platform limits or changes access to a metric.
            </p>
          </section>

          <section className={styles.section}>
            <h2>7. Contact</h2>
            <p>
              Questions about this prototype may be sent through the contact information associated with its TikTok Developer application.
            </p>
          </section>
        </article>

        <div className={styles.footer}>
          <span>Marketing Intelligence Dashboard</span>
          <Link href="/privacy">Privacy Policy</Link>
        </div>
      </div>
    </main>
  );
}
