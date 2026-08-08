import Link from "next/link";
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
          TEND has sealed live dashboard data and moderation controls. Sign in
          with the server-configured creator access key to continue.
        </p>
        <Link className="button button-primary" href="/login">
          Creator sign in
        </Link>
      </main>
    </div>
  );
}
