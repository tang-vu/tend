import { OnboardingForm } from "@/components/onboarding-form";
import { LiveDashboardLocked } from "@/components/live-dashboard-locked";
import { SiteHeader } from "@/components/site-header";
import { creatorDashboardAvailable } from "@/lib/http";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  if (!(await creatorDashboardAvailable())) return <LiveDashboardLocked />;
  return (
    <div className="onboarding-page">
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <div className="onboarding-intro">
          <span className="eyebrow">Creator onboarding</span>
          <h1>Give TEND the shape of your community.</h1>
          <p>
            Start with culture and authority. Connect platforms only when you
            are ready.
          </p>
        </div>
        <OnboardingForm />
      </main>
    </div>
  );
}
