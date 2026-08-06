# ADR 0001: SQLite behind repository interfaces

Status: accepted — 2026-08-05

## Context

The hackathon demo needs durable state and an actual due-job worker without paid infrastructure.

## Decision

Use a local SQLite file in WAL mode through `better-sqlite3`. Keep SQL and row mapping inside `packages/db`, expose task-focused repositories, and use explicit migrations. Store arrays and structured summaries as validated JSON text.

## Consequences

The clean-clone demo is one command and state survives browser refreshes and process restarts. A single-instance deployment is appropriate. Multi-instance production requires PostgreSQL plus a queue or database-backed lease mechanism; domain and service packages do not depend on SQLite types.
