# External technical research

Research date: 2026-08-05. Sources below are primary documentation or package-registry metadata queried directly during implementation.

## Minds Builder

Official sources:

- [Minds client library](https://build.hellominds.ai/en/docs/get-started/client-library)
- [Minds CLI](https://build.hellominds.ai/en/docs/get-started/cli)
- [Skill building guide](https://build.hellominds.ai/en/docs/guides/building-skills)
- [Builder API reference](https://build.hellominds.ai/docs/api)

Implementation assumptions verified from the client-library documentation:

- `@animocabrands/minds-client-lib` is server-side and requires Node 22+.
- Authentication uses `MINDS_BUILDER_API_KEY`; the client sends `X-Api-Key`. `X-Access-Key` is deprecated.
- `createMindsClient({ builderApiKey })` creates the typed client.
- `listMinds()` and `getMind(mindId)` validate account configuration.
- `ensureConversation(alias, mindId)` idempotently binds a stable alias.
- The safe reply sequence is: capture `getLatestHistoryFingerprint(alias)`, call `sendMessage`, then `waitForReply({ alias, afterFingerprint, sentMessageText, timeoutMs })`.
- `waitForReply` uses live events first and history polling second.
- Cognition health is available through `getCognitionBalance`, `getCognitionUsage`, and `getCognitionUsageByTool`.
- The current npm registry version observed was `0.1.3`.

Skill guidance says a Skill includes a listing, app manifest, tool schemas, and
playbook. It explicitly recommends inspecting what the Skill can read/change
before publication. On 2026-08-12, Minds support confirmed that private Bazaar
Apps/Skills and builder-side custom App registration are not currently
available; published Apps are handled by the Minds team. TEND therefore ships
a narrow OpenAPI contract and a Mind-authored/schema-validated draft, but does
not claim App registration, Connection, publication, equipment, or live
tool-call verification.

Live verification on 2026-08-06 confirmed that the configured Mind recalled the creator-approved Kai/voice boundary across two distinct proof aliases and used it materially in the later assessment with confidence `0.95`. The sanitized report is in `docs/evidence/minds-persistence-proof.md`; the command still reports failures honestly and never hard-codes success.

## Framework and runtime registry checks

Observed current versions at research time:

- Next.js `16.3.0` (Node >=20.9)
- React `19.2.8`
- Vitest `4.1.10`
- Playwright `1.62.1`
- discord.js `14.27.0`
- Zod `4.4.3`
- Tailwind CSS `4.3.3`
- better-sqlite3 `13.0.3` (Node >=22)

TEND pins exact versions in the lockfile for reproducibility. The runtime floor remains Node 22 because both Minds and SQLite packages require it.

## Discord

Primary setup references:

- [Discord developer portal](https://discord.com/developers/applications)
- [Gateway intents](https://discord.com/developers/docs/events/gateway#gateway-intents)
- [OAuth2 scopes](https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes)
- [Discord permissions](https://discord.com/developers/docs/topics/permissions)

The worker requests Guilds, GuildMessages, MessageContent, and DirectMessages only for MVP needs. Message Content is a privileged intent and must be enabled in the developer portal. Runtime allowlists are additional controls, not substitutes for Discord permissions.
