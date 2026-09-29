import Link from "next/link";
import TikTokTablePager from "@/components/TikTokTablePager";

const groups = [
  {
    label: "ONLINE",
    items: [
      "Social Media Overview",
      "Instagram",
      "TikTok",
      "TikTok Live",
      "Facebook",
      "YouTube",
      "Auto Reply Comment"
    ]
  },
  {
    label: "WEBSITE",
    items: [
      "Website Overview",
      "SEO Report",
      "Website Growth",
      "Lead Generation",
      "Page Performance"
    ]
  },
  {
    label: "OFFLINE",
    items: [
      "Offline Overview",
      "Annual Big Event",
      "Launching & Regional Event",
      "Side Event",
      "Report Media"
    ]
  }
];

function itemHref(item: string) {
  if (item === "Instagram") return "/instagram";
  if (item === "TikTok") return "/tiktok";
  if (item === "TikTok Live") return "/tiktok-live";
  if (item === "YouTube") return "/youtube";
  if (item === "Auto Reply Comment") return "/auto-reply-comment";
  if (item === "Offline Overview") return "/offline-overview";
  if (item === "Annual Big Event") return "/annual-big-event";
  if (item === "Launching & Regional Event") return "/launching-regional-event";
  if (item === "Side Event") return "/side-event";
  if (item === "Report Media") return "/report-media";
  return null;
}

export default function Sidebar({
  activeItem = "Dashboard"
}: {
  activeItem?: string;
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark small">IM</div>
        <div>
          <strong>INDOMOBIL</strong>
          <span>eMOTOR</span>
        </div>
      </div>

      <nav>
        <Link
          href="/dashboard"
          className={`nav-item ${
            activeItem === "Dashboard" ? "active" : ""
          }`}
          style={{ textDecoration: "none" }}
        >
          <span>▦</span> Dashboard
        </Link>

        {groups.map((group) => (
          <div className="nav-group" key={group.label}>
            <p>{group.label}</p>

            {group.items.map((item) => {
              const href = itemHref(item);

              return href ? (
                <Link
                  href={href}
                  className={`nav-item ${
                    activeItem === item ? "active" : ""
                  }`}
                  style={{ textDecoration: "none" }}
                  key={item}
                >
                  <span>•</span>
                  {item}
                </Link>
              ) : (
                <button className="nav-item" key={item}>
                  <span>•</span>
                  {item}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <TikTokTablePager />
    </aside>
  );
}
