import Link from "next/link";
import type { ReactNode } from "react";
import { ModeBadge } from "./mode-badge";
import { SiteHeader } from "./site-header";

export function DashboardShell({
  children,
  eyebrow,
  title,
  description,
  actions,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  const mode = process.env.TEND_MODE === "live" ? "live" : "demo";
  return (
    <div className="dashboard-page">
      <SiteHeader dashboard />
      <main id="main-content" tabIndex={-1}>
        <section className="dashboard-intro">
          <div>
            <div className="dashboard-kicker">
              <span>{eyebrow}</span>
              <ModeBadge compact mode={mode} />
            </div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          {actions && <div className="dashboard-actions">{actions}</div>}
        </section>
        {children}
      </main>
      <footer className="dashboard-footer">
        <span>TEND · The Green Room</span>
        <span>
          {mode === "live"
            ? "Authenticated live state"
            : "Transparent demo state"}{" "}
          · <Link href="/settings">Readiness</Link>
        </span>
      </footer>
    </div>
  );
}
