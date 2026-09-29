"use client";

import {
  Fragment,
  useEffect,
  useMemo,
  useState
} from "react";
import { useRouter } from "next/navigation";

import type {
  ReportMediaData,
  ReportMediaEvent
} from "@/lib/report-media";

import styles from "../ReportMedia.module.css";

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

function csvEscape(value: string | number) {
  const raw = String(value ?? "");
  return /[",\n]/.test(raw)
    ? `"${raw.replace(/"/g, '""')}"`
    : raw;
}

function exportCsv(events: ReportMediaEvent[]) {
  const rows: Array<Array<string | number>> = [
    [
      "Tanggal",
      "Nama Event",
      "Status",
      "Total Blast",
      "Total Posting",
      "Blast Media",
      "Media Posting"
    ],
    ...events.map((event) => [
      event.date,
      event.eventName,
      event.status,
      event.totalBlast,
      event.totalPosting,
      event.blastMedia.join(" | "),
      event.mediaPosting
        .map((item) =>
          item.url
            ? `${item.name}: ${item.url}`
            : item.name
        )
        .join(" | ")
    ])
  ];

  const csv = rows
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");

  const blob = new Blob(
    [`\uFEFF${csv}`],
    { type: "text/csv;charset=utf-8" }
  );

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "report-media-data.csv";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

export default function ReportMediaDashboard({
  initialData
}: {
  initialData: ReportMediaData;
}) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [year, setYear] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [expandedIds, setExpandedIds] =
    useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!initialData.connected || !initialData.dataVersion) {
      return;
    }

    let cancelled = false;

    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(
          "/api/report-media/data",
          { cache: "no-store" }
        );

        if (!response.ok) return;

        const latest =
          (await response.json()) as ReportMediaData;

        if (
          !cancelled &&
          latest.dataVersion &&
          latest.dataVersion !== initialData.dataVersion
        ) {
          router.refresh();
        }
      } catch {
        // Background check should never interrupt the page.
      }
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [
    initialData.connected,
    initialData.dataVersion,
    router
  ]);

  const years = useMemo(
    () =>
      Array.from(
        new Set(
          initialData.events
            .map((event) => event.year)
            .filter(
              (value): value is number => value !== null
            )
        )
      ).sort((a, b) => b - a),
    [initialData.events]
  );

  const statuses = useMemo(
    () =>
      Array.from(
        new Set(
          initialData.events
            .map((event) => event.status)
            .filter(Boolean)
        )
      ).sort(),
    [initialData.events]
  );

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return initialData.events.filter((event) => {
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
        year === "ALL" ||
        String(event.year) === year;

      const matchesStatus =
        status === "ALL" ||
        event.status === status;

      return (
        matchesSearch &&
        matchesYear &&
        matchesStatus
      );
    });
  }, [
    initialData.events,
    search,
    year,
    status
  ]);

  const summary = useMemo(() => {
    const totalBlast = filteredEvents.reduce(
      (sum, event) => sum + event.totalBlast,
      0
    );

    const totalPosting = filteredEvents.reduce(
      (sum, event) => sum + event.totalPosting,
      0
    );

    const blastListed = filteredEvents.reduce(
      (sum, event) => sum + event.blastMedia.length,
      0
    );

    const postingLinks = filteredEvents.reduce(
      (sum, event) =>
        sum +
        event.mediaPosting.filter((item) => Boolean(item.url)).length,
      0
    );

    const uniqueOutlet = new Set(
      filteredEvents.flatMap((event) => [
        ...event.blastMedia.map((item) =>
          item.toLowerCase()
        ),
        ...event.mediaPosting.map((item) =>
          item.name.toLowerCase()
        )
      ])
    );

    return {
      totalEvents: filteredEvents.length,
      totalBlast,
      totalPosting,
      blastListed,
      postingLinks,
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
            <strong>
              {initialData.connected
                ? "Google Sheet Connected"
                : "Google Sheet Not Connected"}
            </strong>
            <small>
              {initialData.connected
                ? `Source: ${initialData.sheetName}`
                : initialData.error || "Source unavailable"}
            </small>
          </div>
        </div>
      </header>

      <section className={styles.kpiGrid}>
        {[
          ["Total Event", summary.totalEvents],
          ["Total Blast", summary.totalBlast],
          ["Total Posting", summary.totalPosting],
          ["Blast Outlet Listed", summary.blastListed],
          ["Posting Links Listed", summary.postingLinks],
          ["Unique Media Outlet", summary.uniqueOutlet]
        ].map(([label, value]) => (
          <article
            className={styles.kpi}
            key={String(label)}
          >
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

          <button
            type="button"
            className={styles.exportButton}
            onClick={() => exportCsv(filteredEvents)}
          >
            ↓ Export CSV
          </button>
        </div>

        <div className={styles.filters}>
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search event or media..."
          />

          <select
            value={year}
            onChange={(event) =>
              setYear(event.target.value)
            }
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
            onChange={(event) =>
              setStatus(event.target.value)
            }
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
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    {initialData.connected
                      ? "No media report data found."
                      : initialData.error ||
                        "Google Sheet is not connected."}
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => {
                  const expanded =
                    expandedIds.has(event.id);

                  return (
                    <Fragment key={event.id}>
                      <tr
                        className={
                          expanded
                            ? styles.expandedRow
                            : undefined
                        }
                      >
                        <td>{event.date || "—"}</td>

                        <td>
                          <div className={styles.eventNameWrap}>
                            <button
                              type="button"
                              className={styles.expandButton}
                              onClick={() =>
                                toggleEvent(event.id)
                              }
                              aria-expanded={expanded}
                            >
                              {expanded ? "▾" : "›"}
                            </button>

                            <button
                              type="button"
                              className={styles.eventNameButton}
                              onClick={() =>
                                toggleEvent(event.id)
                              }
                            >
                              {event.eventName}
                            </button>
                          </div>
                        </td>

                        <td>
                          <span className={statusClass(event.status)}>
                            {event.status || "—"}
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
                                    Breakdown mengikuti tab Report Media di Google Sheet.
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleEvent(event.id)
                                  }
                                >
                                  Close
                                </button>
                              </div>

                              <div className={styles.detailGrid}>
                                <section className={styles.yellowCard}>
                                  <div className={styles.yellowCardHead}>
                                    <div>
                                      <span>
                                        BLAST MEDIA BREAKDOWN
                                      </span>
                                      <strong>
                                        {event.blastMedia.length} media outlets
                                      </strong>
                                    </div>

                                    <small>
                                      Total Blast: {event.totalBlast}
                                    </small>
                                  </div>

                                  <div className={styles.mediaList}>
                                    {event.blastMedia.length ? (
                                      event.blastMedia.map(
                                        (media, index) => (
                                          <div
                                            className={styles.mediaRow}
                                            key={`${media}-${index}`}
                                          >
                                            <span>{media}</span>
                                            <em>{index + 1}</em>
                                          </div>
                                        )
                                      )
                                    ) : (
                                      <div className={styles.mediaRow}>
                                        <span>
                                          No blast media detail.
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  <div className={styles.yellowCardTotal}>
                                    <span>Total Blast</span>
                                    <strong>{event.totalBlast}</strong>
                                  </div>
                                </section>

                                <section className={styles.yellowCard}>
                                  <div className={styles.yellowCardHead}>
                                    <div>
                                      <span>
                                        MEDIA POSTING BREAKDOWN
                                      </span>
                                      <strong>
                                        {event.mediaPosting.length} media entries
                                      </strong>
                                    </div>

                                    <small>
                                      Total Posting: {event.totalPosting}
                                    </small>
                                  </div>

                                  <div className={styles.mediaList}>
                                    {event.mediaPosting.length ? (
                                      event.mediaPosting.map(
                                        (media, index) => (
                                          <div
                                            className={styles.mediaRow}
                                            key={`${media.name}-${index}`}
                                          >
                                            <span>{media.name}</span>

                                            {media.url ? (
                                              <a
                                                href={media.url}
                                                target="_blank"
                                                rel="noreferrer"
                                              >
                                                Open ↗
                                              </a>
                                            ) : (
                                              <em>No link</em>
                                            )}
                                          </div>
                                        )
                                      )
                                    ) : (
                                      <div className={styles.mediaRow}>
                                        <span>
                                          No media posting detail.
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  <div className={styles.yellowCardTotal}>
                                    <span>Total Posting</span>
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
                })
              )}
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
