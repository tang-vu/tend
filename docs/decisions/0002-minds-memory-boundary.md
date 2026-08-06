# ADR 0002: Mind memory with an auditable application mirror

Status: accepted — 2026-08-05

## Context

Creators need persistent agent memory and also need to inspect, correct, archive, and test facts that influence moderation.

## Decision

The persistent Mind is the agent memory layer in live mode. TEND stores creator-approved facts and decision references as an auditable mirror. The UI calls these records “memory receipts,” never the Mind's underlying memory.

## Consequences

Demo mode can be deterministic and privacy controls remain enforceable. Live proof must test genuine recall across sessions; a database match alone cannot be presented as proof.
