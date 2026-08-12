# Minds Custom Skill platform boundary

Confirmed: 2026-08-12 (Asia/Saigon).

This record is sanitized. It contains no bearer credential, Builder API key,
authorization header, private runtime data, or community content.

## What was completed

- `TEND.Steward` read the deployed OpenAPI document and authored the
  `tend-community-steward` Skill.
- The Mind reported that the Skill passed its `system_skill` schema gate.
- The reviewed draft contains only the six TEND operations documented in
  `docs/tend-skill-openapi.yaml`.
- The draft is not equipped, not published, and has not made a live tool call.
- The bearer credential was never provided in chat, a tenet, an artifact, or
  an inline request header.

## Platform response

The owner asked Minds support how to create the missing private App Manifest
and Connection. Support confirmed that Minds BETA does not currently support
private Bazaar Apps or Skills. Published Apps must currently be handled by the
Minds team, and direct builder-side creation from an external website or
platform has not yet rolled out.

The documented public Builder API and CLI can discover Bazaar Apps and equip
existing App IDs, but they do not expose a builder-side App registration
operation. Consequently, no `TEND Skill API` connection slot is available in
the Mind Connections UI.

## Security decision

TEND will not work around the missing Connection by storing
`TEND_SKILL_API_KEY` in Mind tenets, chat, artifacts, working memory, or Skill
content. Doing so would weaken the platform credential boundary and conflict
with TEND's secret-handling policy.

The draft therefore remains intentionally unequipped. The supported path is a
future Minds App registration/publication flow in which each credential is
entered through a platform-managed Connection.

## Accurate claim

The Custom TEND Skill API is deployed and its authorization and destructive
schema boundaries are verified. A Mind-authored Skill draft is schema-validated
and permission-reviewed. App registration, Connection creation, equipment,
publication, and live tool-call verification remain unavailable and unclaimed.
