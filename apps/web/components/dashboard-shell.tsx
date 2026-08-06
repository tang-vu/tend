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
  return (
    <div className="dashboard-page">
      <SiteHeader dashboard />
      <main>
        <section className="dashboard-intro">
          <div>
            <div className="dashboard-kicker">
              <span>{eyebrow}</span>
              <ModeBadge compact />
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
          Transparent demo state · <Link href="/settings">Readiness</Link>
        </span>
      </footer>
    </div>
  );
}
