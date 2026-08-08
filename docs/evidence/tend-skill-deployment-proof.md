# Custom TEND Skill API deployment proof

Verified: 2026-08-08 (Asia/Saigon).

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

The API deployment is ready, but the owner-authenticated Minds steps are not complete. The Skill has not been created, connected, equipped, published, or live tool-call verified. The official Builder flow requires the owner to add the bearer key under **My Connections** and build/refine/equip the Skill through the Mind conversation. The installed client library does not expose Skill or Connection administration.

Do not describe the Minds Skill as deployed or equipped until those owner UI steps and every operation test have passed.
