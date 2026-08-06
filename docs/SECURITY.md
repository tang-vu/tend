# Security model

## Moderation authority

- Ban and kick are unavailable.
- Message deletion is intentionally not implemented in the Discord executor.
- Timeout can execute only after a persisted creator approval and atomic worker claim.
- Public nudges, private reminders, moderator notifications, timeout recommendations, and timeout execution require approval.
- Model output is a proposal. The policy engine is authoritative.
- Low-confidence or forced-review analysis discards member-facing proposals and creates only a moderator-review item.
- The Skill may mark an incident resolved only after a persisted follow-up has completed; otherwise it fails closed.
- Demo reset/teaching/incident endpoints return `409` in live mode.
- The demo-only “no renewed conflict” follow-up outcome is never selected in live mode; missing live observation retries and surfaces manual review.

## Secrets

`MINDS_BUILDER_API_KEY`, `DISCORD_BOT_TOKEN`, `TEND_SKILL_API_KEY`, and `TEND_WORKER_API_KEY` are server/worker-only. No `NEXT_PUBLIC_` credential exists. `.env`, `.env.local`, and deployment secrets are ignored. Logs expose event names and opaque IDs, not authorization headers, tokens, or raw message content.

Run `pnpm secrets:check` before every submission. If a secret ever enters Git history, revoke and rotate it; deleting the line is insufficient.

## Prompt injection

Discord messages are untrusted data. Prompt builders:

- put trusted policy before data;
- use `<UNTRUSTED_..._DATA>` boundaries;
- state that embedded instructions cannot change policy;
- forbid secret disclosure and fabricated memory;
- request concise moderator explanations, never hidden chain-of-thought;
- validate the entire output;
- reject oversized output, unknown fields, and references to receipts that were not supplied as active evidence;
- apply deterministic policy after validation.

Creator policy is separated from evidence data. Memory receipts and community messages are JSON-escaped inside explicitly non-authoritative data blocks, so stored delimiter-like text cannot become trusted instructions.

Representative override phrases are tested. Detection is defense in depth, not permission to execute community text.

## Discord

- Connect only in live mode with complete configuration.
- Require an explicitly authorized test server.
- Request only Guilds, GuildMessages, MessageContent, and DirectMessages intents for MVP behavior.
- Filter bot/self messages.
- Enforce one guild and a channel allowlist both in the worker and web intake.
- Bind public nudges to the source allowlisted channel, verify private-reminder recipients against the allowlisted guild, and disable Discord mention expansion.
- Use discord.js for rate-limit handling, heartbeat, resume, and reconnect behavior.
- Keep the bot role below moderator roles and omit Administrator.

## Web and Skill APIs

The Skill and internal worker surfaces use distinct bearer credentials. Inputs are bounded with Zod. Skill tools can read context, propose, schedule, and record outcomes; they cannot perform Discord enforcement. A production reverse proxy should add rate limiting, payload caps, TLS, and request logging with header redaction.

`TEND_MODE=live` is compatible only with `MINDS_MODE=live`; `live/mock` and `demo/live` combinations select the unavailable/manual-review adapter. Real Discord content can therefore never reach the deterministic demo fixture, and demo content cannot be sent to Minds accidentally.

The hackathon MVP has no creator authentication. Therefore `TEND_MODE=live` disables dashboard pages plus snapshot, approval, rejection, and memory-mutation APIs. Live intake can create manual-review/approval work, but no browser can inspect or approve it until real creator authentication and per-community authorization are implemented. Demo mode remains fully usable without credentials.

## Persistence

- SQLite foreign keys and WAL are enabled.
- Jobs and Discord actions use atomic claim transitions.
- Effect records have unique idempotency keys.
- Retried follow-ups are bounded and eventually visible as failed/manual review.
- Audit payloads are summaries, not secret-bearing raw requests.

## Build supply chain

- GitHub Actions are pinned to reviewed full commit SHAs with the corresponding release tag documented inline.
- CI installs dependencies from the committed pnpm lockfile with `--frozen-lockfile`.
- Action releases selected for the current workflow use the Node 24 action runtime; this avoids deprecated runner runtimes while the application itself keeps its documented Node 22+ contract.

## Incident response

1. Disable live mode and stop the Discord worker.
2. Revoke affected Discord/Minds/API credentials.
3. Preserve sanitized audit evidence.
4. Identify exposed messages/members and respect deletion requests.
5. Fix the boundary and add a regression test.
6. Restore with new credentials and a test-server verification.
