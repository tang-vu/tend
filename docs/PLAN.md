# TEND implementation plan

Updated: 2026-08-06

## Goal

Ship a credential-free, persisted three-act TEND demo plus compile-ready live Minds and Discord boundaries. The demo must visibly distinguish simulated judgment from real application state transitions.

## Status

| Phase | Scope                                                           | Status                                            |
| ----- | --------------------------------------------------------------- | ------------------------------------------------- |
| 0     | Inspect, official research, durable instructions, risk register | Complete                                          |
| 1     | Workspace, strict tooling, SQLite persistence, domain packages  | Complete                                          |
| 2     | Policy, mock Minds, scenario services, worker, primary UI       | Complete                                          |
| 3     | Live Minds, diagnostics/proof, Skill API and OpenAPI            | Complete (live verification pending credentials)  |
| 4     | Safe Discord gateway and approved action executor               | Complete (live verification pending credentials)  |
| 5     | Tests, responsive/accessibility polish, visual/security QA      | Complete                                          |
| 6     | Submission docs, full gates, final skeptical review             | Complete (external credentials/deployment remain) |

## Acceptance spine

1. A creator teaches the four demo facts and sees auditable memory receipts.
2. A later session judges Jules's ambiguous sentence using Kai's active boundary receipt.
3. Approval persists an action and a due follow-up.
4. A real due-job poller claims and executes that follow-up after 12 seconds in demo mode.
5. The incident becomes resolved and a persisted community update appears without another creator prompt.
6. Reset returns the scenario to its initial persisted state.

## Technical decisions

- pnpm workspace without Turborepo; root scripts use pnpm recursive filters.
- Next.js App Router with server route handlers.
- SQLite through `better-sqlite3`, behind repository interfaces, with explicit SQL migrations.
- CSS variables and Tailwind utilities for a small, accessible visual system.
- Minds and Discord dependencies remain server/worker only.
- Vitest owns unit/integration coverage; Playwright owns the critical browser path.

## Risks and mitigations

| Risk                                         | Mitigation                                                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Minds API is beta and credentials are absent | Official typed client, validated responses, one repair attempt, transparent manual-review fallback, proof command  |
| Demo scheduler stops with the browser        | Persisted follow-ups plus worker polling; web demo endpoint also invokes the same worker service                   |
| SQLite concurrency                           | WAL, short transactions, atomic claim update, idempotency keys; document PostgreSQL/queue migration                |
| Discord can cause real-world harm            | Guild/channel allowlists, ignore bots, approval gate, no ban/kick, idempotent executor                             |
| Prompt injection                             | Delimited untrusted content, trusted prompt outside data, schema validation, policy enforcement after model output |
| Demo can overstate Minds                     | Persistent `Demo mode` badges and readiness matrix with unverified live states                                     |
| Native SQLite packaging                      | Node 22+ image with build toolchain in dependency stage; exercise Docker build                                     |

## Verification log

- 2026-08-05: repository clean except `.gitattributes`; branch `main`, remote present.
- 2026-08-05: Node 24.14.1, pnpm 11.13.0, Docker 29.5.3.
- 2026-08-05: official Minds docs and current registry metadata inspected; findings are in `docs/RESEARCH.md`.
- 2026-08-05: core/db/Minds/web/Discord strict typechecks passed after bootstrap.
- 2026-08-05: production Next build passed; local HTTP story reached scheduled then resolved through the persisted worker.
- 2026-08-05: Vitest passed 25 tests across policy, prompts, Minds, jobs, persistence, and Discord boundaries.
- 2026-08-06: skeptical safety review separated demo/live follow-up processors, disabled demo mutations in live mode, made Skill readiness explicit, and strengthened bearer comparison and CI setup.
- 2026-08-06: `pnpm verify` passed: lint, strict typecheck, 26 Vitest tests, production build, and secret scan.
- 2026-08-06: production Playwright passed the critical desktop/mobile story at 1440×900 and 390×844; landing, incident, countdown, and resolved screenshots were inspected without page overflow or dev overlays.
- 2026-08-06: expanded Playwright coverage passed 6/6 tests across overview, incident detail, memories, settings, onboarding, and the full demo. Browser console/page errors now fail the suite; a server/client relative-time hydration mismatch found by this gate was fixed.
- 2026-08-06: CI actions were upgraded to current Node 24-runtime releases and pinned to full commit SHAs after GitHub reported Node 20 action-runtime deprecation.
- 2026-08-06: pnpm was upgraded from the registry-withdrawn 11.13.0 release to current stable 11.20.0 after the newer setup action correctly rejected the broken release.
- 2026-08-06: the Custom TEND Skill document passed Redocly OAS 3.1 validation; the validator is pinned and runs in CI.
- 2026-08-06: credential-gated Skill and Discord intake endpoints gained browser-level fail-closed coverage; the Skill contract now documents its unconfigured `503` response.
- 2026-08-06: deployment hardening added a privacy-safe SQLite health endpoint, pinned the Docker base image digest, and made Docker image construction a CI gate.
- 2026-08-06: independent Minds, safety, and UX reviews completed; remediation began with strict live/mock mode pairing, escaped evidence blocks, bounded structured output, active-receipt validation, and destination-bound Discord effects.
- 2026-08-06: UX trust remediation labeled seeded follow-up evidence, removed false persistence/deletion claims, stabilized UTC memory times, and added skip-link/current-step semantics.
- 2026-08-06: Minds proof evaluation now requires the recalled Kai/voice fact plus a material decision effect; live analysis references are sanitized into audit events and Skill writes are retry-idempotent.
- 2026-08-06: all six authenticated Skill tools gained browser-level contract coverage, including active-only context, approval gating, non-execution, status reads, safe outcomes, and retry idempotency.
- 2026-08-06: judge-facing packaging added a code-generated TEND icon, 1200×630 Open Graph card, social metadata, and browser verification of both generated assets.
- 2026-08-06: the unauthenticated dashboard attack surface was closed: live mode now disables dashboard pages, snapshot reads, approvals, rejections, and memory mutations until creator authentication exists.
- 2026-08-06: live storage bootstrap was separated from demo seeding; a fresh live database now contains only its configured guild/channels and the immutable human-authority baseline, never Kai/Jules or demo metrics.
- 2026-08-06: client-bundle and tracked-artifact scans found no server secret names, databases, logs, build caches, or local environment files.
- 2026-08-06: final policy hardening made low-confidence analysis non-actionable and required completed follow-up evidence before the Skill can resolve an incident.
- 2026-08-06: Docker image `tend:local` built successfully with the standalone Next server and returned HTTP 200 at startup. This tool environment then sent detached containers SIGTERM after about 16 seconds, so sustained container smoke remains an external rerun.
- 2026-08-05: Playwright desktop and mobile projects passed independently; 1440×900 and 390×844 showed no horizontal overflow.
