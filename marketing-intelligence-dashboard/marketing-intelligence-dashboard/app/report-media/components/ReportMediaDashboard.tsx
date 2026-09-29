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

type SortDirection = "asc" | "desc";

type MediaSortKey =
  | "date"
  | "eventName"
  | "status"
  | "blastMedia"
  | "totalBlast"
  | "mediaPosting"
  | "totalPosting";

type SortKind = "text" | "date" | "number";

const EVENTS_PER_PAGE = 10;

const MONTH_INDEX: Record<string, number> = {
  januari: 1,
  january: 1,
  jan: 1,
  februari: 2,
  february: 2,
  feb: 2,
  maret: 3,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  mei: 5,
  may: 5,
  juni: 6,
  june: 6,
  jun: 6,
  juli: 7,
  july: 7,
  jul: 7,
  agustus: 8,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  oktober: 10,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  desember: 12,
  december: 12,
  dec: 12
};

function statusClass(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "event") {
    return styles.eventStatus;
  }

  if (normalized === "weekly") {
    return styles.weeklyStatus;
  }

  return styles.defaultStatus;
}

function shortList(values: string[]) {
  if (!values.length) return "—";

  const head = values
    .slice(0, 3)
    .join(", ");

  return values.length > 3
    ? `${head}…`
    : head;
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
    .map((row) =>
      row.map(csvEscape).join(",")
    )
    .join("\n");

  const blob = new Blob(
    [`\uFEFF${csv}`],
    {
      type: "text/csv;charset=utf-8"
    }
  );

  const url =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = url;
  anchor.download =
    "report-media-data.csv";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

function defaultDirection(kind: SortKind): SortDirection {
  return kind === "number" ? "desc" : "asc";
}

function compareText(
  a: string,
  b: string,
  direction: SortDirection
) {
  const result = String(a || "").localeCompare(
    String(b || ""),
    undefined,
    {
      sensitivity: "base",
      numeric: true
    }
  );

  return direction === "asc"
    ? result
    : -result;
}

function compareNumber(
  a: number,
  b: number,
  direction: SortDirection
) {
  const result =
    Number(a || 0) -
    Number(b || 0);

  return direction === "asc"
    ? result
    : -result;
}

function parseMediaDate(value: string) {
  const raw =
    String(value || "").trim();

  if (!raw) return 0;

  const isoMatch =
    raw.match(
      /^(\d{4})-(\d{2})-(\d{2})/
    );

  if (isoMatch) {
    return Date.UTC(
      Number(isoMatch[1]),
      Number(isoMatch[2]) - 1,
      Number(isoMatch[3])
    );
  }

  const namedMatch =
    raw.match(
      /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/i
    );

  if (namedMatch) {
    const month =
      MONTH_INDEX[
        namedMatch[2].toLowerCase()
      ];

    if (month) {
      return Date.UTC(
        Number(namedMatch[3]),
        month - 1,
        Number(namedMatch[1])
      );
    }
  }

  const direct =
    Date.parse(raw);

  return Number.isFinite(direct)
    ? direct
    : 0;
}

function compareDate(
  a: string,
  b: string,
  direction: SortDirection
) {
  const result =
    parseMediaDate(a) -
    parseMediaDate(b);

  return direction === "asc"
    ? result
    : -result;
}

function sortIndicator(
  kind: SortKind,
  direction: SortDirection
) {
  if (kind === "text") {
    return direction === "asc"
      ? "A-Z"
      : "Z-A";
  }

  if (kind === "date") {
    return direction === "asc"
      ? "Old-New"
      : "New-Old";
  }

  return direction === "asc"
    ? "Low-High"
    : "High-Low";
}

function SortHeader({
  label,
  sortKey,
  kind,
  activeKey,
  direction,
  onSort
}: {
  label: string;
  sortKey: MediaSortKey;
  kind: SortKind;
  activeKey: MediaSortKey;
  direction: SortDirection;
  onSort: (
    key: MediaSortKey,
    kind: SortKind
  ) => void;
}) {
  const active =
    activeKey === sortKey;

  return (
    <th>
      <button
        type="button"
        onClick={() =>
          onSort(sortKey, kind)
        }
        title={`Sort ${label}`}
        aria-label={`Sort ${label}`}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 7,
          padding: 0,
          border: 0,
          background: "transparent",
          color: "inherit",
          font: "inherit",
          fontWeight:
            active ? 900 : 800,
          cursor: "pointer",
          textTransform: "inherit",
          letterSpacing: "inherit"
        }}
      >
        <span>{label}</span>

        <span
          style={{
            color:
              active
                ? "#3159d7"
                : "#9aa4bb",
            fontSize:
              active ? 8 : 11,
            fontWeight: 900,
            textTransform: "none",
            letterSpacing: 0,
            whiteSpace: "nowrap"
          }}
        >
          {active
            ? sortIndicator(
                kind,
                direction
              )
            : "↕"}
        </span>
      </button>
    </th>
  );
}

