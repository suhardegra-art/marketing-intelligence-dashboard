import Sidebar from "@/components/Sidebar";
import { getAnnualBigEventData } from "@/lib/annual-big-event-source";
import { getLaunchingRegionalEventData } from "@/lib/launching-regional-event";
import { getSideEventData } from "@/lib/side-event";
import { getReportMediaData } from "@/lib/report-media";
import OfflineOverviewDashboard from "./components/OfflineOverviewDashboard";

export const dynamic = "force-dynamic";

export default async function OfflineOverviewPage() {
  const [annual, launchingRegional, regular, media] = await Promise.all([
    getAnnualBigEventData(),
    getLaunchingRegionalEventData(),
    getSideEventData(),
    getReportMediaData()
  ]);

  return (
    <div className="app-shell">
      <Sidebar activeItem="Offline Overview" />
      <main className="main-content">
        <OfflineOverviewDashboard
          annual={annual}
          launchingRegional={launchingRegional}
          regular={regular}
          media={media}
        />
      </main>
    </div>
  );
}
