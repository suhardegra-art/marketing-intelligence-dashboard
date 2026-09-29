import Sidebar from "@/components/Sidebar";
import { getReportMediaData } from "@/lib/report-media";
import ReportMediaDashboard from "./components/ReportMediaDashboard";

export const dynamic = "force-dynamic";

export default async function ReportMediaPage() {
  const data = await getReportMediaData();

  return (
    <div className="app-shell">
      <Sidebar activeItem="Report Media" />

      <main className="main-content">
        <ReportMediaDashboard initialData={data} />
      </main>
    </div>
  );
}
