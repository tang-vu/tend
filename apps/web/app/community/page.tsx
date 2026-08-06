import Link from "next/link";
import {
  ClockIcon,
  MemoryIcon,
  ShieldIcon,
  SproutIcon,
} from "@/components/icons";
import { DashboardShell } from "@/components/dashboard-shell";
import { LiveDashboardLocked } from "@/components/live-dashboard-locked";
import { creatorDashboardAvailable } from "@/lib/http";
import { getRepository, readiness } from "@/lib/server";

export const dynamic = "force-dynamic";

function stateLabel(status: string) {
  return status.replaceAll("_", " ");
}

export default function CommunityPage() {
  if (!creatorDashboardAvailable()) return <LiveDashboardLocked />;
  const snapshot = getRepository().getSnapshot();
  const health = readiness();
  const incident = snapshot.incidents[0];
  const followUp = snapshot.followUps[0];

  return (
    <DashboardShell
      actions={
        <Link className="button button-primary" href="/demo">
          Run the story
        </Link>
      }
      description="A calm read on what needs attention, what TEND remembers, and what will happen next."
      eyebrow="The Green Room · Community overview"
      title="Good evening, creator."
    >
      <section className="overview-hero">
        <div className="pulse-visual">
          <div className="pulse-rings">
            <span />
            <span />
            <span />
          </div>
          <div>
            <span className="tiny-label">Community pulse</span>
            <strong>
              {snapshot.pulse
                ? "Repair held"
                : incident
                  ? "Attentive"
                  : "Steady"}
            </strong>
            <p>
              {snapshot.pulse?.summary ??
                "No escalating patterns. One demo storyline is ready to explore."}
            </p>
          </div>
        </div>
        <div className="metric-row">
          <article>
            <span>Incidents reviewed</span>
            <strong>{snapshot.metrics.incidentsReviewed}</strong>
            <small>Demo data</small>
          </article>
          <article>
            <span>Follow-ups complete</span>
            <strong>{snapshot.metrics.followUpsCompleted}</strong>
            <small>Persisted events</small>
          </article>
          <article>
            <span>Minutes saved</span>
            <strong>{snapshot.metrics.estimatedModeratorMinutesSaved}</strong>
            <small>4 min resolution + 3 min follow-up</small>
          </article>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-column wide">
          <div className="section-title-row">
            <div>
              <span className="eyebrow">Attention</span>
              <h2>Incidents</h2>
            </div>
            {incident && (
              <Link href={`/incidents/${incident.id}`}>Open full audit →</Link>
            )}
          </div>
          {incident ? (
            <Link
              className="overview-incident"
              href={`/incidents/${incident.id}`}
            >
              <div className="incident-risk">
                <span>{incident.riskLevel}</span>
                <strong>{Math.round(incident.confidence * 100)}%</strong>
              </div>
              <div>
                <div className="incident-meta">
                  <span># creator-lounge</span>
                  <span>{stateLabel(incident.status)}</span>
                </div>
                <h3>{incident.summary}</h3>
                <blockquote>Jules: “{incident.messageExcerpt}”</blockquote>
                <div className="incident-tags">
                  <span>
                    <MemoryIcon /> 1 relevant boundary
                  </span>
                  <span>
                    <ShieldIcon /> Approval gated
                  </span>
                </div>
              </div>
            </Link>
          ) : (
            <div className="empty-card">
              <SproutIcon />
              <h3>No active incidents</h3>
              <p>Start the demo to create the contextual judgment story.</p>
              <Link href="/demo">Open demo controller</Link>
            </div>
          )}

          <div className="section-title-row spaced">
            <div>
              <span className="eyebrow">Actual stored events</span>
              <h2>Impact</h2>
            </div>
            <span className="demo-data-label">Demo data</span>
          </div>
          <div className="impact-card">
            <div>
              <strong>
                {snapshot.metrics.lowRiskResolvedWithoutPunishment}
              </strong>
              <span>Resolved without punishment</span>
            </div>
            <div>
              <strong>{snapshot.metrics.approvalsStreamlined}</strong>
              <span>Approvals streamlined</span>
            </div>
            <div>
              <strong>
                {Math.round(snapshot.metrics.repeatConflictRate * 100)}%
              </strong>
              <span>Repeat-conflict rate</span>
            </div>
            <div>
              <strong>{snapshot.metrics.medianResponseSeconds}s</strong>
              <span>Median demo response</span>
            </div>
          </div>
        </div>

        <aside className="dashboard-column">
          <section className="side-card">
            <div className="panel-heading">
              <strong>
                <ClockIcon /> Next follow-up
              </strong>
              <Link href="/demo">View</Link>
            </div>
            {followUp ? (
              <div className="next-job">
                <span className={`status-pill ${followUp.status}`}>
                  {followUp.status}
                </span>
                <h3>{followUp.purpose}</h3>
                <p>
                  Due{" "}
                  {new Date(followUp.dueAt).toLocaleTimeString("en", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
              </div>
            ) : (
              <p className="quiet-copy">No follow-up is scheduled yet.</p>
            )}
          </section>
          <section className="side-card">
            <div className="panel-heading">
              <strong>
                <MemoryIcon /> Recent memory
              </strong>
              <Link href="/memories">All receipts</Link>
            </div>
            {snapshot.memories.slice(0, 3).map((memory) => (
              <div className="memory-mini" key={memory.id}>
                <span className={`status-dot ${memory.status}`} />
                <div>
                  <strong>{memory.claim}</strong>
                  <p>{memory.sourceReference}</p>
                </div>
              </div>
            ))}
            {snapshot.memories.length === 0 && (
              <p className="quiet-copy">Teach Act 1 to create receipts.</p>
            )}
          </section>
          <section className="side-card readiness-mini">
            <div className="panel-heading">
              <strong>
                <ShieldIcon /> System health
              </strong>
              <Link href="/settings">Details</Link>
            </div>
            <div>
              <span>Mock Minds</span>
              <strong className="healthy">Ready</strong>
            </div>
            <div>
              <span>Due-job worker</span>
              <strong className="healthy">Polling</strong>
            </div>
            <div>
              <span>Live Minds</span>
              <strong>
                {health.liveMinds === "not_configured"
                  ? "Not configured"
                  : "Unverified"}
              </strong>
            </div>
            <div>
              <span>Discord</span>
              <strong>
                {health.discord === "not_configured"
                  ? "Not configured"
                  : "Unverified"}
              </strong>
            </div>
          </section>
        </aside>
      </section>
    </DashboardShell>
  );
}
