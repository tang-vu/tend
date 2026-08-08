import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { IncidentControls } from "@/components/incident-controls";
import { MemoryIcon, ShieldIcon } from "@/components/icons";
import { LiveDashboardLocked } from "@/components/live-dashboard-locked";
import { creatorDashboardAvailable } from "@/lib/http";
import { getRepository } from "@/lib/server";

export const dynamic = "force-dynamic";

export default async function IncidentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await creatorDashboardAvailable())) return <LiveDashboardLocked />;
  const { id } = await params;
  const snapshot = getRepository().getSnapshot();
  const incident = snapshot.incidents.find((item) => item.id === id);
  if (!incident) notFound();
  const action = snapshot.actions.find(
    (item) => item.incidentId === incident.id,
  );
  const memories = snapshot.memories.filter((memory) =>
    incident.memoryReceiptIds.includes(memory.id),
  );
  const audit = snapshot.auditEvents.filter(
    (event) => event.incidentId === incident.id,
  );

  return (
    <DashboardShell
      description="Full evidence, proposed repair, approval boundary, and every persisted state change."
      eyebrow="# creator-lounge · Incident detail"
      title="Why this decision?"
    >
      <div className="incident-detail-grid">
        <div className="incident-detail-main">
          <section className="detail-card conversation-detail">
            <div className="panel-heading">
              <strong>Triggering conversation</strong>
              <span>Untrusted Discord data</span>
            </div>
            {incident.conversationContext.map((message, index) => (
              <div
                className={
                  index === 1 ? "chat-message trigger" : "chat-message"
                }
                key={`${message.author}-${message.offset}`}
              >
                <span
                  className={`avatar avatar-${message.author.toLowerCase()}`}
                >
                  {message.author[0]}
                </span>
                <div>
                  <strong>
                    {message.author} <small>{message.offset}</small>
                  </strong>
                  <p>{message.content}</p>
                </div>
              </div>
            ))}
          </section>
          <section className="detail-card">
            <div className="decision-topline">
              <div>
                <span className={`risk-pill ${incident.riskLevel}`}>
                  {incident.riskLevel} risk
                </span>
                <strong>
                  {Math.round(incident.confidence * 100)}% confidence
                </strong>
              </div>
              <span className="approval-chip">
                <ShieldIcon /> {incident.status.replaceAll("_", " ")}
              </span>
            </div>
            <h2>{incident.summary}</h2>
            <p>{incident.reasoning}</p>
            <div className="evidence-columns">
              <div>
                <span className="tiny-label">Rule & norm matches</span>
                <ul>
                  {incident.policyMatches.map((match) => (
                    <li key={match}>{match}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="tiny-label">Model classification</span>
                <strong>{incident.classification.replaceAll("_", " ")}</strong>
                <p>Prompt: {incident.promptVersion}</p>
              </div>
            </div>
          </section>
          {action && (
            <section className="detail-card">
              <div className="panel-heading">
                <strong>Proposed intervention</strong>
                <span>
                  {action.requiresApproval
                    ? "Approval required"
                    : "Policy-permitted"}
                </span>
              </div>
              <IncidentControls action={action} />
            </section>
          )}
        </div>
        <aside className="incident-detail-aside">
          <section className="detail-card">
            <div className="panel-heading">
              <strong>
                <MemoryIcon /> Memories used
              </strong>
              <span>{memories.length}</span>
            </div>
            {memories.map((memory) => (
              <div className="influence-receipt" key={memory.id}>
                <span className={`status-pill ${memory.status}`}>
                  {memory.status}
                </span>
                <h3>{memory.claim}</h3>
                <p>{memory.whyRelevant}</p>
                <small>{memory.sourceReference}</small>
              </div>
            ))}
          </section>
          <section className="detail-card timeline-detail">
            <div className="panel-heading">
              <strong>Audit timeline</strong>
              <span>{audit.length} events</span>
            </div>
            <ol>
              {audit.map((event) => (
                <li key={event.id}>
                  <span className={`timeline-dot actor-${event.actorType}`} />
                  <div>
                    <strong>{event.eventType.replaceAll(".", " ")}</strong>
                    <p>{event.payloadSummary}</p>
                    <time>
                      {new Date(event.occurredAt).toLocaleTimeString()}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </DashboardShell>
  );
}
