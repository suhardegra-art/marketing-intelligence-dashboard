"use client";

import {
  Fragment,
  useMemo,
  useState
} from "react";
import styles from "../ReportMedia.module.css";

type MediaPosting = {
  name: string;
  url: string;
};

type MediaEvent = {
  id: string;
  date: string;
  year: number;
  eventName: string;
  status: string;
  blastMedia: string[];
  totalBlast: number;
  mediaPosting: MediaPosting[];
  totalPosting: number;
};

const EVENTS: MediaEvent[] = [
  {
    id: "autovaganza-2026",
    date: "29 Agustus 2026",
    year: 2026,
    eventName: "Autovaganza 2026",
    status: "Event",
    totalBlast: 45,
    totalPosting: 17,
    blastMedia: [
      "detik.com",
      "kompas.com",
      "otorider.com",
      "OTO.com",
      "thejakartapost.com",
      "autofun.co.id",
      "jadwalbalap.com",
      "goodcar.co.id",
      "otosight.id",
      "otobisnis.id",
      "genz.id",
      "otomotif.gridoto",
      "motomobinews",
      "rodagilas",
      "naikmotor.com",
      "megatrend.my.id",
      "moladin",
      "autonetmagz",
      "carmudi",
      "garduoto.com",
      "autoplus.id",
      "olx.co.id",
      "uzone.id",
      "pikiranrakyat.com",
      "motorlistrik.com",
      "xposeindonesia",
      "womenobsession",
      "katadata.co.id",
      "Otorider",
      "Ruzka Indonesia",
      "Beritakuh",
      "Gardu Oto",
      "Otodriver",
      "Xpose Indonesia",
      "OTO.com",
      "Zigwheels.co.id",
      "Otorian",
      "Tribunnews",
      "motoresto.id",
      "GoodCar",
      "Autoplus.id",
      "radarmamuju",
      "spiritbangsa.com",
      "rodagilas.com",
      "megatrend.my.id"
    ],
    mediaPosting: [
      {
        name: "Otorider",
        url: "https://otorider.com/motor-listrik/2026/indomobil-emotor-bawa-6-motor-listrik-ke-autovaganza-2026-bisa-langsung-test-ride-inddfchfide"
      },
      {
        name: "Ruzka Indonesia",
        url: "https://ruzkaindonesia.id/indomobil-emotor-hadir-di-autovaganza-2026-dekatkan-motor-listrik-indonesia-ke-pengunjung/"
      },
      {
        name: "Beritakuh",
        url: "https://beritakuh.id/indomobil-emotor-bawa-6-motor-listrik-ke-autovaganza-2026/"
      },
      {
        name: "Gardu Oto",
        url: "https://www.garduoto.com/142955/indomobil-emotor-unjuk-gigi-di-autovaganza-2026"
      },
      {
        name: "Otodriver",
        url: "https://otodriver.com/berita/2026/indonesia-autovaganza-2026-digelar-hadirkan-24-brand-otomotif-di-qbig-bsd-indefbhbbsd"
      },
      {
        name: "Xpose Indonesia",
        url: "https://xposeindonesia.com/lifestyle/automotive/indomobil-emotor-hadir-di-autovaganza-2026-ajak-pengunjung-rasakan-langsung-motor-listrik-indonesia/"
      },
      {
        name: "OTO.com",
        url: "https://www.oto.com/berita-mobil/the-8th-indonesia-autovaganza-dibuka-ramaikan-akhir-pekan-qbig-mall-bsd-city?amp=1"
      },
      {
        name: "Zigwheels.co.id",
        url: "https://www.zigwheels.co.id/motovaganza/indonesia-autovaganza-2026-kembali-digelar-padukan-otomotif-komunitas-dan-hiburan/"
      },
      {
        name: "Otorian",
        url: "https://www.otorian.id/the-8th-indonesia-autovaganza-2026-hadirkan-pengalaman-otomotif-untuk-semua-usia/"
      },
      {
        name: "Tribunnews",
        url: "https://www.tribunnews.com/otomotif/7875157/ada-edukasi-teknologi-mobil-listrik-di-festival-otomotif-8th-indonesia-autovaganza"
      },
      {
        name: "motoresto.id",
        url: "https://motoresto.id/the-8th-indonesia-autovaganza-2026-kini-tampil-lebih-beragam/"
      },
      {
        name: "GoodCar",
        url: "https://goodcar.id/artikel-mobil/indomobil-emotor-perkuat-ekosistem-kendaraan-listrik-di-indonesia-autovaganza-2026?campaign=mobil-bekas-termurah"
      },
      {
        name: "Autoplus.id",
        url: "https://www.autoplus.id/komitmen-kembangkan-ekosistem-kendaraan-listrik-indomobil-e-motor-hadir-diajang-the-8th-indonesia-autovaganza-2026/"
      },
      {
        name: "radarmamuju",
        url: "https://www.radarmamuju.com/amp/26257/indomobil-emotor-di-autovaganza-2026-6-motor-listrik-dengan-kandungan-lokal-50"
      },
      {
        name: "spiritbangsa.com",
        url: "https://spiritbangsa.com/amp/67381/indomobil-emotor-bawa-enam-motor-listrik-ke-autovaganza-2026-tawarkan-test-ride-gratis"
      },
      {
        name: "rodagilas.com",
        url: "https://rodagilas.com/2026/09/01/indomobil-emotor-hadirkan-pengalaman-nyata-di-indonesia-autovaganza/"
      },
      {
        name: "megatrend.my.id",
        url: "https://www.megatrend.my.id/2026/08/indomobil-emotor-ramaikan-autovaganza.html"
      }
    ]
  },
  {
    id: "detikcom-anugerah-ekonomi-hijau-2026",
    date: "4 September 2026",
    year: 2026,
    eventName: "Detikcom Anugerah Ekonomi Hijau Award 2026",
    status: "Weekly",
    totalBlast: 28,
    totalPosting: 16,
    blastMedia: [
      "detik.com",
      "kompas.com",
      "otorider.com",
      "OTO.com",
      "thejakartapost.com",
      "autofun.co.id",
      "jadwalbalap.com",
      "goodcar.co.id",
      "otosight.id",
      "otobisnis.id",
      "genz.id",
      "otomotif.gridoto",
      "motomobinews",
      "rodagilas",
      "naikmotor.com",
      "megatrend.my.id",
      "moladin",
      "autonetmagz",
      "carmudi",
      "garduoto.com",
      "autoplus.id",
      "olx.co.id",
      "uzone.id",
      "pikiranrakyat.com",
      "motorlistrik.com",
      "xposeindonesia",
      "womenobsession",
      "katadata.co.id"
    ],
    mediaPosting: [
      {
        name: "detikoto.com",
        url: "https://oto.detik.com/motor-listrik/d-8647409/indomobil-emotor-raih-anugerah-ekonomi-hijau-detikcom"
      },
      {
        name: "lifestyle.teknokrat.ac.id",
        url: "https://lifestyle.teknokrat.ac.id/indomobil-emotor-raih-anugerah-ekonomi-hijau-detikcom-cerita-di-balik-inovasi-ramah-lingkungan-yang-menginspirasi-industri-otomotif-nasional/"
      },
      {
        name: "pdiperjuanganbali.id",
        url: "https://www.pdiperjuanganbali.id/indomobil-emotor-raih-anugerah-ekonomi-hijau-2026#google_vignette"
      },
      {
        name: "otoexpo.com",
        url: "https://otoexpo.com/indomobil-emotor-sprinto-anugerah-ekonomi-hijau-2026/"
      },
      {
        name: "naikmotor.com",
        url: "https://naikmotor.com/287114/indomobil-emotor-sprinto-raih-anugerah-ekonomi-hijau-2026/"
      },
      {
        name: "garduoto.com",
        url: "https://www.garduoto.com/143001/indomobil-emotor-sprinto-sabet-anugerah-ekonomi-hijau-2026"
      },
      {
        name: "readers.id",
        url: "https://www.readers.id/indomobil-emotor-raih-anugerah-ekonomi-hijau#goog_rewarded"
      },
      {
        name: "berima.id",
        url: "https://www.berima.id/article/detik/indomobil-emotor-raih-anugerah-ekonomi-hijau-detikcom"
      },
      {
        name: "xposeindonesia.com",
        url: "https://xposeindonesia.com/exclusive/award/indomobil-emotor-sprinto-raih-anugerah-ekonomi-hijau-2026-dorong-ekosistem-motor-listrik/"
      },
      {
        name: "peradaban.id",
        url: "https://peradaban.id/indomobil-emotor-raih-anugerah-ekonomi-hijau"
      },
      {
        name: "achmadnurhidayat.id",
        url: "https://achmadnurhidayat.id/indomobil-emotor-raih-anugerah-ekonomi-hijau"
      },
      {
        name: "suaragarut.id",
        url: "https://suaragarut.id/detikcom-anugerah-ekonomi-hijau-2026"
      },
      {
        name: "megatrend.my.id",
        url: "https://www.megatrend.my.id/2026/09/indomobil-emotor-sprinto-raih-anugerah.html"
      },
      {
        name: "goodcar.id",
        url: "https://goodcar.id/artikel-mobil/indomobil-emotor-sprinto-raih-anugerah-ekonomi-hijau-2026"
      },
      {
        name: "Semarak News",
        url: "https://duniascooter.semaraknews.co.id/read/27102/sprinto-jadi-motor-listrik-indomobil-emotor-yang-raih-anugerah-ekonomi-hijau-2026"
      },
      {
        name: "bsinews.id",
        url: "https://bsinews.id/indomobil-emotor-anugerah-ekonomi-hijau/"
      }
    ]
  }
];

