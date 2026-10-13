import Sidebar from "@/components/Sidebar";
import FacebookDashboardPreview from "./components/FacebookDashboardPreview";

export const dynamic = "force-dynamic";

export default function FacebookPage() {
  return (
    <div className="app-shell">
      <Sidebar activeItem="Facebook" />
      <FacebookDashboardPreview />
    </div>
  );
}