export default function ReportMediaDashboard({
  initialData
}: {
  initialData: ReportMediaData;
}) {
  const router = useRouter();

  const [search, setSearch] =
    useState("");

  const [year, setYear] =
    useState("ALL");

  const [status, setStatus] =
    useState("ALL");

  const [sortKey, setSortKey] =
    useState<MediaSortKey>("date");

  const [
    sortDirection,
    setSortDirection
  ] =
    useState<SortDirection>("asc");

  const [
    currentPage,
    setCurrentPage
  ] =
    useState(1);

  const [
    expandedIds,
    setExpandedIds
  ] = useState<Set<string>>(
    () => new Set()
  );

  useEffect(() => {
    if (
      !initialData.connected ||
      !initialData.dataVersion
    ) {
      return;
    }

    let cancelled = false;

    const timer =
      window.setInterval(
        async () => {
          try {
            const response =
              await fetch(
                "/api/report-media/data",
                { cache: "no-store" }
              );

            if (!response.ok) return;

            const latest =
              (await response.json()) as ReportMediaData;

            if (
              !cancelled &&
              latest.dataVersion &&
              latest.dataVersion !==
                initialData.dataVersion
            ) {
              router.refresh();
            }
          } catch {
            // Silent background check.
          }
        },
        60_000
      );

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
              (value): value is number =>
                value !== null
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

  const filteredEvents =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return initialData.events.filter(
        (event) => {
          const matchesSearch =
            !query ||
            event.eventName
              .toLowerCase()
              .includes(query) ||
            event.blastMedia.some(
              (item) =>
                item
                  .toLowerCase()
                  .includes(query)
            ) ||
            event.mediaPosting.some(
              (item) =>
                item.name
                  .toLowerCase()
                  .includes(query)
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
        }
      );
    }, [
      initialData.events,
      search,
      year,
      status
    ]);

  function handleSort(
    key: MediaSortKey,
    kind: SortKind
  ) {
    setCurrentPage(1);

    if (sortKey === key) {
      setSortDirection(
        (current) =>
          current === "asc"
            ? "desc"
            : "asc"
      );
      return;
    }

    setSortKey(key);
    setSortDirection(
      defaultDirection(kind)
    );
  }

  const sortedEvents =
    useMemo(() => {
      const rows =
        [...filteredEvents];

      rows.sort((a, b) => {
        switch (sortKey) {
          case "date":
            return compareDate(
              a.date,
              b.date,
              sortDirection
            );

          case "eventName":
            return compareText(
              a.eventName,
              b.eventName,
              sortDirection
            );

          case "status":
            return compareText(
              a.status,
              b.status,
              sortDirection
            );

          case "blastMedia":
            return compareText(
              a.blastMedia.join(" "),
              b.blastMedia.join(" "),
              sortDirection
            );

          case "totalBlast":
            return compareNumber(
              a.totalBlast,
              b.totalBlast,
              sortDirection
            );

          case "mediaPosting":
            return compareText(
              a.mediaPosting
                .map(
                  (item) => item.name
                )
                .join(" "),
              b.mediaPosting
                .map(
                  (item) => item.name
                )
                .join(" "),
              sortDirection
            );

          case "totalPosting":
            return compareNumber(
              a.totalPosting,
              b.totalPosting,
              sortDirection
            );

          default:
            return 0;
        }
      });

      return rows;
    }, [
      filteredEvents,
      sortKey,
      sortDirection
    ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      sortedEvents.length /
        EVENTS_PER_PAGE
    )
  );

  const pagedEvents =
    useMemo(() => {
      const start =
        (currentPage - 1) *
        EVENTS_PER_PAGE;

      return sortedEvents.slice(
        start,
        start + EVENTS_PER_PAGE
      );
    }, [
      sortedEvents,
      currentPage
    ]);

  const pageNumbers =
    useMemo(() => {
      const maxVisible = 6;

      if (
        totalPages <=
        maxVisible
      ) {
        return Array.from(
          { length: totalPages },
          (_, index) =>
            index + 1
        );
      }

      let start = Math.max(
        1,
        currentPage - 2
      );

      let end =
        start +
        maxVisible -
        1;

      if (end > totalPages) {
        end = totalPages;
        start =
          end -
          maxVisible +
          1;
      }

      return Array.from(
        {
          length:
            end -
            start +
            1
        },
        (_, index) =>
          start + index
      );
    }, [
      currentPage,
      totalPages
    ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    year,
    status
  ]);

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages
  ]);

  const summary = useMemo(() => {
    const totalBlast =
      filteredEvents.reduce(
        (sum, event) =>
          sum + event.totalBlast,
        0
      );

    const totalPosting =
      filteredEvents.reduce(
        (sum, event) =>
          sum + event.totalPosting,
        0
      );

    const blastListed =
      filteredEvents.reduce(
        (sum, event) =>
          sum +
          event.blastMedia.length,
        0
      );

    const postingLinks =
      filteredEvents.reduce(
        (sum, event) =>
          sum +
          event.mediaPosting.filter(
            (item) =>
              Boolean(item.url)
          ).length,
        0
      );

    const uniqueOutlet = new Set(
      filteredEvents.flatMap(
        (event) => [
          ...event.blastMedia.map(
            (item) =>
              item.toLowerCase()
          ),
          ...event.mediaPosting.map(
            (item) =>
              item.name.toLowerCase()
          )
        ]
      )
    );

    return {
      totalEvents:
        filteredEvents.length,
      totalBlast,
      totalPosting,
      blastListed,
      postingLinks,
      uniqueOutlet:
        uniqueOutlet.size
    };
  }, [filteredEvents]);

  function toggleEvent(
    eventId: string
  ) {
    setExpandedIds((current) => {
      const next =
        new Set(current);

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
    setSortKey("date");
    setSortDirection("asc");
    setCurrentPage(1);
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
          <span
            className={styles.sourceDot}
          />
          <div>
            <strong>
              {initialData.connected
                ? "Google Sheet Connected"
                : "Google Sheet Not Connected"}
            </strong>
            <small>
              {initialData.connected
                ? `Source: ${initialData.sheetName}`
                : initialData.error ||
                  "Source unavailable"}
            </small>
          </div>
        </div>
      </header>

      <section className={styles.kpiGrid}>
        {[
          [
            "Total Event",
            summary.totalEvents
          ],
          [
            "Total Blast",
            summary.totalBlast
          ],
          [
            "Total Posting",
            summary.totalPosting
          ],
          [
            "Blast Outlet Listed",
            summary.blastListed
          ],
          [
            "Posting Links Listed",
            summary.postingLinks
          ],
          [
            "Unique Media Outlet",
            summary.uniqueOutlet
          ]
        ].map(([label, value]) => (
          <article
            className={styles.kpi}
            key={String(label)}
          >
            <span>{label}</span>
            <strong>{value}</strong>
            <small>
              Current selected filter
            </small>
          </article>
        ))}
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <h2>
              Media Report Data
            </h2>
            <p>
              Klik tanda panah pada Nama Event untuk melihat detail Blast Media dan Media Posting.
            </p>
          </div>

          <button
            type="button"
            className={
              styles.exportButton
            }
            onClick={() =>
              exportCsv(
                sortedEvents
              )
            }
          >
            ↓ Export CSV
          </button>
        </div>

        <div className={styles.filters}>
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search event or media..."
          />

          <select
            value={year}
            onChange={(event) =>
              setYear(
                event.target.value
              )
            }
          >
            <option value="ALL">
              All Years
            </option>
            {years.map((value) => (
              <option
                value={value}
                key={value}
              >
                {value}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value
              )
            }
          >
            <option value="ALL">
              All Status
            </option>
            {statuses.map(
              (value) => (
                <option
                  value={value}
                  key={value}
                >
                  {value}
                </option>
              )
            )}
          </select>

          <button
            type="button"
            className={
              styles.resetButton
            }
            onClick={resetFilters}
          >
            Reset
          </button>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <SortHeader
                  label="Tanggal"
                  sortKey="date"
                  kind="date"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />

                <SortHeader
                  label="Nama Event"
                  sortKey="eventName"
                  kind="text"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />

                <SortHeader
                  label="Status"
                  sortKey="status"
                  kind="text"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />

                <SortHeader
                  label="Blast Media"
                  sortKey="blastMedia"
                  kind="text"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />

                <SortHeader
                  label="Total Blast"
                  sortKey="totalBlast"
                  kind="number"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />

                <SortHeader
                  label="Media Posting"
                  sortKey="mediaPosting"
                  kind="text"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />

                <SortHeader
                  label="Total Posting"
                  sortKey="totalPosting"
                  kind="number"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </tr>
            </thead>

            <tbody>
              {sortedEvents.length ===
              0 ? (
                <tr>
                  <td colSpan={7}>
                    {initialData.connected
                      ? "No media report data found."
                      : initialData.error ||
                        "Google Sheet is not connected."}
                  </td>
                </tr>
              ) : (
                pagedEvents.map(
                  (event) => {
                    const expanded =
                      expandedIds.has(
                        event.id
                      );

                    return (
                      <Fragment
                        key={event.id}
                      >
                        <tr
                          className={
                            expanded
                              ? styles.expandedRow
                              : undefined
                          }
                        >
                          <td>
                            {event.date ||
                              "—"}
                          </td>

                          <td>
                            <div
                              className={
                                styles.eventNameWrap
                              }
                            >
                              <button
                                type="button"
                                className={
                                  styles.expandButton
                                }
                                onClick={() =>
                                  toggleEvent(
                                    event.id
                                  )
                                }
                                aria-expanded={
                                  expanded
                                }
                              >
                                {expanded
                                  ? "▾"
                                  : "›"}
                              </button>

                              <button
                                type="button"
                                className={
                                  styles.eventNameButton
                                }
                                onClick={() =>
                                  toggleEvent(
                                    event.id
                                  )
                                }
                              >
                                {
                                  event.eventName
                                }
                              </button>
                            </div>
                          </td>

                          <td>
                            <span
                              className={statusClass(
                                event.status
                              )}
                            >
                              {event.status ||
                                "—"}
                            </span>
                          </td>

                          <td
                            className={
                              styles.previewCell
                            }
                          >
                            {shortList(
                              event.blastMedia
                            )}
                          </td>

                          <td>
                            <strong>
                              {
                                event.totalBlast
                              }
                            </strong>
                          </td>

                          <td
                            className={
                              styles.previewCell
                            }
                          >
                            {shortList(
                              event.mediaPosting.map(
                                (item) =>
                                  item.name
                              )
                            )}
                          </td>

                          <td>
                            <strong>
                              {
                                event.totalPosting
                              }
                            </strong>
                          </td>
                        </tr>

                        {expanded ? (
                          <tr
                            className={
                              styles.detailRow
                            }
                          >
                            <td colSpan={7}>
                              <div
                                className={
                                  styles.inlineDetail
                                }
                              >
                                <div
                                  className={
                                    styles.detailTitle
                                  }
                                >
                                  <div>
                                    <strong>
                                      Detail ·{" "}
                                      {
                                        event.eventName
                                      }
                                    </strong>
                                    <span>
                                      Breakdown mengikuti tab Report Media di Google Sheet.
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleEvent(
                                        event.id
                                      )
                                    }
                                  >
                                    Close
                                  </button>
                                </div>

                                <div
                                  className={
                                    styles.detailGrid
                                  }
                                >
                                  <section
                                    className={
                                      styles.yellowCard
                                    }
                                  >
                                    <div
                                      className={
                                        styles.yellowCardHead
                                      }
                                    >
                                      <div>
                                        <span>
                                          BLAST MEDIA BREAKDOWN
                                        </span>
                                        <strong>
                                          {
                                            event
                                              .blastMedia
                                              .length
                                          }{" "}
                                          media outlets
                                        </strong>
                                      </div>

                                      <small>
                                        Total Blast:{" "}
                                        {
                                          event.totalBlast
                                        }
                                      </small>
                                    </div>

                                    <div
                                      className={
                                        styles.mediaList
                                      }
                                    >
                                      {event.blastMedia.length ? (
                                        event.blastMedia.map(
                                          (
                                            media,
                                            index
                                          ) => (
                                            <div
                                              className={
                                                styles.mediaRow
                                              }
                                              key={`${media}-${index}`}
                                            >
                                              <span>
                                                {
                                                  media
                                                }
                                              </span>
                                              <em>
                                                {index +
                                                  1}
                                              </em>
                                            </div>
                                          )
                                        )
                                      ) : (
                                        <div
                                          className={
                                            styles.mediaRow
                                          }
                                        >
                                          <span>
                                            No blast media detail.
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    <div
                                      className={
                                        styles.yellowCardTotal
                                      }
                                    >
                                      <span>
                                        Total Blast
                                      </span>
                                      <strong>
                                        {
                                          event.totalBlast
                                        }
                                      </strong>
                                    </div>
                                  </section>

                                  <section
                                    className={
                                      styles.yellowCard
                                    }
                                  >
                                    <div
                                      className={
                                        styles.yellowCardHead
                                      }
                                    >
                                      <div>
                                        <span>
                                          MEDIA POSTING BREAKDOWN
                                        </span>
                                        <strong>
                                          {
                                            event
                                              .mediaPosting
                                              .length
                                          }{" "}
                                          media entries
                                        </strong>
                                      </div>

                                      <small>
                                        Total Posting:{" "}
                                        {
                                          event.totalPosting
                                        }
                                      </small>
                                    </div>

                                    <div
                                      className={
                                        styles.mediaList
                                      }
                                    >
                                      {event.mediaPosting.length ? (
                                        event.mediaPosting.map(
                                          (
                                            media,
                                            index
                                          ) => (
                                            <div
                                              className={
                                                styles.mediaRow
                                              }
                                              key={`${media.name}-${index}`}
                                            >
                                              <span>
                                                {
                                                  media.name
                                                }
                                              </span>

                                              {media.url ? (
                                                <a
                                                  href={
                                                    media.url
                                                  }
                                                  target="_blank"
                                                  rel="noreferrer"
                                                >
                                                  Open ↗
                                                </a>
                                              ) : (
                                                <em>
                                                  No link
                                                </em>
                                              )}
                                            </div>
                                          )
                                        )
                                      ) : (
                                        <div
                                          className={
                                            styles.mediaRow
                                          }
                                        >
                                          <span>
                                            No media posting detail.
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    <div
                                      className={
                                        styles.yellowCardTotal
                                      }
                                    >
                                      <span>
                                        Total Posting
                                      </span>
                                      <strong>
                                        {
                                          event.totalPosting
                                        }
                                      </strong>
                                    </div>
                                  </section>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            marginTop: 16,
            paddingTop: 14,
            borderTop:
              "1px solid #edf0f5"
          }}
        >
          <span
            style={{
              color: "#8a93a9",
              fontSize: 9,
              fontWeight: 700
            }}
          >
            {sortedEvents.length
              ? `Showing ${
                  (currentPage - 1) *
                    EVENTS_PER_PAGE +
                  1
                }–${Math.min(
                  currentPage *
                    EVENTS_PER_PAGE,
                  sortedEvents.length
                )} of ${
                  sortedEvents.length
                } events`
              : "Showing 0 events"}
          </span>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              flexWrap: "wrap"
            }}
          >
            <button
              type="button"
              onClick={() =>
                setCurrentPage(
                  (current) =>
                    Math.max(
                      1,
                      current - 1
                    )
                )
              }
              disabled={
                currentPage === 1
              }
              aria-label="Previous page"
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                border:
                  "1px solid #d6deed",
                background:
                  currentPage === 1
                    ? "#f4f6fa"
                    : "#ffffff",
                color:
                  currentPage === 1
                    ? "#b7bfd0"
                    : "#1f2942",
                fontSize: 18,
                fontWeight: 900,
                cursor:
                  currentPage === 1
                    ? "not-allowed"
                    : "pointer"
              }}
            >
              ‹
            </button>

            {pageNumbers.map(
              (page) => (
                <button
                  type="button"
                  key={page}
                  onClick={() =>
                    setCurrentPage(
                      page
                    )
                  }
                  aria-current={
                    currentPage ===
                    page
                      ? "page"
                      : undefined
                  }
                  style={{
                    minWidth: 34,
                    height: 34,
                    padding: "0 10px",
                    borderRadius: 999,
                    border:
                      currentPage ===
                      page
                        ? "1px solid #4963e6"
                        : "1px solid #d6deed",
                    background:
                      currentPage ===
                      page
                        ? "#4963e6"
                        : "#ffffff",
                    color:
                      currentPage ===
                      page
                        ? "#ffffff"
                        : "#1f2942",
                    fontSize: 11,
                    fontWeight: 900,
                    cursor: "pointer"
                  }}
                >
                  {page}
                </button>
              )
            )}

            <button
              type="button"
              onClick={() =>
                setCurrentPage(
                  (current) =>
                    Math.min(
                      totalPages,
                      current + 1
                    )
                )
              }
              disabled={
                currentPage ===
                totalPages
              }
              aria-label="Next page"
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                border:
                  "1px solid #d6deed",
                background:
                  currentPage ===
                  totalPages
                    ? "#f4f6fa"
                    : "#ffffff",
                color:
                  currentPage ===
                  totalPages
                    ? "#b7bfd0"
                    : "#1f2942",
                fontSize: 18,
                fontWeight: 900,
                cursor:
                  currentPage ===
                  totalPages
                    ? "not-allowed"
                    : "pointer"
              }}
            >
              ›
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