function statusClass(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "event") return styles.eventStatus;
  if (normalized === "weekly") return styles.weeklyStatus;

  return styles.defaultStatus;
}

function shortList(values: string[]) {
  if (!values.length) return "—";

  const head = values.slice(0, 3).join(", ");
  return values.length > 3 ? `${head}…` : head;
}

export default function ReportMediaDashboard() {
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(["autovaganza-2026"])
  );

  const years = useMemo(
    () =>
      Array.from(
        new Set(EVENTS.map((event) => event.year))
      ).sort((a, b) => b - a),
    []
  );

  const statuses = useMemo(
    () =>
      Array.from(
        new Set(EVENTS.map((event) => event.status))
      ).sort(),
    []
  );

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return EVENTS.filter((event) => {
      const matchesSearch =
        !query ||
        event.eventName.toLowerCase().includes(query) ||
        event.blastMedia.some((item) =>
          item.toLowerCase().includes(query)
        ) ||
        event.mediaPosting.some((item) =>
          item.name.toLowerCase().includes(query)
        );

      const matchesYear =
        year === "ALL" || String(event.year) === year;

      const matchesStatus =
        status === "ALL" || event.status === status;

      return matchesSearch && matchesYear && matchesStatus;
    });
  }, [search, year, status]);

  const summary = useMemo(() => {
    const totalBlast = filteredEvents.reduce(
      (sum, event) => sum + event.totalBlast,
      0
    );

    const totalPosting = filteredEvents.reduce(
      (sum, event) => sum + event.totalPosting,
      0
    );

    const uniqueBlast = new Set(
      filteredEvents.flatMap((event) =>
        event.blastMedia.map((item) => item.toLowerCase())
      )
    );

    const uniquePosting = new Set(
      filteredEvents.flatMap((event) =>
        event.mediaPosting.map((item) => item.name.toLowerCase())
      )
    );

    const uniqueOutlet = new Set([
      ...uniqueBlast,
      ...uniquePosting
    ]);

    return {
      totalEvents: filteredEvents.length,
      totalBlastMedia: totalBlast,
      totalBlast,
      totalMediaPosting: totalPosting,
      totalPosting,
      uniqueOutlet: uniqueOutlet.size
    };
  }, [filteredEvents]);

  function toggleEvent(eventId: string) {
    setExpandedIds((current) => {
      const next = new Set(current);

      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }

      return next;
    });
  }

  function resetFilters() {
    setSearch("");
    setYear("ALL");
    setStatus("ALL");
  }

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div>
          <h1>Report Media</h1>
          <p>
            Media blast and media posting performance from Marketing Event Detail Report.
          </p>
        </div>

        <div className={styles.sourceBadge}>
          <span className={styles.sourceDot} />
          <div>
            <strong>Design Preview</strong>
            <small>Source structure: Report Media</small>
          </div>
        </div>
      </header>

      <section className={styles.kpiGrid}>
        {[
          ["Total Event", summary.totalEvents],
          ["Total Blast Media", summary.totalBlastMedia],
          ["Total Blast", summary.totalBlast],
          ["Total Media Posting", summary.totalMediaPosting],
          ["Total Posting", summary.totalPosting],
          ["Unique Media Outlet", summary.uniqueOutlet]
        ].map(([label, value]) => (
          <article className={styles.kpi} key={String(label)}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>Current selected filter</small>
          </article>
        ))}
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <h2>Media Report Data</h2>
            <p>
              Klik tanda panah pada Nama Event untuk melihat detail Blast Media dan Media Posting.
            </p>
          </div>

          <button type="button" className={styles.exportButton}>
            ↓ Export CSV
          </button>
        </div>

        <div className={styles.filters}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search event or media..."
          />

          <select
            value={year}
            onChange={(event) => setYear(event.target.value)}
          >
            <option value="ALL">All Years</option>
            {years.map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="ALL">All Status</option>
            {statuses.map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>

          <button
            type="button"
            className={styles.resetButton}
            onClick={resetFilters}
          >
            Reset
          </button>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Nama Event</th>
                <th>Status</th>
                <th>Blast Media</th>
                <th>Total Blast</th>
                <th>Media Posting</th>
                <th>Total Posting</th>
              </tr>
            </thead>

            <tbody>
              {filteredEvents.map((event) => {
                const expanded = expandedIds.has(event.id);

                return (
                  <Fragment key={event.id}>
                    <tr className={expanded ? styles.expandedRow : undefined}>
                      <td>{event.date}</td>

                      <td>
                        <div className={styles.eventNameWrap}>
                          <button
                            type="button"
                            className={styles.expandButton}
                            onClick={() => toggleEvent(event.id)}
                            aria-expanded={expanded}
                          >
                            {expanded ? "▾" : "›"}
                          </button>

                          <button
                            type="button"
                            className={styles.eventNameButton}
                            onClick={() => toggleEvent(event.id)}
                          >
                            {event.eventName}
                          </button>
                        </div>
                      </td>

                      <td>
                        <span className={statusClass(event.status)}>
                          {event.status}
                        </span>
                      </td>

                      <td className={styles.previewCell}>
                        {shortList(event.blastMedia)}
                      </td>

                      <td>
                        <strong>{event.totalBlast}</strong>
                      </td>

                      <td className={styles.previewCell}>
                        {shortList(
                          event.mediaPosting.map((item) => item.name)
                        )}
                      </td>

                      <td>
                        <strong>{event.totalPosting}</strong>
                      </td>
                    </tr>

                    {expanded ? (
                      <tr className={styles.detailRow}>
                        <td colSpan={7}>
                          <div className={styles.inlineDetail}>
                            <div className={styles.detailTitle}>
                              <div>
                                <strong>
                                  Detail · {event.eventName}
                                </strong>
                                <span>
                                  Breakdown mengikuti struktur detail pada tab Report Media.
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleEvent(event.id)}
                              >
                                Close
                              </button>
                            </div>

                            <div className={styles.detailGrid}>
                              <section className={styles.yellowCard}>
                                <div className={styles.yellowCardHead}>
                                  <div>
                                    <span>BLAST MEDIA BREAKDOWN</span>
                                    <strong>
                                      {event.blastMedia.length} media outlets
                                    </strong>
                                  </div>

                                  <small>
                                    Total Blast: {event.totalBlast}
                                  </small>
                                </div>

                                <div className={styles.mediaList}>
                                  {event.blastMedia.map((media, index) => (
                                    <div
                                      className={styles.mediaRow}
                                      key={`${media}-${index}`}
                                    >
                                      <span>{media}</span>
                                      <em>{index + 1}</em>
                                    </div>
                                  ))}
                                </div>

                                <div className={styles.yellowCardTotal}>
                                  <span>Total Blast Media</span>
                                  <strong>{event.totalBlast}</strong>
                                </div>
                              </section>

                              <section className={styles.yellowCard}>
                                <div className={styles.yellowCardHead}>
                                  <div>
                                    <span>MEDIA POSTING BREAKDOWN</span>
                                    <strong>
                                      {event.mediaPosting.length} published links
                                    </strong>
                                  </div>

                                  <small>
                                    Total Posting: {event.totalPosting}
                                  </small>
                                </div>

                                <div className={styles.mediaList}>
                                  {event.mediaPosting.map((media, index) => (
                                    <div
                                      className={styles.mediaRow}
                                      key={`${media.name}-${index}`}
                                    >
                                      <span>{media.name}</span>

                                      <a
                                        href={media.url}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        Open ↗
                                      </a>
                                    </div>
                                  ))}
                                </div>

                                <div className={styles.yellowCardTotal}>
                                  <span>Total Media Posting</span>
                                  <strong>{event.totalPosting}</strong>
                                </div>
                              </section>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className={styles.tableFooter}>
          Showing {filteredEvents.length} event
          {filteredEvents.length === 1 ? "" : "s"}
        </div>
      </section>
    </div>
  );
}
