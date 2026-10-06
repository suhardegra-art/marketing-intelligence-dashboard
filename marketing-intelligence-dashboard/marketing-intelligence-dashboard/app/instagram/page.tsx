import Sidebar from "@/components/Sidebar";
import InstagramDashboardPreview from "./components/InstagramDashboardPreview";

export const dynamic = "force-dynamic";

export default function InstagramPage() {
  return (
    <div className="app-shell">
      <Sidebar activeItem="Instagram" />
      <InstagramDashboardPreview />
    </div>
  );
}
