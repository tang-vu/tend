import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckIcon,
  ClockIcon,
  MemoryIcon,
  ShieldIcon,
  SproutIcon,
} from "@/components/icons";
import { LiveDashboardLocked } from "@/components/live-dashboard-locked";
import { ReceiptActions } from "@/components/receipt-actions";
import { SiteHeader, Wordmark } from "@/components/site-header";
import { createDecisionReceiptEnvelope } from "@/lib/decision-receipt";
import { creatorDashboardAvailable } from "@/lib/http";
import { getRepository } from "@/lib/server";

export const metadata: Metadata = {
  title: "Decision receipt",
  description:
    "Inspect and export a tamper-evident TEND decision and continuity receipt.",
};

export const dynamic = "force-dynamic";

function formatTimestamp(value: string | null): string {
  if (!value) return "Not yet";
  return `${new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value))} UTC`;
}

function disclosureLabel(value: string): string {
  return value.replaceAll("_", " ").replaceAll(".", " ");
}

export default async function DecisionReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await creatorDashboardAvailable())) return <LiveDashboardLocked />;
  const { id } = await params;
  const envelope = createDecisionReceiptEnvelope(
    getRepository().getSnapshot(),
    id,
  );
  if (!envelope) notFound();

  const { receipt, integrity } = envelope;
  const { decision } = receipt;

  return (
    <div className="decision-receipt-page">
      <SiteHeader dashboard />
      <main id="main-content" tabIndex={-1}>
        <section className="receipt-masthead">
          <div>
            <span className="eyebrow">Portable governance artifact</span>
            <h1>An accountable decision, in one receipt.</h1>
            <p>
              Evidence, policy authority, approval state, continuity, and audit
              history—projected from the same persisted incident state.
            </p>
          </div>
          <ReceiptActions incidentId={decision.incidentId} />
        </section>

        <article className="receipt-sheet">
          <header className="receipt-sheet-header">
            <Wordmark />
            <div>
              <span>Decision receipt</span>
              <strong>{receipt.receiptId}</strong>
            </div>
            <span className={`status-pill ${decision.status}`}>
              {disclosureLabel(decision.status)}
            </span>
          </header>

          <section className="receipt-integrity-band">
            <span className="receipt-integrity-icon">
              <ShieldIcon />
            </span>
            <div>
              <span>Tamper-evident payload</span>
              <strong>
                {integrity.algorithm} · {integrity.digest.slice(0, 16)}…
              </strong>
              <p>{integrity.note}</p>
            </div>
            <dl>
              <div>
                <dt>Schema</dt>
                <dd>{receipt.schemaVersion}</dd>
              </div>
              <div>
                <dt>Exported</dt>
                <dd>{formatTimestamp(envelope.exportedAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="receipt-runtime-truth">
            <div>
              <span className="tiny-label">Runtime truth</span>
              <h2>{receipt.community.name}</h2>
              <p>{receipt.disclosure.sharingNotice}</p>
            </div>
            <dl>
              <div>
                <dt>Mode</dt>
                <dd>{receipt.community.mode}</dd>
              </div>
              <div>
                <dt>Judgment</dt>
                <dd>{disclosureLabel(receipt.disclosure.judgment)}</dd>
              </div>
              <div>
                <dt>Discord effect</dt>
                <dd>{disclosureLabel(receipt.disclosure.discordEffect)}</dd>
              </div>
              <div>
                <dt>Follow-up evidence</dt>
                <dd>{disclosureLabel(receipt.disclosure.followUpEvidence)}</dd>
              </div>
            </dl>
          </section>

          <section className="receipt-section receipt-decision-section">
            <div className="receipt-section-heading">
              <span>01</span>
              <div>
                <span className="tiny-label">Decision</span>
                <h2>What TEND concluded.</h2>
              </div>
            </div>
            <div className="receipt-decision-grid">
              <blockquote>
                <span>Untrusted message excerpt</span>“{decision.messageExcerpt}
                ”
              </blockquote>
              <div className="receipt-decision-summary">
                <div>
                  <span className={`risk-pill ${decision.riskLevel}`}>
                    {decision.riskLevel} risk
                  </span>
                  <strong>{Math.round(decision.confidence * 100)}%</strong>
                </div>
                <h3>{decision.summary}</h3>
                <p>{decision.reasoning}</p>
              </div>
            </div>
            <dl className="receipt-metadata-grid">
              <div>
                <dt>Classification</dt>
                <dd>{disclosureLabel(decision.classification)}</dd>
              </div>
              <div>
                <dt>Prompt</dt>
                <dd>{decision.promptVersion}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{formatTimestamp(decision.createdAt)}</dd>
              </div>
              <div>
                <dt>Resolved</dt>
                <dd>{formatTimestamp(decision.resolvedAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="receipt-section">
            <div className="receipt-section-heading">
              <span>02</span>
              <div>
                <span className="tiny-label">Evidence</span>
                <h2>Why context changed the meaning.</h2>
              </div>
            </div>
            <div className="receipt-evidence-grid">
              <div>
                <h3>
                  <MemoryIcon /> Memory receipts
                </h3>
                {receipt.evidence.memoryReceipts.map((memory) => (
                  <article key={memory.id}>
                    <div>
                      <span className={`status-pill ${memory.currentStatus}`}>
                        {memory.currentStatus}
                      </span>
                      <strong>{Math.round(memory.confidence * 100)}%</strong>
                    </div>
                    <blockquote>“{memory.claim}”</blockquote>
                    <p>{memory.whyRelevant}</p>
                    <small>{memory.sourceReference}</small>
                  </article>
                ))}
                {receipt.evidence.memoryReceipts.length === 0 && (
                  <p className="receipt-empty">No memory receipt was cited.</p>
                )}
              </div>
              <div>
                <h3>
                  <CheckIcon /> Policy matches
                </h3>
                <ol className="receipt-policy-list">
                  {receipt.evidence.policyMatches.map((match, index) => (
                    <li key={match}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      {match}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>

          <section className="receipt-section">
            <div className="receipt-section-heading">
              <span>03</span>
              <div>
                <span className="tiny-label">Human authority</span>
                <h2>What could act—and what could not.</h2>
              </div>
            </div>
            <div className="receipt-governance-grid">
              <div className="receipt-hard-boundary">
                <ShieldIcon />
                <span>
                  <strong>Unavailable by design</strong>
                  {receipt.governance.unavailableActions.join(" · ")}
                </span>
              </div>
              <div className="receipt-action-list">
                {receipt.governance.actions.map((action) => (
                  <article key={action.id}>
                    <div>
                      <span>{disclosureLabel(action.type)}</span>
                      <strong>{action.status}</strong>
                    </div>
                    <dl>
                      <div>
                        <dt>Approval</dt>
                        <dd>
                          {action.requiresApproval
                            ? "Required"
                            : "Not required"}
                        </dd>
                      </div>
                      <div>
                        <dt>Approved</dt>
                        <dd>{formatTimestamp(action.approvedAt)}</dd>
                      </div>
                      <div>
                        <dt>Idempotency</dt>
                        <dd>
                          {action.idempotencyKeyPresent
                            ? "Protected"
                            : "Missing"}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="receipt-section">
            <div className="receipt-section-heading">
              <span>04</span>
              <div>
                <span className="tiny-label">Continuity</span>
                <h2>What happened after the decision.</h2>
              </div>
            </div>
            <div className="receipt-continuity-grid">
              <div>
                <h3>
                  <ClockIcon /> Persisted follow-up
                </h3>
                {receipt.continuity.followUps.map((followUp) => (
                  <article key={followUp.id}>
                    <span className={`status-pill ${followUp.status}`}>
                      {followUp.status}
                    </span>
                    <h4>{followUp.purpose}</h4>
                    <dl>
                      <div>
                        <dt>Due</dt>
                        <dd>{formatTimestamp(followUp.dueAt)}</dd>
                      </div>
                      <div>
                        <dt>Attempts</dt>
                        <dd>{followUp.attemptCount}</dd>
                      </div>
                      <div>
                        <dt>Completed</dt>
                        <dd>{formatTimestamp(followUp.completedAt)}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
                {receipt.continuity.followUps.length === 0 && (
                  <p className="receipt-empty">
                    No follow-up is scheduled yet.
                  </p>
                )}
              </div>
              <div>
                <h3>
                  <SproutIcon /> Audit trail
                </h3>
                <ol className="receipt-audit-list">
                  {receipt.audit.map((event) => (
                    <li key={event.id}>
                      <span
                        className={`timeline-dot actor-${event.actorType}`}
                      />
                      <div>
                        <strong>{disclosureLabel(event.eventType)}</strong>
                        <p>{event.payloadSummary}</p>
                        <time dateTime={event.occurredAt}>
                          {formatTimestamp(event.occurredAt)}
                        </time>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>

          <footer className="receipt-sheet-footer">
            <div>
              <span>Full payload digest</span>
              <code>{integrity.digest}</code>
            </div>
            <p>
              Digest covers the canonical JSON <code>receipt</code> object.
              Export metadata is intentionally outside the digest.
            </p>
          </footer>
        </article>

        <div className="receipt-back-link">
          <Link href={`/incidents/${decision.incidentId}`}>
            ← Return to incident audit
          </Link>
        </div>
      </main>
    </div>
  );
}
