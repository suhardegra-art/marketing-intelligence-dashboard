import type { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import "./youtube.css";

export default function YouTubeLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <Sidebar activeItem="YouTube" />
      <main className="yt-main-shell">{children}</main>
    </div>
  );
}
