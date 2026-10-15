import Sidebar from "@/components/Sidebar";
import { MetaLiveProvider } from "@/components/MetaLiveProvider";
import MetaDashboardLive from "@/components/MetaDashboardLive";
import FacebookDashboardPreview from "./components/FacebookDashboardPreview";

export const dynamic = "force-dynamic";

export default function FacebookPage() {
  return (
    <div className="app-shell">
      <Sidebar activeItem="Facebook" />
      <MetaLiveProvider platform="facebook">
        {/* Temporary style bridge: preserve the existing global dashboard CSS.
            Legacy preview is visually hidden; all user-facing data comes from MetaDashboardLive.
            Do not remove before moving its global styles into a stylesheet. */}
        <div aria-hidden="true" style={{ display: "none" }}><FacebookDashboardPreview /></div>
        <MetaDashboardLive platform="facebook" />
      </MetaLiveProvider>
    </div>
  );
}
