"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

const PAGE_SIZE = 100;

type SortDirection = "default" | "asc" | "desc";

type SortConfig = {
  columnIndex: number;
  type: "date" | "text" | "number" | "percent";
  ascLabel: string;
  descLabel: string;
};

const SORTABLE_COLUMNS: SortConfig[] = [
  {
    columnIndex: 0,
    type: "date",
    ascLabel: "Oldest → Newest",
    descLabel: "Newest → Oldest"
  },
  {
    columnIndex: 1,
    type: "text",
    ascLabel: "A → Z",
    descLabel: "Z → A"
  },
  {
    columnIndex: 2,
    type: "number",
    ascLabel: "Lowest → Highest",
    descLabel: "Highest → Lowest"
  },
  {
    columnIndex: 3,
    type: "number",
    ascLabel: "Lowest → Highest",
    descLabel: "Highest → Lowest"
  },
  {
    columnIndex: 4,
    type: "number",
    ascLabel: "Lowest → Highest",
    descLabel: "Highest → Lowest"
  },
  {
    columnIndex: 5,
    type: "number",
    ascLabel: "Lowest → Highest",
    descLabel: "Highest → Lowest"
  },
  {
    columnIndex: 6,
    type: "percent",
    ascLabel: "Lowest → Highest",
    descLabel: "Highest → Lowest"
  }
];

function buildVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | "..."> = [1];

  if (currentPage > 4) pages.push("...");

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (currentPage < totalPages - 3) pages.push("...");

  pages.push(totalPages);
  return pages;
}

function parseNumeric(value: string) {
  const cleaned = value
    .replace(/,/g, "")
    .replace(/%/g, "")
    .replace(/[^\d.-]/g, "");

  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
}

