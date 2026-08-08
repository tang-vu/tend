# ADR 0005: Single-creator live dashboard authentication

Status: accepted — 2026-08-08

## Context

Live Discord intake can create incident evidence and approval work, but exposing that state through an unauthenticated browser would leak community data and permit consequential moderation changes. TEND currently supports one community and one creator, so a complete multi-tenant identity system would add surface area without creating honest tenant isolation.

## Decision

Live mode uses one server-configured creator access key and a separate signing secret, each at least 32 characters. Successful sign-in creates an eight-hour HS256 session with fixed issuer, audience, subject, role, and a random token ID. The browser receives it only in an `HttpOnly`, production-`Secure`, `SameSite=Strict` cookie.

Every live dashboard page and snapshot read verifies the session at the data boundary. Browser mutations additionally require an exact `Origin` match against `TEND_PUBLIC_ORIGIN`, or the request origin when that deployment value is absent. Login uses fixed-length digest comparison and a bounded process-local limiter: five failures per client in 15 minutes. Logout expires the cookie with the same attributes. Generic failures reveal neither key length nor session content.

Demo mode remains credential-free because it contains only fictional shared state. Skill and worker APIs retain their separate bearer credentials and do not accept creator cookies.

## Consequences

The live dashboard can now be enabled for the hackathon's single creator without weakening the API and Discord trust boundaries. Authentication configuration and successful authentication remain distinct states, and partial or reused secrets fail closed.

This is not production-grade identity. There is no multi-user account lifecycle, community role assignment, MFA, recovery, persistent session registry, immediate token revocation, or distributed rate limit. Those controls are required before multi-tenant or horizontally scaled use.
