"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  type YouTubePreviewContent,
  youtubeEngagementRate
} from "../youtubePreviewData";

type SortKey =
  | "date"
  | "content"
  | "views"
  | "likes"
  | "comments"
  | "shares"
  | "er";

type SortDirection = "asc" | "desc";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function csvEscape(value: string | number) {
  const raw = String(value ?? "");
  if (/[",\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function downloadCsv(
  filename: string,
  rows: YouTubePreviewContent[]
) {
  const header = [
    "Date",
    "Content",
    "Content Type",
    "Views",
    "Likes",
    "Comments",
    "Shares",
    "Engagement Rate",
    "Avg View Duration",
    "Avg % Viewed",
    "Link"
  ];

  const body = rows.map((row) => [
    row.publishedAt.slice(0, 10),
    row.title,
    row.contentType,
    row.views,
    row.likes,
    row.comments,
    row.shares,
    youtubeEngagementRate(row).toFixed(2),
    row.avgViewDuration,
    row.avgViewed.toFixed(1),
    row.permalink
  ]);

  const csv = [header, ...body]
    .map((line) => line.map(csvEscape).join(","))
    .join("\n");

  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function YouTubeContentTable({
  filteredRows,
  allRows
}: {
  filteredRows: YouTubePreviewContent[];
  allRows: YouTubePreviewContent[];
}) {
  const searchParams = useSearchParams();

  const fromDate = searchParams.get("from") || "";
  const toDate = searchParams.get("to") || "";

  const [sortKey, setSortKey] =
    useState<SortKey>("date");

  const [sortDirection, setSortDirection] =
    useState<SortDirection>("desc");

  const [page, setPage] = useState(1);
  const [csvOpen, setCsvOpen] = useState(false);

  // Each pagination number now contains up to 100 videos.
  const pageSize = 100;

  /*
   * IMPORTANT:
   * The main YouTube Analytics API query can include a video because it
   * received activity during the selected period, even if that video was
   * originally published outside the selected period.
   *
   * For the YouTube Content table, the user wants a publish-date filter.
   * Therefore we apply From/To against publishedAt again here.
   */
  const rowsInPublishDateRange = useMemo(() => {
    if (!fromDate && !toDate) {
      return filteredRows;
    }

    return filteredRows.filter((row) => {
      const publishedDate = row.publishedAt.slice(0, 10);

      const matchesFrom = fromDate
        ? publishedDate >= fromDate
        : true;

      const matchesTo = toDate
        ? publishedDate <= toDate
        : true;

      return matchesFrom && matchesTo;
    });
  }, [filteredRows, fromDate, toDate]);

  useEffect(() => {
    // Always return to page 1 when the top date filter changes.
    setPage(1);
  }, [fromDate, toDate]);

  const sorted = useMemo(() => {
    const copy = [...rowsInPublishDateRange];

    copy.sort((a, b) => {
      let result = 0;

      switch (sortKey) {
        case "date":
          result = a.publishedAt.localeCompare(
            b.publishedAt
          );
          break;

        case "content":
          result = a.title.localeCompare(b.title);
          break;

        case "views":
          result = a.views - b.views;
          break;

        case "likes":
          result = a.likes - b.likes;
          break;

        case "comments":
          result = a.comments - b.comments;
          break;

        case "shares":
          result = a.shares - b.shares;
          break;

        case "er":
          result =
            youtubeEngagementRate(a) -
            youtubeEngagementRate(b);
          break;
      }

      return sortDirection === "asc"
        ? result
        : -result;
    });

    return copy;
  }, [
    rowsInPublishDateRange,
    sortKey,
    sortDirection
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(sorted.length / pageSize)
  );

  const safePage = Math.min(page, totalPages);

  const start =
    (safePage - 1) * pageSize;

  const visibleRows = sorted.slice(
    start,
    start + pageSize
  );

  function toggleSort(key: SortKey) {
    setPage(1);

    if (sortKey === key) {
      setSortDirection((current) =>
        current === "asc" ? "desc" : "asc"
      );
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  }

  const sortGlyph = (key: SortKey) =>
    sortKey === key
      ? sortDirection === "asc"
        ? "↑"
        : "↓"
      : "↕";

  return (
    <section className="yt-card yt-content-table-card yt-wide-card">
      <div className="yt-content-table-header">
        <div>
          <h2>YouTube Content</h2>

          <p>
            {rowsInPublishDateRange.length} videos in selected
            publish-date period • {allRows.length} total videos stored
          </p>
        </div>

        <div className="yt-csv-menu-wrap">
          <button
            type="button"
            className="yt-csv-button"
            onClick={() =>
              setCsvOpen((value) => !value)
            }
          >
            ↓ Download CSV <span>▾</span>
          </button>

          {csvOpen ? (
            <div className="yt-csv-menu">
              <button
                type="button"
                onClick={() => {
                  downloadCsv(
                    "youtube-content-filtered.csv",
                    rowsInPublishDateRange
                  );
                  setCsvOpen(false);
                }}
              >
                Download Filtered CSV
              </button>

              <button
                type="button"
                onClick={() => {
                  downloadCsv(
                    "youtube-content-all.csv",
                    allRows
                  );
                  setCsvOpen(false);
                }}
              >
                Download All CSV
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="yt-table-wrap yt-content-table-scroll">
        <table className="yt-table yt-full-content-table">
          <thead>
            <tr>
              <th>
                <button
                  onClick={() =>
                    toggleSort("date")
                  }
                >
                  Date {sortGlyph("date")}
                </button>
              </th>

              <th>
                <button
                  onClick={() =>
                    toggleSort("content")
                  }
                >
                  Content {sortGlyph("content")}
                </button>
              </th>

              <th>Type</th>

              <th>
                <button
                  onClick={() =>
                    toggleSort("views")
                  }
                >
                  Views {sortGlyph("views")}
                </button>
              </th>

              <th>
                <button
                  onClick={() =>
                    toggleSort("likes")
                  }
                >
                  Likes {sortGlyph("likes")}
                </button>
              </th>

              <th>
                <button
                  onClick={() =>
                    toggleSort("comments")
                  }
                >
                  Comments {sortGlyph("comments")}
                </button>
              </th>

              <th>
                <button
                  onClick={() =>
                    toggleSort("shares")
                  }
                >
                  Shares {sortGlyph("shares")}
                </button>
              </th>

              <th>
                <button
                  onClick={() =>
                    toggleSort("er")
                  }
                >
                  ER {sortGlyph("er")}
                </button>
              </th>

              <th>Avg. duration</th>
              <th>Avg. % viewed</th>
              <th>Link</th>
            </tr>
          </thead>

          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="yt-empty-row"
                >
                  No videos were published inside this date range.
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => (
                <tr key={row.id}>
                  <td>{formatDate(row.publishedAt)}</td>

                  <td
                    className="yt-content-title-cell"
                    title={row.title}
                  >
                    {row.title}
                  </td>

                  <td>
                    <span
                      className={`yt-content-type-badge ${row.contentType.toLowerCase()}`}
                    >
                      {row.contentType}
                    </span>
                  </td>

                  <td>
                    <strong>
                      {formatNumber(row.views)}
                    </strong>
                  </td>

                  <td>
                    {formatNumber(row.likes)}
                  </td>

                  <td>
                    {formatNumber(row.comments)}
                  </td>

                  <td>
                    {formatNumber(row.shares)}
                  </td>

                  <td>
                    {youtubeEngagementRate(row).toFixed(
                      2
                    )}
                    %
                  </td>

                  <td>{row.avgViewDuration}</td>

                  <td>
                    {row.avgViewed.toFixed(1)}%
                  </td>

                  <td>
                    <a
                      href={row.permalink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open ↗
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="yt-pagination-row">
        <div>
          Showing{" "}
          <strong>
            {sorted.length === 0
              ? 0
              : start + 1}
            –
            {Math.min(
              start + pageSize,
              sorted.length
            )}
          </strong>{" "}
          of <strong>{sorted.length}</strong> videos

          <span>
            • {pageSize} videos / page
          </span>
        </div>

        <div className="yt-pagination-controls">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() =>
              setPage((current) =>
                Math.max(1, current - 1)
              )
            }
          >
            ‹
          </button>

          {Array.from({
            length: totalPages
          }).map((_, index) => {
            const pageNumber = index + 1;

            return (
              <button
                type="button"
                key={pageNumber}
                className={
                  safePage === pageNumber
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setPage(pageNumber)
                }
              >
                {pageNumber}
              </button>
            );
          })}

          <button
            type="button"
            disabled={
              safePage >= totalPages
            }
            onClick={() =>
              setPage((current) =>
                Math.min(
                  totalPages,
                  current + 1
                )
              )
            }
          >
            ›
          </button>
        </div>
      </div>
    </section>
  );
}
