import Sidebar from "@/components/Sidebar";
import { MetaLiveProvider } from "@/components/MetaLiveProvider";
import MetaDashboardLive from "@/components/MetaDashboardLive";
import InstagramDashboardPreview from "./components/InstagramDashboardPreview";

export const dynamic = "force-dynamic";

export default function InstagramPage() {
  return (
    <div className="app-shell">
      <Sidebar activeItem="Instagram" />
      <MetaLiveProvider platform="instagram">
        {/* Temporary style bridge: preserve the existing global dashboard CSS.
            Legacy preview is visually hidden; all user-facing data comes from MetaDashboardLive.
            Do not remove before moving its global styles into a stylesheet. */}
        <div aria-hidden="true" style={{ display: "none" }}><InstagramDashboardPreview /></div>
        <MetaDashboardLive platform="instagram" />
      </MetaLiveProvider>
    </div>
  );
}
