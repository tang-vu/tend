# Privacy and member dignity

TEND is designed for minimum necessary memory, not covert profiling.

## Data TEND may retain

- Creator-written values, rules, norms, tone, and escalation policy.
- Member boundaries only when voluntarily shared and approved for retention.
- Short incident excerpts and nearby context from allowlisted channels.
- Decision references, confidence, policy matches, action state, and sanitized audit summaries.
- Follow-up outcomes.

For a live follow-up, the worker reads at most 50 newer non-bot text messages from the incident's allowlisted source channel and sends that bounded observation to the configured persistent Mind. TEND does not create additional application message rows for this observation; it persists only the outcome, count, and sanitized provider reference. The external Mind may retain conversation context according to the creator's Minds configuration, so real deployment requires clear community notice and an appropriate retention policy.

TEND does not infer or retain hidden psychological profiles or protected, medical, sexual, religious, or political traits. It does not infer member intent as fact.

## Receipts and corrections

The persistent Mind is the live memory layer. `MemoryReceipt` is an auditable application mirror: claim, source, learned time, relevance, confidence, status, and safe Mind reference. Creators can mark receipts corrected, archive them, or restore them. Only active receipts are supplied as application evidence.

Correction should not silently rewrite history. The prior receipt status and an audit event remain visible. A future production implementation should support linked replacement receipts and a member-facing correction workflow.

The creator-facing Decision Receipt is a deliberate export boundary. It may
contain the incident's bounded message excerpt and the full claims of memory
receipts cited by that incident, so the UI and JSON carry a review-before-sharing
notice. It excludes raw Discord/guild/channel/member identifiers, action content,
raw idempotency keys, and unrelated community state. Live receipt access requires
creator authentication; the public demo contains only the fictional scenario.

## Retention and deletion

Demo defaults:

- message excerpts: 30 days;
- sanitized audit events: 180 days;
- member deletion requests: accepted through the documented manual process; automated fulfillment is not implemented.

The MVP documents but does not yet automate retention purging. Before real use, implement a scheduled purge, legal hold rules, tenant export, and verified deletion across PostgreSQL, backups, logs, and any Mind-side context supported by the platform.

For a member request:

1. stop using the member's receipts as active evidence;
2. archive/delete approved notes and unnecessary excerpts;
3. preserve only legally required, minimal abuse-prevention evidence;
4. record a sanitized deletion audit;
5. confirm what could and could not be deleted from external systems.

## Demo data

Kai, Jules, Mina, The Green Room, messages, metrics, and outcomes are fictional seeded demo data. No external Discord delivery occurs in demo mode.
