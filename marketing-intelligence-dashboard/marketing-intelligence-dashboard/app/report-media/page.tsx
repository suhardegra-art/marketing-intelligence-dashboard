import Sidebar from "@/components/Sidebar";
import ReportMediaDashboard from "./components/ReportMediaDashboard";

export const dynamic = "force-dynamic";

export default function ReportMediaPage() {
  return (
    <div className="app-shell">
      <Sidebar activeItem="Report Media" />

      <main className="main-content">
        <ReportMediaDashboard />
      </main>
    </div>
  );
}
