import Link from "next/link";
import styles from "../legal.module.css";

export const metadata = {
  title: "Data Deletion | Marketing Intelligence Dashboard",
  description:
    "Data deletion instructions for the Indomobil eMotor Marketing Intelligence Dashboard.",
};

export default function DataDeletionPage() {
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
          <h1>Data Deletion Instructions</h1>

          <p className={styles.updated}>
            Last updated: September 18, 2026
          </p>

          <section className={styles.section}>
            <h2>1. Requesting deletion</h2>

            <p>
              Users may request deletion of data associated with a connected
              Facebook, Instagram, TikTok, or YouTube account that has been
              processed by the Marketing Intelligence Dashboard.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. How to submit a request</h2>

            <p>
              Please send a data deletion request to:
            </p>

            <p>
              <strong>indomobilemotorofficial@gmail.com</strong>
            </p>

            <p>Please include the following information:</p>

            <ul>
              <li>your name or organization name;</li>
              <li>the social media platform involved;</li>
              <li>
                the relevant account, Page, profile, channel, or username;
              </li>
              <li>
                a brief description of the data you want deleted; and
              </li>
              <li>
                contact information so we can confirm completion of the request.
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>3. Data that may be deleted</h2>

            <p>
              Depending on the connected platform and features used, deletion
              may include:
            </p>

            <ul>
              <li>connected account or profile information;</li>
              <li>social media content metadata;</li>
              <li>analytics and engagement data;</li>
              <li>comments and reply records;</li>
              <li>AI-generated reply drafts;</li>
              <li>approval and activity logs;</li>
              <li>technical synchronization records; and</li>
              <li>
                stored access credentials or tokens where applicable.
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>4. Processing time</h2>

            <p>
              We will review valid deletion requests as soon as reasonably
              possible. Where applicable, deletion requests involving data
              obtained through connected platform APIs will be processed within
              seven days.
            </p>
          </section>

          <section className={styles.section}>
            <h2>5. Disconnecting platform access</h2>

            <p>
              Users may also revoke application access directly through the
              account settings of Facebook, Instagram, TikTok, Google, or
              YouTube. Revoking access prevents future API access but may not
              automatically delete information already stored by this
              application.
            </p>
          </section>

          <section className={styles.section}>
            <h2>6. Confirmation</h2>

            <p>
              After a valid deletion request has been completed, we may send a
              confirmation to the contact information supplied in the request.
            </p>
          </section>

          <section className={styles.section}>
            <h2>7. Contact</h2>

            <p>
              For questions regarding data deletion or privacy, contact:
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

          <Link href="/terms">
            Terms of Service
          </Link>
        </div>
      </div>
    </main>
  );
}