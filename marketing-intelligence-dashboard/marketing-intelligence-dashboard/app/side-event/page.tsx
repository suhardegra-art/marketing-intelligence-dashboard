import Sidebar from "@/components/Sidebar";
import { getSideEventData } from "@/lib/side-event";
import AnnualBigEventDashboard from "../annual-big-event/components/AnnualBigEventDashboard";

export const dynamic = "force-dynamic";

export default async function SideEventPage() {
  const data = await getSideEventData();

  return (
    <div className="app-shell">
      <Sidebar activeItem="Side Event" />

      <main className="main-content">
        <AnnualBigEventDashboard
          initialData={data}
          pageTitle="Side Event"
          dataApiPath="/api/side-event/data"
          aiApiPath="/api/side-event/ai"
          csvFileName="side-event-data.csv"
        />
      </main>
    </div>
  );
}
