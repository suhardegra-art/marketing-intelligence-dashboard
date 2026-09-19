const trendValues = [
  2100, 2700, 2300, 1600, 2400, 1900, 2200, 2600, 1700, 1700,
  2500, 2700, 2200, 1950, 1900, 2050, 2900, 3200, 8942, 4200,
  2700, 2100, 1800, 1750, 2500, 2750
];

const trafficSources = [
  ["YouTube search", 43.0],
  ["Shorts feed", 34.3],
  ["Browse features", 10.5],
  ["Suggested videos", 6.8],
  ["Channel pages", 2.8],
  ["External", 2.5],
  ["Others", 0.1]
] as const;

const ages = [
  ["13–17 years", 0.3],
  ["18–24 years", 3.9],
  ["25–34 years", 34.1],
  ["35–44 years", 38.3],
  ["45–54 years", 18.3],
  ["55–64 years", 4.5],
  ["65+ years", 0.6]
] as const;

const topContent = [
  {
    title: "Punya cewe yang nggak ngerti motor listrik tuh emang menguji kesabaran...",
    date: "Sep 11, 2026",
    views: "8,302",
    duration: "0:21",
    viewed: "75.6%",
    likes: "612",
    comments: "48"
  },
  {
    title: "POV 6 Bulan Pakai Motor Listrik Adora",
    date: "Sep 23, 2025",
    views: "7,713",
    duration: "0:26",
    viewed: "66.3%",
    likes: "548",
    comments: "32"
  },
  {
    title: "Day 1 Nge Charge Motor Listrik Tyranno",
    date: "Oct 17, 2025",
    views: "7,636",
    duration: "0:24",
    viewed: "102.0%",
    likes: "490",
    comments: "41"
  },
  {
    title: "Motor Listrik Adora, Lebih Murah?",
    date: "May 20, 2025",
    views: "7,535",
    duration: "0:26",
    viewed: "81.4%",
    likes: "467",
    comments: "28"
  },
  {
    title: "baru 2 menit ga bales, udah ditanya 'dimana' 😭",
    date: "Sep 13, 2026",
    views: "2,817",
    duration: "0:09",
    viewed: "164.3%",
    likes: "301",
    comments: "22"
  }
];

