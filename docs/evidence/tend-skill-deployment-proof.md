# Custom TEND Skill API deployment proof

Verified: 2026-08-08; Minds platform boundary confirmed 2026-08-12
(Asia/Saigon).

This record is sanitized. It contains no bearer key, authorization header, creator session, Minds credential, Discord credential, private response body, or raw community content.

## Verified deployment boundary

- The deployment contract names `https://tend.tangvu.dev` as its server.
- The Windows host generates a dedicated 256-bit Skill bearer key once and persists it in ignored runtime data at `data/tend-skill-api.key`.
- The key is distinct from creator, Minds, worker, and Discord credentials and is not committed or logged.
- An unauthenticated request to `GET /api/skill/community-context` returned HTTP 401.
- The same public endpoint returned HTTP 200 with the dedicated bearer key.
- A proposal containing the unavailable `delete_message` action type returned HTTP 400.
- The public dashboard remained demo/mock and credential-free for judges.

## Accurate Minds status

The owner-authenticated Mind read the deployed OpenAPI document, authored the
`tend-community-steward` Skill draft, reported a successful `system_skill`
schema gate, and returned a permission review covering the six declared
operations. It did not receive the bearer credential and did not equip or
publish the draft.

The required TEND App Manifest and Connection could not be created. Minds
support confirmed that Minds BETA does not currently support private Bazaar
Apps or Skills and that published Apps are handled by the Minds team. The
public Builder surfaces support discovery and equipment of existing Apps, not
builder-side App registration. TEND rejected the proposed fallback of storing
the bearer credential in a Mind tenet or other content.

See the [sanitized platform-boundary record](minds-skill-platform-boundary.md).
Do not describe the Skill as deployed, connected, equipped, published, or live
tool-call verified until a supported App/Connection flow and all operation
tests have passed.
