"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type Platform = "instagram" | "facebook";

type InstagramRow = {
  date: string;
  content: string;
  type: "Reel" | "Post" | "Carousel";
  views: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
};

type FacebookRow = {
  date: string;
  content: string;
  type: "Reel" | "Video" | "Photo" | "Link";
  reach: number;
  impressions: number;
  reactions: number;
  comments: number;
  shares: number;
  clicks: number;
};

const INSTAGRAM_ROWS: InstagramRow[] = [
  { date: "2026-09-18", content: "Jalan licin? Tanjakan? Tetap pede! Motor listrik Indomobil eMotor...", type: "Reel", views: 82400, reach: 65100, likes: 923, comments: 31, shares: 144, saves: 88 },
  { date: "2026-09-17", content: "Daripada cuma jadi penghuni garasi, kenapa nggak di-upgrade...", type: "Reel", views: 62100, reach: 49300, likes: 704, comments: 26, shares: 121, saves: 75 },
  { date: "2026-09-15", content: "Siapa udah tau fitur TCS ini? Nggak perlu khawatir lagi...", type: "Carousel", views: 45500, reach: 38100, likes: 582, comments: 48, shares: 91, saves: 132 },
  { date: "2026-09-13", content: "Permisi yaa bu mau lewat ambil motor 😄", type: "Reel", views: 41200, reach: 33900, likes: 516, comments: 17, shares: 80, saves: 44 },
  { date: "2026-09-12", content: "Bawa banyak barang? Santai, bagasi Sprinto masih muat 😎", type: "Post", views: 38700, reach: 29600, likes: 438, comments: 39, shares: 76, saves: 120 },
  { date: "2026-09-10", content: "Nyuci motor listrik kena debu abu vulkanik? Gak perlu khawatir...", type: "Carousel", views: 35200, reach: 28100, likes: 401, comments: 42, shares: 69, saves: 143 },
  { date: "2026-09-08", content: "Nikmati Traction Control System, Hill Start Assist, dan Push Assist...", type: "Reel", views: 33100, reach: 26400, likes: 392, comments: 22, shares: 84, saves: 73 },
  { date: "2026-09-06", content: "Kami hadir di Indomobil Expo 2026 dengan berbagai pilihan...", type: "Post", views: 28600, reach: 21400, likes: 315, comments: 13, shares: 53, saves: 48 },
  { date: "2026-09-03", content: "Mulai dari memastikan motor mati, gunakan perlindungan diri...", type: "Carousel", views: 25400, reach: 19800, likes: 291, comments: 15, shares: 47, saves: 118 },
  { date: "2026-09-01", content: "Motor listrik untuk aktivitas sehari-hari, lebih praktis dan hemat...", type: "Reel", views: 23900, reach: 18400, likes: 276, comments: 18, shares: 45, saves: 39 },
  { date: "2026-08-29", content: "Tyranno untuk perjalanan jauh, cruise control bikin riding lebih santai...", type: "Reel", views: 21700, reach: 17100, likes: 252, comments: 11, shares: 41, saves: 32 },
  { date: "2026-08-26", content: "Adora Vibe untuk perjalanan harian dengan gaya yang lebih personal...", type: "Post", views: 19500, reach: 15100, likes: 231, comments: 9, shares: 33, saves: 54 }
];

