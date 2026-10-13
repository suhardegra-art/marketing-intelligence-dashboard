import Sidebar from "@/components/Sidebar";
import SocialCsvDownloadMenu from "@/components/SocialCsvDownloadMenu";
import FacebookDashboardPreview from "./components/FacebookDashboardPreview";

export const dynamic = "force-dynamic";

export default function FacebookPage() {
  return (
    <div className="app-shell">
      <Sidebar activeItem="Facebook" />
      <FacebookDashboardPreview />
      <SocialCsvDownloadMenu platform="facebook" />
    </div>
  );
}
