import type { Metadata } from "next";
import { DemoExperience } from "@/components/demo-experience";
import { SiteHeader } from "@/components/site-header";
import { getRepository, readiness } from "@/lib/server";

export const metadata: Metadata = {
  title: "Continuity demo",
  description: "Run TEND's three-act persisted moderation story.",
};

export const dynamic = "force-dynamic";

export default function DemoPage() {
  const initialState = {
    ok: true,
    snapshot: getRepository().getSnapshot(),
    readiness: readiness(),
    serverTime: new Date().toISOString(),
  };
  return (
    <div className="demo-page">
      <SiteHeader dashboard />
      <main>
        <DemoExperience initialState={initialState} />
      </main>
    </div>
  );
}
