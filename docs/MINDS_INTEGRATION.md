# Minds integration

## Why Minds is indispensable

TEND's differentiated behavior is continuity: a persistent Mind receives creator teaching, incident evidence, approved receipt references, and later follow-up work. The dashboard and SQLite mirror make decisions auditable; they are not represented as the Mind's long-term memory.

## Implemented locally

- `MockMindsAdapter` provides the credential-free, explicitly labeled demo.
- `LiveMindsAdapter` uses `@animocabrands/minds-client-lib` server-side.
- Stable, sanitized aliases use a purpose prefix, normalized community ID, and SHA-256 suffix.
- Live analysis validates the configured Mind, ensures the conversation, captures the latest history fingerprint, sends the versioned prompt, and waits via `waitForReply`.
- Responses are parsed with Zod. Invalid output receives one correction prompt.
- Live follow-ups reuse the same stable community conversation. Fresh allowlisted Discord messages enter a separate escaped follow-up prompt and must produce a validated assessment whose message IDs are a subset of the supplied observation.
- Timeout, repeated invalid output, unavailable credentials, and account mismatch become a transparent moderator-review result. There is no hidden LLM fallback.
- Cognition diagnostics and a real cross-session proof command are ready.

The incident prompt separates trusted creator policy from approved evidence and `<UNTRUSTED_CONVERSATION_DATA>` / `<UNTRUSTED_TRIGGER_MESSAGE_DATA>`. The follow-up prompt places new channel observations inside `<UNTRUSTED_FRESH_DISCORD_MESSAGES_DATA>`. Every data block is escaped and explicitly non-authoritative. After schema validation, TEND rejects references to receipts or follow-up messages that were not supplied, downgrades unavailable destructive proposals, replaces low-confidence proposals with moderator review, and keeps live proposals approval-gated.

Sanitized provider, conversation-alias, response-fingerprint, and prompt-version references are recorded in the audit timeline when available. Builder credentials and raw authorization material are never persisted. Custom Skill action and follow-up writes require caller idempotency keys: identical retries return the original row, while conflicting reuse is rejected. Skill callers cannot record a resolved outcome unless a completed follow-up has already resolved that incident; a completed manual-review outcome cannot be upgraded through the Skill.

## Live setup

1. Create or select a Mind and Builder API key in the [Minds Builder console](https://build.hellominds.ai/).
2. Copy `.env.example` to an ignored `.env` at the repository root.
3. Put the key in `MINDS_BUILDER_API_KEY` and the selected Mind UUID in `MINDS_MIND_ID`.
4. Set `MINDS_MODE=live`. Do not use a `NEXT_PUBLIC_` prefix.
5. Run:

   ```text
   pnpm minds:doctor
   pnpm minds:usage
   pnpm minds:proof
   ```

6. Start TEND and inspect Settings. “Configured” is not “verified”; a successful doctor/proof report is the evidence.

## Persistence proof semantics

`pnpm minds:proof`:

1. creates/ensures a teach alias;
2. teaches Kai's boundary;
3. creates/ensures a distinct recall alias on the same Mind;
4. presents the later sentence;
5. validates that the reply names Kai's voice boundary and explains a material decision effect;
6. prints a sanitized report with aliases and response fingerprints.

The command exits `2` if recall was not proven. It never hard-codes success. A database match is not accepted as proof.

## Current verification status

| Capability                  | Status                         |
| --------------------------- | ------------------------------ |
| Official package compiled   | Implemented and build-verified |
| Mock adapter                | Implemented and test-verified  |
| Live credentials            | Configured locally, untracked  |
| Live account/Mind discovery | Verified 2026-08-06            |
| Cross-session Mind recall   | Verified 2026-08-06            |
| Cognition health            | Verified 2026-08-06            |

Live incident analysis and the fresh Discord → persistent Mind follow-up path are implemented and test-verified. Autonomous resolution additionally requires at least one referenced fresh message and confidence of 0.75 or greater; uncertainty completes as manual review, while transport/provider/schema failures use bounded retry and then fail closed. Dedicated Discord-server execution has not yet been externally verified, so it must not be described as live-delivered evidence.

The sanitized live result is recorded in [`docs/evidence/minds-persistence-proof.md`](evidence/minds-persistence-proof.md).