const FACEBOOK_ROWS: FacebookRow[] = [
  { date: "2026-09-18", content: "Jalan licin? Tanjakan? Tetap pede! Motor listrik Indomobil eMotor...", type: "Reel", reach: 56200, impressions: 81400, reactions: 1540, comments: 112, shares: 214, clicks: 390 },
  { date: "2026-09-17", content: "Daripada cuma jadi penghuni garasi, kenapa nggak di-upgrade...", type: "Reel", reach: 49800, impressions: 72100, reactions: 1310, comments: 96, shares: 181, clicks: 344 },
  { date: "2026-09-15", content: "Siapa udah tau fitur TCS ini? Nggak perlu khawatir lagi...", type: "Photo", reach: 40100, impressions: 58900, reactions: 1025, comments: 84, shares: 152, clicks: 276 },
  { date: "2026-09-13", content: "Permisi yaa bu mau lewat ambil motor 😄", type: "Reel", reach: 36700, impressions: 52900, reactions: 970, comments: 71, shares: 144, clicks: 244 },
  { date: "2026-09-12", content: "Bawa banyak barang? Santai, bagasi Sprinto masih muat 😎", type: "Photo", reach: 33200, impressions: 48600, reactions: 890, comments: 66, shares: 128, clicks: 215 },
  { date: "2026-09-10", content: "Nyuci motor listrik kena debu abu vulkanik? Gak perlu khawatir...", type: "Video", reach: 30800, impressions: 45200, reactions: 812, comments: 58, shares: 116, clicks: 196 },
  { date: "2026-09-08", content: "Nikmati Traction Control System, Hill Start Assist, dan Push Assist...", type: "Reel", reach: 28600, impressions: 42100, reactions: 785, comments: 55, shares: 109, clicks: 182 },
  { date: "2026-09-06", content: "Kami hadir di Indomobil Expo 2026 dengan berbagai pilihan...", type: "Link", reach: 25200, impressions: 37400, reactions: 610, comments: 49, shares: 91, clicks: 438 },
  { date: "2026-09-03", content: "Mulai dari memastikan motor mati, gunakan perlindungan diri...", type: "Photo", reach: 22900, impressions: 33800, reactions: 594, comments: 42, shares: 80, clicks: 163 },
  { date: "2026-09-01", content: "Motor listrik untuk aktivitas sehari-hari, lebih praktis dan hemat...", type: "Reel", reach: 21100, impressions: 30900, reactions: 548, comments: 39, shares: 74, clicks: 151 },
  { date: "2026-08-29", content: "Tyranno untuk perjalanan jauh, cruise control bikin riding lebih santai...", type: "Video", reach: 19200, impressions: 28400, reactions: 492, comments: 34, shares: 69, clicks: 137 },
  { date: "2026-08-26", content: "Adora Vibe untuk perjalanan harian dengan gaya yang lebih personal...", type: "Photo", reach: 17100, impressions: 25300, reactions: 438, comments: 29, shares: 61, clicks: 121 }
];

function csvCell(value: string | number) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function download(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}

function instagramEr(row: InstagramRow) {
  if (!row.views) return 0;
  return ((row.likes + row.comments + row.shares + row.saves) / row.views) * 100;
}

function facebookEr(row: FacebookRow) {
  if (!row.reach) return 0;
  return ((row.reactions + row.comments + row.shares + row.clicks) / row.reach) * 100;
}

function readAppliedRange(platform: Platform) {
  const prefix = platform === "instagram" ? "ig" : "fb";
  const label =
    document.querySelector<HTMLElement>(`.${prefix}-filter-meta strong`)
      ?.textContent?.trim() || "";

  if (!label || label === "All publish dates") {
    return { from: "", to: "" };
  }

  const [rawFrom = "", rawTo = ""] = label.split("–").map((item) => item.trim());

  return {
    from: rawFrom === "Start" ? "" : rawFrom,
    to: rawTo === "Latest" ? "" : rawTo
  };
}

