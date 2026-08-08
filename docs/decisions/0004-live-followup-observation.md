# ADR 0004: Grounded live follow-up observation

Status: accepted — 2026-08-08

## Context

A persisted timer proves continuity but not that a live community outcome was actually observed. Reusing the demo's deterministic “no renewed conflict” result in live mode would fabricate evidence. Letting both the web process and Discord worker claim live jobs would also allow the non-observing process to win the race.

## Decision

Live incidents persist their allowlisted source channel. When a follow-up becomes due, only the independent Discord worker may claim it. The worker rechecks guild/channel ownership, fetches at most 50 newer non-bot text messages, and sends the bounded observation to the same persistent community Mind inside an escaped untrusted-data block.

The Mind returns a strict follow-up assessment. TEND rejects unknown fields and message IDs outside the fetched observation. Autonomous resolution requires a validated live provider response, confidence of at least 0.75, and at least one referenced fresh message. Low-confidence, empty, or explicitly uncertain evidence completes as manual review. Transport, provider, schema, and fabricated-reference failures use bounded retry and then fail closed.

Only the outcome, observed-message count, and sanitized Minds reference are persisted for the fresh observation; raw follow-up messages are not copied into new application rows.

## Consequences

The Mind now participates in the complete live continuity loop rather than only first-pass incident analysis. Resolution is grounded in inspectable source identity and sanitized provider evidence. The design remains single-community/single-worker for the MVP; queue leases, paginated observation windows, attachment analysis, and creator authentication remain future work.
