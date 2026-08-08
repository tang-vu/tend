import type { Metadata } from "next";
import { DemoExperience } from "@/components/demo-experience";
import { SiteHeader } from "@/components/site-header";
import { LiveDashboardLocked } from "@/components/live-dashboard-locked";
import { creatorDashboardAvailable } from "@/lib/http";
import { getRepository, readiness } from "@/lib/server";

export const metadata: Metadata = {
  title: "Continuity demo",
  description: "Run TEND's three-act persisted moderation story.",
};

export const dynamic = "force-dynamic";

export default async function DemoPage() {
  if (!(await creatorDashboardAvailable())) return <LiveDashboardLocked />;
  const initialState = {
    ok: true,
    snapshot: getRepository().getSnapshot(),
    readiness: readiness(),
    serverTime: new Date().toISOString(),
  };
  return (
    <div className="demo-page">
      <SiteHeader dashboard />
      <main id="main-content" tabIndex={-1}>
        <DemoExperience initialState={initialState} />
      </main>
    </div>
  );
}
