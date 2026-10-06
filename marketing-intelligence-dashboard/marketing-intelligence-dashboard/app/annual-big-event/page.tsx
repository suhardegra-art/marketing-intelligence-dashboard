import Sidebar from "@/components/Sidebar";
import { getAnnualBigEventData } from "@/lib/annual-big-event-source";
import AnnualBigEventDashboard from "./components/AnnualBigEventDashboard";

export const dynamic = "force-dynamic";

export default async function AnnualBigEventPage() {
  const data = await getAnnualBigEventData();

  return (
    <div className="app-shell">
      <Sidebar activeItem="Annual Big Event" />

      <main className="main-content">
        <AnnualBigEventDashboard initialData={data} />
      </main>
    </div>
  );
}
