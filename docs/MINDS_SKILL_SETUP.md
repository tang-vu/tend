# Custom TEND Skill setup

Status: the API and OpenAPI contract are deployed at `tend.tangvu.dev` with a dedicated ignored bearer key. Minds Connection, equipment, publication, and live tool-call verification still require the owner flow in Minds.

## Scope

The specification at `docs/tend-skill-openapi.yaml` exposes:

- `get_community_context`
- `list_pending_incidents`
- `propose_community_action`
- `schedule_followup`
- `record_incident_outcome`
- `get_followup_status`

There is intentionally no Discord execution tool. `propose_community_action` cannot accept `execute_timeout` or `delete_message`; ban and kick do not exist in the domain enum. Consequential proposals still enter TEND's approval queue.

## Deploy

1. Deploy the single TEND container behind HTTPS with persistent storage.
2. Set `TEND_BASE_URL` to the public origin.
3. Generate a high-entropy bearer secret locally and store it as `TEND_SKILL_API_KEY` in deployment secret storage. Never commit or paste it into chat.
4. Confirm the deployed server URL in `docs/tend-skill-openapi.yaml`.
5. Confirm that unauthenticated calls return `401` (or `503` while the server secret is absent).

For production, place a reverse proxy in front of Next.js for request size limits and rate limiting. Rotate the bearer secret if access changes.

## Give the API to the Mind

The current official Skill guide describes this builder flow:

1. Tell the Mind to build a narrowly scoped TEND community-steward Skill around the OpenAPI document.
2. Provide the deployed OpenAPI URL/content.
3. In the Minds profile, create the required Connection and enter the bearer credential there.
4. Ask the Mind to show every action and data permission before accepting the Skill.
5. Verify that it has no delete, timeout execution, kick, or ban tool.
6. Test each operation on a demo incident.
7. Equip the Skill only after scope review. Publication is optional and must not be claimed before it occurs.

Suggested builder instruction:

```text
Build a private Skill from this TEND OpenAPI document. It may read creator-approved
community context, list pending incidents, propose non-destructive responses, schedule
follow-ups, and record outcomes. It must never claim a proposal was executed and must
never perform deletion, timeout, kick, or ban. Show me all permissions before equipping it.
```

## Local endpoint tests

Start TEND with a throwaway local `TEND_SKILL_API_KEY`, run Act 1 and Act 2, then call each endpoint with `Authorization: Bearer <local value>`. Inspect the audit timeline after mutation calls.

Expected safety properties:

- unauthenticated request rejected;
- corrected/archived receipts absent from active context;
- destructive action type rejected by schema;
- proposal response says `executionOccurred: false`;
- future follow-up persisted with an idempotency key;
- outcome response says `destructiveActionOccurred: false`.

## Status language for the demo

- Implemented locally: yes.
- Deployed API and contract: yes.
- Requires user configuration in Minds: yes.
- Equipped: no.
- Published: no.
- Verified live: no.