function parseDate(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getCellValue(
  row: HTMLTableRowElement,
  config: SortConfig
): string | number {
  const text =
    row.cells[config.columnIndex]?.textContent?.trim() ?? "";

  if (config.type === "number" || config.type === "percent") {
    return parseNumeric(text);
  }

  if (config.type === "date") {
    return parseDate(text);
  }

  return text.toLocaleLowerCase();
}

export default function TikTokTablePager() {
  const pathname = usePathname();
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [tableBody, setTableBody] = useState<HTMLTableSectionElement | null>(null);
  const [tablePanel, setTablePanel] = useState<HTMLElement | null>(null);
  const [totalRows, setTotalRows] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortVersion, setSortVersion] = useState(0);
  const [activeSort, setActiveSort] = useState<{
    columnIndex: number;
    direction: SortDirection;
  } | null>(null);

  useEffect(() => {
    if (pathname !== "/tiktok") return;

    const panels = Array.from(
      document.querySelectorAll<HTMLElement>(".table-panel")
    );

    const panel =
      panels.find(
        (item) =>
          item.querySelector("h3")?.textContent?.trim() === "TikTok Content"
      ) ?? null;

    const body =
      panel?.querySelector<HTMLTableSectionElement>("table tbody") ?? null;

    const table =
      panel?.querySelector<HTMLTableElement>("table") ?? null;

    const tableWrap =
      panel?.querySelector<HTMLElement>(".table-wrap") ?? null;

    if (!panel || !body || !table || !tableWrap) return;

    // Preserve narrowed non-null references for nested callbacks.
    const panelElement = panel;
    const bodyElement = body;
    const tableElement = table;
    const tableWrapElement = tableWrap;

    const originalRows = Array.from(
      bodyElement.querySelectorAll<HTMLTableRowElement>("tr")
    );

    originalRows.forEach((row, index) => {
      row.dataset.originalOrder = String(index);
    });

    let pagerMount = panelElement.querySelector<HTMLElement>(
      "[data-tiktok-table-pager]"
    );

    if (!pagerMount) {
      pagerMount = document.createElement("div");
      pagerMount.dataset.tiktokTablePager = "true";
      tableWrapElement.insertAdjacentElement("afterend", pagerMount);
    }

    const headerCells = Array.from(
      tableElement.querySelectorAll<HTMLTableCellElement>("thead th")
    );

    const createdControls: HTMLSelectElement[] = [];

    function resetOtherControls(activeColumnIndex: number) {
      createdControls.forEach((control) => {
        if (Number(control.dataset.columnIndex) !== activeColumnIndex) {
          control.value = "default";
        }
      });
    }

    function applySort(config: SortConfig, direction: SortDirection) {
      const rows = Array.from(
        bodyElement.querySelectorAll<HTMLTableRowElement>("tr")
      );

      if (direction === "default") {
        rows.sort(
          (a, b) =>
            Number(a.dataset.originalOrder ?? 0) -
            Number(b.dataset.originalOrder ?? 0)
        );
      } else {
        rows.sort((a, b) => {
          const aValue = getCellValue(a, config);
          const bValue = getCellValue(b, config);

          let comparison = 0;

          if (typeof aValue === "number" && typeof bValue === "number") {
            comparison = aValue - bValue;
          } else {
            comparison = String(aValue).localeCompare(String(bValue), undefined, {
              numeric: true,
              sensitivity: "base"
            });
          }

          return direction === "asc" ? comparison : -comparison;
        });
      }

      rows.forEach((row) => bodyElement.appendChild(row));

      setCurrentPage(1);
      setActiveSort(
        direction === "default"
          ? null
          : {
              columnIndex: config.columnIndex,
              direction
            }
      );
      setSortVersion((value) => value + 1);
    }

    SORTABLE_COLUMNS.forEach((config) => {
      const header = headerCells[config.columnIndex];
      if (!header) return;

      const existing =
        header.querySelector<HTMLSelectElement>(
          "[data-tiktok-sort-control]"
        );

      if (existing) existing.remove();

      header.style.whiteSpace = "nowrap";

      const select = document.createElement("select");
      select.dataset.tiktokSortControl = "true";
      select.dataset.columnIndex = String(config.columnIndex);
      select.setAttribute(
        "aria-label",
        `Sort ${header.textContent?.trim() ?? "column"}`
      );
      select.title = "Sort column";
      select.value = "default";

      const defaultOption = document.createElement("option");
      defaultOption.value = "default";
      defaultOption.textContent = "Sort";

      const ascOption = document.createElement("option");
      ascOption.value = "asc";
      ascOption.textContent = config.ascLabel;

      const descOption = document.createElement("option");
      descOption.value = "desc";
      descOption.textContent = config.descLabel;

      select.append(defaultOption, ascOption, descOption);

      Object.assign(select.style, {
        marginLeft: "6px",
        height: "24px",
        maxWidth: "30px",
        border: "1px solid #dce1ef",
        borderRadius: "6px",
        background: "#fff",
        color: "#59617a",
        fontSize: "10px",
        cursor: "pointer",
        verticalAlign: "middle",
        padding: "0 2px"
      });

      select.addEventListener("change", () => {
        const direction = select.value as SortDirection;

        if (direction !== "default") {
          resetOtherControls(config.columnIndex);
        }

        applySort(config, direction);
      });

      header.appendChild(select);
      createdControls.push(select);
    });

    setTablePanel(panelElement);
    setTableBody(bodyElement);
    setMountNode(pagerMount);
    setTotalRows(originalRows.length);
    setCurrentPage(1);

    return () => {
      bodyElement.querySelectorAll<HTMLTableRowElement>("tr").forEach((row) => {
        row.style.display = "";
      });

      originalRows
        .sort(
          (a, b) =>
            Number(a.dataset.originalOrder ?? 0) -
            Number(b.dataset.originalOrder ?? 0)
        )
        .forEach((row) => bodyElement.appendChild(row));

      createdControls.forEach((control) => control.remove());

      if (pagerMount?.parentNode) {
        pagerMount.parentNode.removeChild(pagerMount);
      }
    };
  }, [pathname]);

  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));

  useEffect(() => {
    if (!tableBody) return;

    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    if (safePage !== currentPage) {
      setCurrentPage(safePage);
      return;
    }

    const start = (safePage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    tableBody
      .querySelectorAll<HTMLTableRowElement>("tr")
      .forEach((row, index) => {
        row.style.display = index >= start && index < end ? "" : "none";
      });
  }, [tableBody, currentPage, totalPages, sortVersion]);

  const visiblePages = useMemo(
    () => buildVisiblePages(currentPage, totalPages),
    [currentPage, totalPages]
  );

  if (!mountNode || totalRows === 0) return null;

  const firstVisible = (currentPage - 1) * PAGE_SIZE + 1;
  const lastVisible = Math.min(currentPage * PAGE_SIZE, totalRows);

  function changePage(page: number) {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(nextPage);

    window.setTimeout(() => {
      tablePanel?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 20);
  }

  const circleButton = (active = false, disabled = false) =>
    ({
      width: 42,
      height: 42,
      borderRadius: "50%",
      border: active ? "1px solid #4059d7" : "1px solid #cfd5e5",
      background: active ? "#4059d7" : disabled ? "#f1f2f6" : "#fff",
      color: active ? "#fff" : disabled ? "#b1b6c5" : "#141b34",
      display: "inline-grid",
      placeItems: "center",
      fontWeight: 900,
      fontSize: 14,
      cursor: disabled ? "not-allowed" : "pointer",
      boxShadow: active ? "0 8px 18px rgba(64,89,215,.20)" : "none"
    }) as const;

  const activeSortLabel =
    activeSort?.direction === "asc"
      ? "Ascending"
      : activeSort?.direction === "desc"
        ? "Descending"
        : null;

  return createPortal(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
        paddingTop: 18,
        marginTop: 4,
        borderTop: "1px solid #eef0f6"
      }}
    >
      <div style={{ color: "#8a92a8", fontSize: 10, lineHeight: 1.5 }}>
        Showing{" "}
        <strong style={{ color: "#59617a" }}>
          {firstVisible}-{lastVisible}
        </strong>{" "}
        of <strong style={{ color: "#59617a" }}>{totalRows}</strong> videos
        <span style={{ marginLeft: 8 }}>• 100 videos / page</span>
        {activeSortLabel ? (
          <span style={{ marginLeft: 8, color: "#5364d8", fontWeight: 800 }}>
            • Sorted {activeSortLabel}
          </span>
        ) : null}
      </div>

      <nav
        aria-label="TikTok content pages"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8
        }}
      >
        <button
          type="button"
          aria-label="Previous page"
          disabled={currentPage === 1}
          onClick={() => changePage(currentPage - 1)}
          style={circleButton(false, currentPage === 1)}
        >
          ‹
        </button>

        {visiblePages.map((item, index) =>
          item === "..." ? (
            <span
              key={`ellipsis-${index}`}
              style={{
                width: 28,
                textAlign: "center",
                color: "#8a92a8",
                fontWeight: 800
              }}
            >
              …
            </span>
          ) : (
            <button
              type="button"
              key={item}
              aria-label={`Page ${item}`}
              aria-current={currentPage === item ? "page" : undefined}
              onClick={() => changePage(item)}
              style={circleButton(currentPage === item)}
            >
              {item}
            </button>
          )
        )}

        <button
          type="button"
          aria-label="Next page"
          disabled={currentPage === totalPages}
          onClick={() => changePage(currentPage + 1)}
          style={circleButton(false, currentPage === totalPages)}
        >
          ›
        </button>
      </nav>
    </div>,
    mountNode
  );
}