function buildLinePoints(values: number[]) {
  const max = Math.max(...values);
  const width = 900;
  const height = 230;

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - (value / max) * 185 - 15;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export default function YouTubeOverviewPage() {
  const points = buildLinePoints(trendValues);

  return (
    <div className="yt-page-content">
      <div className="yt-page">
        <header className="yt-topbar">
          <div className="yt-title-wrap">
            <div className="yt-youtube-badge">▶</div>
            <div>
              <h1>YouTube Analytics</h1>
              <p>
                Track performance, understand your audience, and grow your channel
                with data-driven insights.
              </p>
            </div>
          </div>

          <div className="yt-top-actions">
            <button className="yt-date-button">
              <span>Aug 22, 2026 – Sep 18, 2026</span>
              <small>Last 28 days</small>
            </button>
            <button className="yt-soft-button">Compare</button>
            <button className="yt-soft-button">Export</button>
            <button className="yt-icon-button">•••</button>
          </div>
        </header>

        <section className="yt-channel-banner">
          <div className="yt-channel-copy">
            <p className="yt-channel-overline">YOUTUBE CHANNEL</p>
            <h2>Indomobil eMotor</h2>
            <p className="yt-channel-meta">
              @indomobilemotor • 1.14K subscribers • Performance overview & audience intelligence
            </p>
            <div className="yt-banner-pills">
              <span>Last 28 days</span>
              <span>78.2K views</span>
              <span>287.3 watch hours</span>
              <span>+49 subscribers</span>
            </div>
          </div>

          <div className="yt-banner-art" aria-hidden="true">
            <div className="yt-banner-orb orb-a" />
            <div className="yt-banner-orb orb-b" />
            <div className="yt-banner-play">▶</div>
          </div>

          <a className="yt-open-channel" href="https://www.youtube.com/" target="_blank" rel="noreferrer">
            Open YouTube ↗
          </a>
        </section>

        <section className="yt-kpi-grid">
          <article className="yt-kpi-card">
            <span className="yt-kpi-icon">◉</span>
            <div>
              <p>Views</p>
              <strong>78.2K</strong>
              <small className="yt-positive">↑ 12%</small>
              <em>About the same as usual</em>
            </div>
          </article>

          <article className="yt-kpi-card">
            <span className="yt-kpi-icon">◷</span>
            <div>
              <p>Watch time (hours)</p>
              <strong>287.3</strong>
              <small className="yt-negative">↓ 1%</small>
              <em>2.7 less than previous 28 days</em>
            </div>
          </article>

          <article className="yt-kpi-card">
            <span className="yt-kpi-icon">◎</span>
            <div>
              <p>Subscribers</p>
              <strong>+49</strong>
              <small className="yt-negative">↓ 27%</small>
              <em>18 less than previous 28 days</em>
            </div>
          </article>

          <article className="yt-kpi-card">
            <span className="yt-kpi-icon">♡</span>
            <div>
              <p>Engagement rate</p>
              <strong>5.3%</strong>
              <small className="yt-positive">↑ 18%</small>
              <em>Higher than previous 28 days</em>
            </div>
          </article>
        </section>

        <section className="yt-primary-grid">
          <article className="yt-card yt-trend-card">
            <div className="yt-card-head">
              <div>
                <h2>Performance Trend</h2>
                <p>Daily channel performance for the selected period</p>
              </div>
              <div className="yt-segmented">
                <button className="active">Views</button>
                <button>Watch time</button>
                <button>Subscribers</button>
              </div>
            </div>

            <div className="yt-chart-wrap">
              <div className="yt-grid-lines">
                <span>9K</span>
                <span>6K</span>
                <span>3K</span>
                <span>0</span>
              </div>
              <svg
                className="yt-line-chart"
                viewBox="0 0 900 250"
                preserveAspectRatio="none"
                role="img"
                aria-label="Views trend"
              >
                <defs>
                  <linearGradient id="ytFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#1677ff" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#1677ff" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <polygon points={`0,238 ${points} 900,238`} fill="url(#ytFill)" />
                <polyline
                  points={points}
                  fill="none"
                  stroke="#1677ff"
                  strokeWidth="4"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <circle cx="648" cy="48" r="7" fill="#1677ff" />
              </svg>
              <div className="yt-chart-tooltip">
                <span>Sep 11, 2026</span>
                <strong>8,942 views</strong>
              </div>
              <div className="yt-chart-dates">
                <span>Aug 22</span>
                <span>Aug 27</span>
                <span>Sep 1</span>
                <span>Sep 6</span>
                <span>Sep 11</span>
                <span>Sep 14</span>
                <span>Sep 18</span>
              </div>
            </div>
          </article>

          <article className="yt-card yt-realtime-card">
            <div className="yt-card-head compact">
              <div>
                <h2>Realtime</h2>
                <p><span className="yt-live-dot" /> Estimated monitor</p>
              </div>
            </div>
            <div className="yt-realtime-metric">
              <strong>3,824</strong>
              <span>Views · Last 48 hours</span>
              <div className="yt-mini-bars big">
                {Array.from({ length: 36 }).map((_, index) => (
                  <i key={index} style={{ height: `${22 + ((index * 13) % 50)}px` }} />
                ))}
              </div>
            </div>
            <div className="yt-realtime-metric second">
              <strong>119</strong>
              <span>Views · Last 60 minutes</span>
              <div className="yt-mini-bars">
                {Array.from({ length: 30 }).map((_, index) => (
                  <i key={index} style={{ height: `${8 + ((index * 7) % 30)}px` }} />
                ))}
              </div>
            </div>
          </article>
        </section>

        <section className="yt-card yt-ai-summary-card yt-wide-card">
          <div className="yt-card-head">
            <div>
              <h2>✦ AI Performance Summary</h2>
              <p>Generated from channel performance data</p>
            </div>
            <span className="yt-beta">Beta</span>
          </div>

          <div className="yt-ai-summary-body">
            <div className="yt-score-ring">
              <div>
                <strong>82</strong>
                <span>/100</span>
                <small>Overall Score</small>
              </div>
            </div>

            <div className="yt-score-list">
              <div><span>Growth</span><strong className="good">● Strong</strong></div>
              <div><span>Content Efficiency</span><strong className="good">● Good</strong></div>
              <div><span>Audience Retention</span><strong className="warn">● Needs Attention</strong></div>
              <div><span>Discovery</span><strong className="good">● Improving</strong></div>
              <div><span>Subscriber Conversion</span><strong className="warn">● Moderate</strong></div>
            </div>

            <div className="yt-ai-summary-copy">
              <strong>Executive Insight</strong>
              <p>
                Channel mencatat pertumbuhan views yang stabil. Shorts menjadi kontributor terbesar
                terhadap reach, sementara video long-form menghasilkan watch time yang lebih tinggi.
                Pertumbuhan subscriber positif, namun subscriber conversion masih dapat ditingkatkan.
              </p>
              <a className="yt-ai-link" href="/youtube/ai-performance">
                Lihat analisa detail AI <span>→</span>
              </a>
            </div>
          </div>
        </section>

        <section className="yt-two-column-grid">
          <article className="yt-card">
            <div className="yt-card-head compact">
              <div>
                <h2>How viewers find your videos</h2>
                <p>Views · Last 28 days</p>
              </div>
            </div>
            <div className="yt-bars-list">
              {trafficSources.map(([label, value]) => (
                <div className="yt-bars-row" key={label}>
                  <span>{label}</span>
                  <div><i style={{ width: `${Math.min(100, value * 2)}%` }} /></div>
                  <strong>{value.toFixed(1)}%</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="yt-card">
            <div className="yt-card-head compact">
              <div>
                <h2>Views by content type</h2>
                <p>Views · Last 28 days</p>
              </div>
            </div>
            <div className="yt-content-type">
              <div className="yt-donut">
                <div>
                  <strong>78.2K</strong>
                  <span>Total Views</span>
                </div>
              </div>
              <div className="yt-legend">
                <div><span className="c1" />Shorts <strong>86.2%</strong></div>
                <div><span className="c2" />Videos <strong>13.1%</strong></div>
                <div><span className="c3" />Live <strong>0.7%</strong></div>
              </div>
            </div>
          </article>
        </section>

        <section className="yt-two-column-grid">
          <article className="yt-card">
            <div className="yt-card-head compact">
              <div>
                <h2>Audience</h2>
                <p>Age distribution · Last 28 days</p>
              </div>
            </div>
            <div className="yt-audience-tabs">
              <button className="active">Age</button>
              <button>Gender</button>
              <button>Device</button>
              <button>Top geographies</button>
            </div>
            <div className="yt-bars-list audience">
              {ages.map(([label, value]) => (
                <div className="yt-bars-row" key={label}>
                  <span>{label}</span>
                  <div><i style={{ width: `${value * 2.2}%` }} /></div>
                  <strong>{value.toFixed(1)}%</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="yt-card yt-ai-highlights-card">
            <div className="yt-card-head compact">
              <div>
                <h2>◎ AI Insights Highlight</h2>
                <p>Prioritized opportunities from channel signals</p>
              </div>
              <a href="/youtube/ai-performance">See all</a>
            </div>
            <div className="yt-insight-list">
              <div>
                <span className="green">↗</span>
                <p><strong>Views meningkat 28%</strong><small>Traffic dari YouTube Search naik dibanding periode sebelumnya.</small></p>
              </div>
              <div>
                <span className="yellow">!</span>
                <p><strong>Retention drop di detik 6–10</strong><small>Perkuat hook pembuka dan percepat masuk ke inti konten.</small></p>
              </div>
              <div>
                <span className="blue">▥</span>
                <p><strong>Shorts sangat efektif untuk reach</strong><small>Gunakan Shorts untuk acquisition dan arahkan ke long-form.</small></p>
              </div>
            </div>
          </article>
        </section>

        <section className="yt-card yt-top-content-card yt-wide-card">
          <div className="yt-card-head">
            <div>
              <h2>Top Content</h2>
              <p>Best-performing content in the selected period</p>
            </div>
            <div className="yt-segmented mini">
              <button className="active">All</button>
              <button>Videos</button>
              <button>Shorts</button>
              <button>Live</button>
            </div>
          </div>

          <div className="yt-table-wrap">
            <table className="yt-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Content</th>
                  <th>Publish date</th>
                  <th>Views</th>
                  <th>Avg view duration</th>
                  <th>Avg % viewed</th>
                  <th>Likes</th>
                  <th>Comments</th>
                </tr>
              </thead>
              <tbody>
                {topContent.map((item, index) => (
                  <tr key={item.title}>
                    <td>{index + 1}</td>
                    <td>
                      <div className="yt-content-cell">
                        <span className={`yt-thumb t${index + 1}`} />
                        <span>{item.title}</span>
                      </div>
                    </td>
                    <td>{item.date}</td>
                    <td><strong>{item.views}</strong></td>
                    <td>{item.duration}</td>
                    <td>{item.viewed}</td>
                    <td>{item.likes}</td>
                    <td>{item.comments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="yt-two-column-grid">
          <article className="yt-card yt-latest-card">
            <div className="yt-card-head compact">
              <div>
                <h2>Latest Content</h2>
                <p>Most recent upload</p>
              </div>
            </div>
            <div className="yt-latest-layout">
              <div className="yt-latest-thumb"><span>0:26</span></div>
              <div>
                <h3>baru 2 menit ga bales, udah ditanya “dimana”...</h3>
                <p>Sep 13, 2026 · 2.8K views</p>
                <div className="yt-latest-stats">
                  <div><span>Views</span><strong>2.8K</strong></div>
                  <div><span>Average % viewed</span><strong>164.3%</strong></div>
                  <div><span>Likes</span><strong>301</strong></div>
                  <div><span>Comments</span><strong>22</strong></div>
                </div>
                <a href="/youtube/content" className="yt-ai-link">Lihat analisa video <span>→</span></a>
              </div>
            </div>
          </article>

          <article className="yt-card yt-next-ideas-card">
            <div className="yt-card-head compact">
              <div>
                <h2>Next Content Ideas <small>(AI Recommendation)</small></h2>
                <p>Ideas generated from winning content patterns</p>
              </div>
              <a href="/youtube/ai-performance">See all</a>
            </div>
            <div className="yt-next-list">
              <div><span>1</span><p><strong>Berapa biaya motor listrik selama 1 bulan?</strong><small>Topik biaya memiliki retention 1.6× lebih tinggi.</small></p><b>›</b></div>
              <div><span>2</span><p><strong>POV commuting Jakarta pakai Tyranno</strong><small>Format POV menghasilkan subscriber conversion tertinggi.</small></p><b>›</b></div>
              <div><span>3</span><p><strong>Motor listrik kuat nanjak?</strong><small>Peluang tinggi di YouTube Search; volume pencarian meningkat.</small></p><b>›</b></div>
            </div>
          </article>
        </section>

        <div className="yt-demo-note">
          <strong>UI PREVIEW</strong>
          <span>
            Angka pada halaman ini masih placeholder berdasarkan screenshot YouTube Studio.
            Setelah UI disetujui, data akan diganti dengan YouTube Data API, YouTube Analytics API,
            YouTube Reporting API, dan snapshot Supabase.
          </span>
        </div>
      </div>
    </div>
  );
}
