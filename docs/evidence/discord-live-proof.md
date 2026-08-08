# Discord live integration proof

Verified: 2026-08-08 (Asia/Saigon).

This record is sanitized. It contains no bot token, authorization header, guild ID, channel ID, member content, or raw Minds response.

## Verified external boundaries

- The bot authenticated successfully with the Discord Gateway.
- The configured guild was visible and explicitly marked as an authorized test server.
- Exactly one configured allowlisted channel existed and was visible to the bot.
- Channel permissions included View Channel, Read Message History, Send Messages, and Moderate Members.
- The bot did not have Administrator, Manage Server, Manage Roles, Kick Members, or Ban Members.
- The persistent PM2 worker emitted `discord_worker_ready` with one guild and one channel allowlisted.
- A bot-authored message was posted to the allowlisted test channel. The incident count remained 4 before and after the observation window, proving the bot/self loop was rejected.
- No production community was contacted.

## Live TEND and Minds boundary

- A separate loopback-only live web process returned health `ok`, mode `live`, and persistence `ready` on port 3001.
- The public `tend.tangvu.dev` process remained mode `demo`, persistence `ready`, and credential-free.
- Current Minds doctor diagnostics found the configured Mind enabled with cognition available.
- A clearly labeled synthetic intake passed worker authentication and guild/channel allowlisting. The server eventually recorded a `tend-steward-v1.3.0` medium-risk manual-review incident with one approval-gated `moderator_review` proposal and no external action. The calling client reached its bounded timeout before receiving that result, so this is not evidence of acceptable end-to-end latency.

## Still required before stronger claims

- Send a harmless human-authored message in the allowlisted channel and capture `discord_message_accepted` plus `discord_intake_succeeded`.
- Explicitly approve a consenting private reminder, verify exactly one Discord delivery, and inspect its audit record.
- Post a consenting fresh reply and verify the grounded follow-up path.

Until those steps pass, describe Discord as **Gateway/allowlist/self-loop verified**, not as fully live-delivered or end-to-end verified.
