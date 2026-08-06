# Security model

## Moderation authority

- Ban and kick are unavailable.
- Message deletion is intentionally not implemented in the Discord executor.
- Timeout can execute only after a persisted creator approval and atomic worker claim.
- Public nudges, private reminders, moderator notifications, timeout recommendations, and timeout execution require approval.
- Model output is a proposal. The policy engine is authoritative.
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
- apply deterministic policy after validation.

Representative override phrases are tested. Detection is defense in depth, not permission to execute community text.

## Discord

- Connect only in live mode with complete configuration.
- Require an explicitly authorized test server.
- Request only Guilds, GuildMessages, MessageContent, and DirectMessages intents for MVP behavior.
- Filter bot/self messages.
- Enforce one guild and a channel allowlist both in the worker and web intake.
- Use discord.js for rate-limit handling, heartbeat, resume, and reconnect behavior.
- Keep the bot role below moderator roles and omit Administrator.

## Web and Skill APIs

The Skill and internal worker surfaces use distinct bearer credentials. Inputs are bounded with Zod. Skill tools can read context, propose, schedule, and record outcomes; they cannot perform Discord enforcement. A production reverse proxy should add rate limiting, payload caps, TLS, and request logging with header redaction.

The hackathon MVP has no authentication, so the dashboard must not be exposed to an untrusted public audience with live credentials. Add creator authentication and per-community authorization before real multi-user use.

## Persistence

- SQLite foreign keys and WAL are enabled.
- Jobs and Discord actions use atomic claim transitions.
- Effect records have unique idempotency keys.
- Retried follow-ups are bounded and eventually visible as failed/manual review.
- Audit payloads are summaries, not secret-bearing raw requests.

## Incident response

1. Disable live mode and stop the Discord worker.
2. Revoke affected Discord/Minds/API credentials.
3. Preserve sanitized audit evidence.
4. Identify exposed messages/members and respect deletion requests.
5. Fix the boundary and add a regression test.
6. Restore with new credentials and a test-server verification.
