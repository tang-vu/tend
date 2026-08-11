import Link from "next/link";
import { SproutIcon } from "./icons";
import { LogoutButton } from "./logout-button";

export function Wordmark() {
  return (
    <span className="wordmark">
      <span className="wordmark-mark">
        <SproutIcon />
      </span>
      TEND
    </span>
  );
}

export function SiteHeader({ dashboard = false }: { dashboard?: boolean }) {
  return (
    <header
      className={dashboard ? "site-header dashboard-header" : "site-header"}
    >
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Link aria-label="TEND home" href="/" className="brand-link">
        <Wordmark />
      </Link>
      <nav aria-label="Primary navigation">
        {dashboard ? (
          <>
            <Link href="/community">Overview</Link>
            <Link href="/memories">Memory</Link>
            <Link href="/settings">Settings</Link>
            {process.env.TEND_MODE !== "live" && (
              <Link className="nav-demo" href="/demo">
                Demo controller
              </Link>
            )}
            {process.env.TEND_MODE === "live" && <LogoutButton />}
          </>
        ) : (
          <>
            <Link href="/#how-it-works">How it works</Link>
            <Link href="/#safety">Safety</Link>
            <Link className="nav-evidence" href="/evidence">
              Judge brief
            </Link>
            <Link href="/community">Dashboard</Link>
            <Link className="nav-demo" href="/demo">
              Try the demo
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