export default function SocialCsvDownloadMenu({
  platform
}: {
  platform: Platform;
}) {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);

  const config = useMemo(
    () =>
      platform === "instagram"
        ? {
            selector: ".ig-download",
            accent: "#4059d7",
            hover: "#f4f5ff"
          }
        : {
            selector: ".fb-download",
            accent: "#1877f2",
            hover: "#f1f7ff"
          },
    [platform]
  );

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | null = null;

    const tryMount = () => {
      if (cancelled || cleanup) return;

      const original = document.querySelector<HTMLButtonElement>(config.selector);

      if (!original || !original.parentElement) return;

      const mount = document.createElement("div");
      mount.dataset.socialCsvMount = platform;
      mount.style.position = "relative";
      mount.style.flex = "0 0 auto";

      original.insertAdjacentElement("afterend", mount);
      original.style.display = "none";
      setMountNode(mount);

      cleanup = () => {
        original.style.display = "";
        mount.remove();
      };
    };

    tryMount();

    const observer = new MutationObserver(tryMount);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    const timeout = window.setTimeout(tryMount, 250);

    return () => {
      cancelled = true;
      observer.disconnect();
      window.clearTimeout(timeout);
      cleanup?.();
    };
  }, [config.selector, platform]);

  function instagramRows(rows: InstagramRow[]) {
    return [
      ["Date", "Content", "Type", "Views", "Reach", "Likes", "Comments", "Shares", "Saves", "ER"],
      ...rows.map((row) => [
        row.date,
        row.content,
        row.type,
        row.views,
        row.reach,
        row.likes,
        row.comments,
        row.shares,
        row.saves,
        `${instagramEr(row).toFixed(2)}%`
      ])
    ];
  }

  function facebookRows(rows: FacebookRow[]) {
    return [
      ["Date", "Content", "Type", "Reach", "Impressions", "Reactions", "Comments", "Shares", "Clicks", "ER"],
      ...rows.map((row) => [
        row.date,
        row.content,
        row.type,
        row.reach,
        row.impressions,
        row.reactions,
        row.comments,
        row.shares,
        row.clicks,
        `${facebookEr(row).toFixed(2)}%`
      ])
    ];
  }

  function exportAll() {
    if (platform === "instagram") {
      download("instagram-content-all.csv", instagramRows(INSTAGRAM_ROWS));
    } else {
      download("facebook-content-all.csv", facebookRows(FACEBOOK_ROWS));
    }

    setOpen(false);
  }

  function exportFiltered() {
    const { from, to } = readAppliedRange(platform);

    if (platform === "instagram") {
      const rows = INSTAGRAM_ROWS.filter(
        (row) => (!from || row.date >= from) && (!to || row.date <= to)
      );

      download(
        `instagram-content-filtered-${from || "start"}-to-${to || "latest"}.csv`,
        instagramRows(rows)
      );
    } else {
      const rows = FACEBOOK_ROWS.filter(
        (row) => (!from || row.date >= from) && (!to || row.date <= to)
      );

      download(
        `facebook-content-filtered-${from || "start"}-to-${to || "latest"}.csv`,
        facebookRows(rows)
      );
    }

    setOpen(false);
  }

  if (!mountNode) return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        style={{
          minHeight: 40,
          padding: "0 16px",
          border: `2px solid ${config.accent}`,
          borderRadius: 10,
          background: "#fff",
          color: "#59617a",
          fontSize: 11,
          fontWeight: 900,
          cursor: "pointer",
          whiteSpace: "nowrap"
        }}
      >
        ↓ Download CSV <span style={{ fontSize: 10 }}>▾</span>
      </button>

      {open ? (
        <div
          role="menu"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 10px)",
            zIndex: 100,
            minWidth: 260,
            padding: 8,
            border: "1px solid #dce1ef",
            borderRadius: 14,
            background: "#fff",
            boxShadow: "0 18px 42px rgba(32,45,86,.16)"
          }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={exportFiltered}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = config.hover;
              event.currentTarget.style.color = config.accent;
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = "transparent";
              event.currentTarget.style.color = "#59617a";
            }}
            style={{
              display: "block",
              width: "100%",
              minHeight: 48,
              padding: "0 14px",
              border: 0,
              borderRadius: 9,
              background: "transparent",
              color: "#59617a",
              textAlign: "left",
              fontSize: 11,
              fontWeight: 800,
              cursor: "pointer"
            }}
          >
            Download Filtered by Date CSV
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={exportAll}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = config.hover;
              event.currentTarget.style.color = config.accent;
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = "transparent";
              event.currentTarget.style.color = "#59617a";
            }}
            style={{
              display: "block",
              width: "100%",
              minHeight: 48,
              padding: "0 14px",
              border: 0,
              borderRadius: 9,
              background: "transparent",
              color: "#59617a",
              textAlign: "left",
              fontSize: 11,
              fontWeight: 800,
              cursor: "pointer"
            }}
          >
            Download All CSV
          </button>
        </div>
      ) : null}
    </>,
    mountNode
  );
}
