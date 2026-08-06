"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { TendSnapshot } from "@tend/db";
import { DEMO_TEACHING } from "@tend/core";
import {
  ArrowIcon,
  CheckIcon,
  ClockIcon,
  MemoryIcon,
  ShieldIcon,
  SproutIcon,
} from "./icons";
import { ModeBadge } from "./mode-badge";

interface Readiness {
  mockMinds: "ready";
  liveMinds: "configured_unverified" | "not_configured";
  discord: "configured_unverified" | "not_configured";
  customSkill: {
    localSpec: boolean;
    deployed: boolean;
    equipped: boolean;
    verified: boolean;
  };
  activeProvider: "mock" | "live" | "unavailable";
}

export interface DemoStateResponse {
  ok: boolean;
  snapshot: TendSnapshot;
  readiness: Readiness;
  serverTime: string;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "TEND request failed.");
  return payload;
}

function phaseIndex(phase: TendSnapshot["demoPhase"]): number {
  if (phase === "ready") return 0;
  if (phase === "learned") return 1;
  if (phase === "incident") return 2;
  return 3;
}

function relativeTime(iso: string, now: number): string {
  const seconds = Math.max(
    0,
    Math.round((now - new Date(iso).getTime()) / 1000),
  );
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.round(seconds / 60)}m ago`;
}

export function DemoExperience({
  initialState,
}: {
  initialState: DemoStateResponse;
}) {
  const [state, setState] = useState<DemoStateResponse>(initialState);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() =>
    new Date(initialState.serverTime).getTime(),
  );
  const [announcement, setAnnouncement] = useState(
    "Loading persisted demo state.",
  );

  const load = useCallback(async () => {
    const response = await api<DemoStateResponse>("/api/demo/state");
    setState(response);
    return response;
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
      if (state.snapshot.demoPhase === "scheduled") {
        void load().then((next) => {
          if (next.snapshot.demoPhase === "resolved") {
            setAnnouncement(
              "Autonomous follow-up completed. The incident is resolved with no renewed conflict.",
            );
          }
        });
      }
    }, 750);
    return () => window.clearInterval(timer);
  }, [load, state.snapshot.demoPhase]);

  async function act(path: string, label: string) {
    setBusy(label);
    setError(null);
    try {
      await api(path, { method: "POST", body: "{}" });
      const next = await load();
      setAnnouncement(
        `${label} complete. Demo is now in ${next.snapshot.demoPhase} state.`,
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "The demo action failed.",
      );
    } finally {
      setBusy(null);
    }
  }

  const followUp = state.snapshot.followUps[0];
  const remainingSeconds = followUp
    ? Math.max(0, Math.ceil((new Date(followUp.dueAt).getTime() - now) / 1000))
    : 0;
  const progress = phaseIndex(state.snapshot.demoPhase);
  const incident = state.snapshot.incidents[0];
  const action = state.snapshot.actions[0];
  const usedMemory = state.snapshot.memories.find(
    (memory) => memory.id === "memory-kai-voice-boundary",
  );
  const eventRows = useMemo(
    () => state.snapshot.auditEvents.slice(0, 6),
    [state],
  );

  return (
    <div className="demo-stage">
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <section className="demo-topbar">
        <div>
          <span className="eyebrow">Deterministic product walkthrough</span>
          <h1>The continuity demo</h1>
          <p>
            Mock judgment, real persistence, real approval, and a real persisted
            due-job worker.
          </p>
        </div>
        <div className="demo-top-actions">
          <ModeBadge />
          <button
            className="button button-quiet reset-button"
            disabled={busy !== null}
            onClick={() => void act("/api/demo/reset", "Reset")}
            type="button"
          >
            Reset scenario
          </button>
        </div>
      </section>

      <section aria-label="Demo progress" className="act-progress">
        {[
          ["Act 1", "Teach TEND"],
          ["Act 2", "New session"],
          ["Decision", "Approve repair"],
          ["Act 3", "Autonomous follow-up"],
        ].map(([act, label], index) => (
          <div
            aria-current={index === progress ? "step" : undefined}
            className={index <= progress ? "act-step active" : "act-step"}
            key={act}
          >
            <span>
              {index < progress || state.snapshot.demoPhase === "resolved" ? (
                <CheckIcon />
              ) : (
                index + 1
              )}
            </span>
            <div>
              <small>{act}</small>
              <strong>{label}</strong>
            </div>
          </div>
        ))}
      </section>

      {error && (
        <div className="alert error" role="alert">
          <strong>Demo action could not complete.</strong>
          <span>{error}</span>
        </div>
      )}

      <div className="demo-grid">
        <section className="demo-main-panel">
          {state.snapshot.demoPhase === "ready" && (
            <div className="act-content teach-act">
              <div className="act-heading">
                <span className="act-number">01</span>
                <div>
                  <span className="eyebrow">Learning</span>
                  <h2>Teach the culture, not just the rules.</h2>
                </div>
              </div>
              <div className="creator-message">
                <div className="creator-row">
                  <span className="avatar avatar-creator">C</span>
                  <div>
                    <strong>Creator instruction</strong>
                    <span>Trusted source · ready to send</span>
                  </div>
                </div>
                <blockquote>“{DEMO_TEACHING}”</blockquote>
              </div>
              <div className="integrity-note">
                <ShieldIcon />
                <p>
                  <strong>What will happen:</strong> Mock Minds acknowledges
                  this teaching. TEND stores creator-approved facts as auditable
                  receipts—not as a false claim about the Mind’s internal
                  memory.
                </p>
              </div>
              <button
                className="button button-primary act-button"
                disabled={busy !== null}
                onClick={() => void act("/api/demo/learn", "Teaching")}
                type="button"
              >
                {busy === "Teaching" ? "Recording receipts…" : "Teach TEND"}
                <ArrowIcon />
              </button>
            </div>
          )}

          {state.snapshot.demoPhase === "learned" && (
            <div className="act-content learned-act">
              <div className="act-heading">
                <span className="act-number complete">
                  <CheckIcon />
                </span>
                <div>
                  <span className="eyebrow">Act 1 complete</span>
                  <h2>Four memories, each with a receipt.</h2>
                </div>
              </div>
              <div className="receipt-grid">
                {state.snapshot.memories.map((memory) => (
                  <article
                    className={
                      memory.id === usedMemory?.id
                        ? "receipt featured"
                        : "receipt"
                    }
                    key={memory.id}
                  >
                    <div className="receipt-head">
                      <span>
                        <MemoryIcon /> {memory.subjectType}
                      </span>
                      <span className={`status-pill ${memory.status}`}>
                        {memory.status}
                      </span>
                    </div>
                    <h3>{memory.claim}</h3>
                    <p>{memory.whyRelevant}</p>
                    <footer>
                      <span>{memory.sourceReference}</span>
                      <strong>
                        {Math.round(memory.confidence * 100)}% confidence
                      </strong>
                    </footer>
                  </article>
                ))}
              </div>
              <div className="session-divider">
                <span />
                <strong>Simulate a new session</strong>
                <span />
              </div>
              <button
                className="button button-primary act-button"
                disabled={busy !== null}
                onClick={() =>
                  void act("/api/demo/incident", "New-session analysis")
                }
                type="button"
              >
                {busy === "New-session analysis"
                  ? "Consulting Mock Minds…"
                  : "Start Act 2"}
                <ArrowIcon />
              </button>
            </div>
          )}

          {state.snapshot.demoPhase === "incident" && incident && action && (
            <div className="act-content incident-act">
              <div className="act-heading">
                <span className="act-number">02</span>
                <div>
                  <span className="eyebrow">
                    New session · contextual judgment
                  </span>
                  <h2>The sentence is mild. The history isn’t.</h2>
                </div>
              </div>
              <div className="conversation-card">
                <div className="channel-row">
                  <span># creator-lounge</span>
                  <span>Demo Discord context</span>
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
              </div>

              <div className="decision-card">
                <div className="decision-topline">
                  <div>
                    <span className="risk-pill medium">Medium risk</span>
                    <strong>
                      {Math.round(incident.confidence * 100)}% confidence
                    </strong>
                  </div>
                  <span className="approval-chip">
                    <ShieldIcon /> Human approval
                  </span>
                </div>
                <h3>{incident.summary}</h3>
                <p>{incident.reasoning}</p>
                <div className="memory-influence">
                  <div>
                    <MemoryIcon />
                    <span>Memory that changed the decision</span>
                  </div>
                  <blockquote>“{usedMemory?.claim}”</blockquote>
                  <p>{usedMemory?.whyRelevant}</p>
                </div>
                <div className="proposed-action">
                  <span className="tiny-label">Proposed private reminder</span>
                  <p>{action.content}</p>
                  <footer>
                    <span>No ban · No timeout</span>
                    <strong>Least invasive effective action</strong>
                  </footer>
                </div>
                <div className="decision-actions">
                  <button
                    className="button button-primary"
                    disabled={busy !== null}
                    onClick={() =>
                      void act(`/api/actions/${action.id}/approve`, "Approval")
                    }
                    type="button"
                  >
                    {busy === "Approval"
                      ? "Persisting schedule…"
                      : "Approve & schedule follow-up"}
                    <ArrowIcon />
                  </button>
                  <button
                    className="button button-quiet"
                    disabled={busy !== null}
                    onClick={() =>
                      void act(`/api/actions/${action.id}/reject`, "Rejection")
                    }
                    type="button"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          )}

          {state.snapshot.demoPhase === "scheduled" && followUp && (
            <div className="act-content followup-act">
              <div className="act-heading">
                <span className="act-number pulse">
                  <ClockIcon />
                </span>
                <div>
                  <span className="eyebrow">Act 3 · autonomous continuity</span>
                  <h2>TEND is waiting, so the creator doesn’t have to.</h2>
                </div>
              </div>
              <div className="countdown-card">
                <div className="countdown-orbit">
                  <span>{remainingSeconds}</span>
                  <small>seconds</small>
                </div>
                <div>
                  <span className="status-pill scheduled">
                    Persisted due job
                  </span>
                  <h3>Check whether the repair held.</h3>
                  <p>{followUp.purpose}</p>
                  <dl>
                    <div>
                      <dt>State</dt>
                      <dd>{followUp.status}</dd>
                    </div>
                    <div>
                      <dt>Attempts</dt>
                      <dd>{followUp.attemptCount}</dd>
                    </div>
                    <div>
                      <dt>Idempotency</dt>
                      <dd>protected</dd>
                    </div>
                  </dl>
                </div>
              </div>
              <div className="worker-note">
                <span className="live-indicator" />
                <p>
                  <strong>Local worker is active.</strong> This state is not a
                  visual timer. A persisted row will be atomically claimed and
                  completed when due.
                </p>
              </div>
            </div>
          )}

          {state.snapshot.demoPhase === "resolved" && (
            <div className="act-content resolved-act">
              <div className="resolved-symbol">
                <SproutIcon />
              </div>
              <span className="eyebrow">
                Act 3 complete · no new creator prompt
              </span>
              <h2>Repair held. The loop is closed.</h2>
              <p>
                The due-job worker consumed a deterministic seeded observation
                of no renewed conflict, then marked the incident resolved.
              </p>
              <div className="resolution-grid">
                <article>
                  <CheckIcon />
                  <span>Incident state</span>
                  <strong>Resolved</strong>
                </article>
                <article>
                  <ClockIcon />
                  <span>Follow-up</span>
                  <strong>Completed</strong>
                </article>
                <article>
                  <ShieldIcon />
                  <span>Punitive actions</span>
                  <strong>None</strong>
                </article>
              </div>
              {state.snapshot.pulse && (
                <div className="pulse-update">
                  <span className="tiny-label">Community-health update</span>
                  <h3>{state.snapshot.pulse.headline}</h3>
                  <p>{state.snapshot.pulse.summary}</p>
                  <blockquote>
                    Positive prompt: “{state.snapshot.pulse.positivePrompt}”
                  </blockquote>
                </div>
              )}
              <button
                className="button button-primary act-button"
                disabled={busy !== null}
                onClick={() => void act("/api/demo/reset", "Reset")}
                type="button"
              >
                Replay the story <ArrowIcon />
              </button>
            </div>
          )}
        </section>

        <aside className="demo-side-panel">
          <section className="truth-panel">
            <div className="panel-title">
              <ShieldIcon />
              <div>
                <strong>Demo integrity</strong>
                <span>What is real right now</span>
              </div>
            </div>
            <ul>
              <li>
                <CheckIcon />
                <span>
                  <strong>SQLite persistence</strong>Real local database
                </span>
              </li>
              <li>
                <CheckIcon />
                <span>
                  <strong>Policy gate</strong>Same core policy as live mode
                </span>
              </li>
              <li>
                <CheckIcon />
                <span>
                  <strong>Due-job worker</strong>Real persisted state transition
                </span>
              </li>
              <li className="simulated">
                <span>○</span>
                <span>
                  <strong>Minds judgment</strong>Readable deterministic fixture
                </span>
              </li>
              <li className="simulated">
                <span>○</span>
                <span>
                  <strong>Follow-up evidence</strong>Seeded “no renewed
                  conflict” observation
                </span>
              </li>
              <li className="simulated">
                <span>○</span>
                <span>
                  <strong>Discord delivery</strong>Recorded only; nothing sent
                </span>
              </li>
            </ul>
          </section>

          <section className="readiness-panel">
            <div className="panel-heading">
              <strong>Integration readiness</strong>
              <span>Honest status</span>
            </div>
            <dl>
              <div>
                <dt>Mock Minds</dt>
                <dd className="ready">Ready</dd>
              </div>
              <div>
                <dt>Live Minds</dt>
                <dd>
                  {state.readiness.liveMinds === "not_configured"
                    ? "Not configured"
                    : "Configured · unverified"}
                </dd>
              </div>
              <div>
                <dt>Discord</dt>
                <dd>
                  {state.readiness.discord === "not_configured"
                    ? "Not configured"
                    : "Configured · unverified"}
                </dd>
              </div>
              <div>
                <dt>Custom Skill</dt>
                <dd>
                  {state.readiness.customSkill.deployed
                    ? "Deployed · unverified"
                    : "Local spec only"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="timeline-panel">
            <div className="panel-heading">
              <strong>Audit timeline</strong>
              <span>{eventRows.length} recent</span>
            </div>
            <ol>
              {eventRows.map((event) => (
                <li key={event.id}>
                  <span className={`timeline-dot actor-${event.actorType}`} />
                  <div>
                    <strong>{event.eventType.replaceAll(".", " ")}</strong>
                    <p>{event.payloadSummary}</p>
                    <time dateTime={event.occurredAt}>
                      {relativeTime(event.occurredAt, now)}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
