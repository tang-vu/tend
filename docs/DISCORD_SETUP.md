# Discord test-server setup

Live Discord Gateway connectivity, the dedicated test-server boundary, channel visibility, least-privilege permissions, and bot self-loop rejection were verified on 2026-08-08. A human-authored intake and approved reminder delivery still need to be captured before claiming end-to-end Discord delivery. Use only the dedicated test server; never begin with a production community.

## Create and invite the app

1. Open the [Discord Developer Portal](https://discord.com/developers/applications) and create an application.
2. On **Bot**, create the bot and enable **Message Content Intent**. Discord classifies it as privileged.
3. On **OAuth2 → URL Generator**, select `bot`.
4. Grant only:
   - View Channels
   - Read Message History
   - Send Messages
   - Moderate Members only if timeout execution will be tested
5. Do not grant Administrator, Manage Server, Manage Roles, Kick Members, or Ban Members.
6. Invite the bot only to the dedicated test server. Keep its role below moderator/admin roles.

discord.js owns Gateway heartbeat, rate-limit, resume, and reconnect behavior. TEND requests Guilds, GuildMessages, MessageContent, and DirectMessages intents.

## Find IDs

Enable Discord **User Settings → Advanced → Developer Mode**. Right-click the test server, monitored channels, and moderator channel to copy IDs.

## Configure without sharing secrets

Copy `.env.example` to an ignored root `.env.local` or `.env`. Put the token directly there; never paste it into chat.

```text
TEND_MODE=live
TEND_BASE_URL=http://localhost:3000
TEND_WORKER_API_KEY=<generate a high-entropy local secret>
DISCORD_BOT_TOKEN=<Developer Portal bot token>
DISCORD_CLIENT_ID=<Application ID>
DISCORD_GUILD_ID=<test server ID>
DISCORD_ALLOWED_CHANNEL_IDS=<comma-separated monitored channel IDs>
DISCORD_MOD_CHANNEL_ID=<moderator channel ID>
DISCORD_TEST_SERVER_AUTHORIZED=true
```

`TEND_WORKER_API_KEY` must match the web process. `MINDS_MODE=live`, `MINDS_BUILDER_API_KEY`, and `MINDS_MIND_ID` are required by the live worker for incident and follow-up analysis. The worker fails startup or follow-up safely when they are unavailable; it never substitutes Mock Minds.

## Run

Terminal 1:

```text
pnpm dev
```

Terminal 2:

```text
pnpm worker:dev
```

The worker prints readiness metadata but never the bot token. Send a harmless test message in an allowlisted channel, then inspect the dashboard. Messages from bots, another guild, or another channel must not create incidents.

## Safe action test

1. Propose a private reminder in the dashboard.
2. Confirm it remains `proposed`.
3. Approve it explicitly.
4. The worker atomically claims it as `executing`, sends once, and records the message ID.
5. Test timeout only with a consenting test account. The MVP uses ten minutes.

Deletion is not implemented. Ban and kick are unavailable.

## Fresh follow-up test

1. Create a harmless incident in one allowlisted channel and approve its proposed reminder.
2. Post one or more consenting test replies after the trigger message. Do not use production member content.
3. Wait until the persisted follow-up is due. The independent worker must execute the approved action before claiming the follow-up.
4. Verify the worker fetched only newer non-bot messages from the persisted source channel.
5. Verify the audit contains `mind.followup_reference` with provider, alias, fingerprint, prompt version, and message count—but no raw message content.
6. Verify a grounded assessment at confidence ≥ 0.75 can resolve and create a pulse.
7. Repeat with no new message, low confidence, an unavailable Mind, and a non-allowlisted channel. These cases must become manual review or bounded failure, never a fabricated resolution.

This path is implemented and covered by local/CI tests. Do not mark Discord follow-up as externally verified until the steps above have been captured in the dedicated test server.

The Windows host keeps the public demo isolated on port 3000 and runs this live path privately on port 3001 using `ops/windows/ecosystem.live.config.cjs`. See `docs/evidence/discord-live-proof.md` for the sanitized verification record.

## Disable

Set `TEND_MODE=demo` and stop the worker. If a token may have leaked, reset it in the Developer Portal and update secret storage.
