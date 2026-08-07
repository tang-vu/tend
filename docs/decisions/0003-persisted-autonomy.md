# ADR 0003: Persisted claims for autonomous work

Status: accepted — 2026-08-05

## Context

An in-memory countdown would not prove autonomous continuity and could duplicate Discord effects after retries.

## Decision

Follow-ups and approved actions are durable rows. Workers atomically transition due jobs to `claimed` and approved actions to `executing`. Unique idempotency keys identify effects. Follow-ups use bounded backoff and become failed/manual review when attempts are exhausted.

A successful processor returns a typed completion containing the incident outcome, an explicit `seeded_demo` or `live_observation` evidence kind, and a bounded summary. Persistence derives community ownership by joining follow-up → incident → community. It rejects seeded demo evidence for live communities and creates pulses only for resolved outcomes.

The web process starts the follow-up service through Next instrumentation for a one-command demo. The same service is independently runnable in `apps/discord-worker`.

## Consequences

Refreshes and process restarts preserve state. Demo fixtures cannot accidentally resolve live incidents, and retry/failure audit events cannot fall back to demo community identifiers. Single-instance SQLite is adequate for the MVP. Multi-instance deployment requires PostgreSQL/queue leases rather than relying on the embedded poller.
