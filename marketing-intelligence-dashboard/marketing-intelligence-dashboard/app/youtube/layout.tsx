import type { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import YouTubeSectionNav from "@/components/YouTubeSectionNav";
import "./youtube.css";

export default function YouTubeLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <Sidebar activeItem="YouTube" />

      <main className="yt-main-shell">
        <div className="yt-workspace">
          <YouTubeSectionNav />
          <div className="yt-page-content">{children}</div>
        </div>
      </main>
    </div>
  );
}
