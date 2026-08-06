import { ShieldIcon } from "./icons";
import { SiteHeader } from "./site-header";

export function LiveDashboardLocked() {
  return (
    <div className="not-found-page">
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <ShieldIcon />
        <span className="eyebrow">Live safety lock</span>
        <h1>Creator access needs authentication.</h1>
        <p>
          TEND has disabled live dashboard data and moderation controls. Add
          creator authentication and community authorization before opening this
          surface.
        </p>
      </main>
    </div>
  );
}
