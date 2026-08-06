# ADR 0003: Persisted claims for autonomous work

Status: accepted — 2026-08-05

## Context

An in-memory countdown would not prove autonomous continuity and could duplicate Discord effects after retries.

## Decision

Follow-ups and approved actions are durable rows. Workers atomically transition due jobs to `claimed` and approved actions to `executing`. Unique idempotency keys identify effects. Follow-ups use bounded backoff and become failed/manual review when attempts are exhausted.

The web process starts the follow-up service through Next instrumentation for a one-command demo. The same service is independently runnable in `apps/discord-worker`.

## Consequences

Refreshes and process restarts preserve state. Single-instance SQLite is adequate for the MVP. Multi-instance deployment requires PostgreSQL/queue leases rather than relying on the embedded poller.
