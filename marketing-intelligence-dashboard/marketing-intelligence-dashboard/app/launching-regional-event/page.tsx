import Sidebar from "@/components/Sidebar";
import { getLaunchingRegionalEventData } from "@/lib/launching-regional-event";
import AnnualBigEventDashboard from "../annual-big-event/components/AnnualBigEventDashboard";

export const dynamic = "force-dynamic";

export default async function LaunchingRegionalEventPage() {
  const data = await getLaunchingRegionalEventData();

  return (
    <div className="app-shell">
      <Sidebar activeItem="Launching & Regional Event" />

      <main className="main-content">
        <AnnualBigEventDashboard
          initialData={data}
          pageTitle="Launching & Regional Event"
          dataApiPath="/api/launching-regional-event/data"
          aiApiPath="/api/launching-regional-event/ai"
          csvFileName="launching-regional-event-data.csv"
        />
      </main>
    </div>
  );
}
