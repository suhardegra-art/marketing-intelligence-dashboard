"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

const PAGE_SIZE = 100;

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

export default function TikTokTablePager() {
  const pathname = usePathname();
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [tableBody, setTableBody] = useState<HTMLTableSectionElement | null>(null);
  const [tablePanel, setTablePanel] = useState<HTMLElement | null>(null);
  const [totalRows, setTotalRows] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

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

    const tableWrap =
      panel?.querySelector<HTMLElement>(".table-wrap") ?? null;

    if (!panel || !body || !tableWrap) return;

    let pagerMount = panel.querySelector<HTMLElement>(
      "[data-tiktok-table-pager]"
    );

    if (!pagerMount) {
      pagerMount = document.createElement("div");
      pagerMount.dataset.tiktokTablePager = "true";
      tableWrap.insertAdjacentElement("afterend", pagerMount);
    }

    setTablePanel(panel);
    setTableBody(body);
    setMountNode(pagerMount);
    setTotalRows(body.querySelectorAll("tr").length);
    setCurrentPage(1);

    return () => {
      body.querySelectorAll<HTMLTableRowElement>("tr").forEach((row) => {
        row.style.display = "";
      });

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

    tableBody.querySelectorAll<HTMLTableRowElement>("tr").forEach((row, index) => {
      row.style.display = index >= start && index < end ? "" : "none";
    });
  }, [tableBody, currentPage, totalPages]);

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

  const circleButton = (active = false, disabled = false) => ({
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
  } as const);

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
        Showing <strong style={{ color: "#59617a" }}>{firstVisible}-{lastVisible}</strong>{" "}
        of <strong style={{ color: "#59617a" }}>{totalRows}</strong> videos
        <span style={{ marginLeft: 8 }}>• 100 videos / page</span>
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
