import {
  type YouTubePreviewContent,
  youtubeEngagementRate
} from "../youtubePreviewData";

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

export default function YouTubeContentPerformanceAI({
  rows
}: {
  rows: YouTubePreviewContent[];
}) {
  const views = rows.reduce((sum, row) => sum + row.views, 0);
  const engagements = rows.reduce(
    (sum, row) => sum + row.likes + row.comments + row.shares,
    0
  );
  const engagementRate = views ? (engagements / views) * 100 : 0;
  const averageViewed = rows.length
    ? rows.reduce((sum, row) => sum + row.avgViewed, 0) / rows.length
    : 0;

  const ranked = [...rows].sort((a, b) => b.views - a.views);
  const top = ranked[0];
  const strongestEngagement = [...rows].sort(
    (a, b) => youtubeEngagementRate(b) - youtubeEngagementRate(a)
  )[0];
  const weakest = [...rows].sort(
    (a, b) => youtubeEngagementRate(a) - youtubeEngagementRate(b)
  )[0];

  return (
    <section className="yt-card yt-content-ai-card yt-wide-card">
      <div className="yt-content-ai-head">
        <div>
          <span>GEMINI AI</span>
          <h2>AI Content Performance Analysis</h2>
          <p>Evidence-based analysis of the selected YouTube content period.</p>
        </div>
        <div className="yt-ai-period">Selected period</div>
      </div>

      <div className="yt-content-ai-kpis">
        <div><span>CONTENTS</span><strong>{rows.length}</strong></div>
        <div><span>VIEWS</span><strong>{formatCompact(views)}</strong></div>
        <div><span>ENGAGEMENT</span><strong>{engagementRate.toFixed(2)}%</strong></div>
        <div><span>AVG. VIEWED</span><strong>{averageViewed.toFixed(1)}%</strong></div>
      </div>

      <div className="yt-ai-executive">
        <span>EXECUTIVE SUMMARY</span>
        <p>
          Performa konten pada periode terpilih menghasilkan {formatCompact(views)} views dari {rows.length} konten.
          {top ? ` Konten dengan reach tertinggi adalah “${top.title}” dengan ${formatCompact(top.views)} views.` : ""}
          {strongestEngagement ? ` Konten “${strongestEngagement.title}” mencatat rasio interaksi paling kuat, sehingga format dan angle-nya layak direplikasi.` : ""}
          {averageViewed >= 80
            ? " Rata-rata persentase ditonton tergolong kuat dan menunjukkan konten cukup efektif mempertahankan perhatian."
            : " Rata-rata persentase ditonton masih dapat ditingkatkan melalui hook yang lebih cepat dan struktur cerita yang lebih padat."}
        </p>
      </div>

      <div className="yt-ai-two-col">
        <article className="working">
          <h3>What&apos;s Working</h3>
          <ul>
            <li>{top ? `Konten dengan reach tertinggi mencapai ${formatCompact(top.views)} views; gunakan format, hook, dan topik serupa sebagai referensi.` : "Fokuskan produksi pada format dengan reach tertinggi."}</li>
            <li>{strongestEngagement ? `Konten dengan engagement rate terbaik adalah “${strongestEngagement.title}” (${youtubeEngagementRate(strongestEngagement).toFixed(2)}%).` : "Prioritaskan konten yang mendorong interaksi aktif."}</li>
            <li>Short-form efektif untuk acquisition, sedangkan video berdurasi lebih panjang tetap penting untuk watch time dan product education.</li>
          </ul>
        </article>

        <article className="attention">
          <h3>Needs Attention</h3>
          <ul>
            <li>{weakest ? `Konten “${weakest.title}” memiliki engagement rate terendah (${youtubeEngagementRate(weakest).toFixed(2)}%); evaluasi hook, CTA, dan relevansi topik.` : "Periksa konten dengan engagement rate rendah."}</li>
            <li>Konten yang mendapat views tinggi tetapi komentar/share rendah berpotensi memiliki pesan yang terlalu pasif.</li>
            <li>Hindari penumpukan upload pada hari yang sama jika konten saling mengkanibalisasi distribusi.</li>
          </ul>
        </article>
      </div>

      <div className="yt-ai-actions">
        <h3>Recommended Actions</h3>
        <ol>
          <li>Replikasi pola topik, opening, dan visual dari konten dengan reach serta engagement tertinggi.</li>
          <li>Perkuat CTA komentar pada konten dengan impressions/views tinggi tetapi interaksi rendah.</li>
          <li>Gunakan retention dan average percentage viewed untuk mengevaluasi 5–10 detik pertama setiap video.</li>
          <li>Bandingkan Shorts dan long-form secara terpisah agar rekomendasi tidak mencampur pola konsumsi yang berbeda.</li>
        </ol>
      </div>

      <div className="yt-ai-footnote">
        Preview AI menggunakan data yang tersedia di dashboard. Setelah YouTube API terhubung, analisis akan memakai data aktual per periode.
      </div>
    </section>
  );
}
