# TEND implementation plan

Updated: 2026-08-05

## Goal

Ship a credential-free, persisted three-act TEND demo plus compile-ready live Minds and Discord boundaries. The demo must visibly distinguish simulated judgment from real application state transitions.

## Status

| Phase | Scope                                                           | Status                                           |
| ----- | --------------------------------------------------------------- | ------------------------------------------------ |
| 0     | Inspect, official research, durable instructions, risk register | Complete                                         |
| 1     | Workspace, strict tooling, SQLite persistence, domain packages  | Complete                                         |
| 2     | Policy, mock Minds, scenario services, worker, primary UI       | Complete                                         |
| 3     | Live Minds, diagnostics/proof, Skill API and OpenAPI            | Complete (live verification pending credentials) |
| 4     | Safe Discord gateway and approved action executor               | Complete (live verification pending credentials) |
| 5     | Tests, responsive/accessibility polish, visual/security QA      | In progress                                      |
| 6     | Submission docs, full gates, final skeptical review             | Pending                                          |

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
- 2026-08-05: Playwright desktop and mobile projects passed independently; 1440×900 and 390×844 showed no horizontal overflow.
