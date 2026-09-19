"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "Overview", href: "/youtube", icon: "▦" },
  { label: "Content", href: "/youtube/content", icon: "▶" },
  { label: "Audience", href: "/youtube/audience", icon: "◉" },
  { label: "Discovery", href: "/youtube/discovery", icon: "⌁" },
  { label: "AI Performance", href: "/youtube/ai-performance", icon: "✦" }
];

export default function YouTubeSectionNav() {
  const pathname = usePathname();

  return (
    <aside className="yt-section-nav">
      <div className="yt-section-brand">
        <div className="yt-logo-mark">▶</div>
        <div>
          <strong>YouTube</strong>
          <span>Analytics</span>
        </div>
      </div>

      <div className="yt-section-status">
        <span className="yt-status-dot" />
        <div>
          <strong>Dashboard UI</strong>
          <small>API connection next</small>
        </div>
      </div>

      <nav>
        {items.map((item) => {
          const active =
            item.href === "/youtube"
              ? pathname === "/youtube"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`yt-section-link ${active ? "active" : ""}`}
            >
              <span className="yt-section-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="yt-section-note">
        <strong>Data Sources</strong>
        <span>YouTube Data API</span>
        <span>YouTube Analytics API</span>
        <span>YouTube Reporting API</span>
      </div>
    </aside>
  );
}
