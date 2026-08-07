# TEND continuation handoff

Last updated: 2026-08-07 (Asia/Saigon).

Read `AGENTS.md` first. This document is the durable operational and implementation handoff for a new chat or maintainer.

## Current outcome

- Public credential-free demo: **https://tend.tangvu.dev**
- Health: `https://tend.tangvu.dev/api/health`
- Repository: `https://github.com/tang-vu/tend`, branch `main`
- Last product/deployment commit before this handoff: `841fc37`
- Latest verified CI at handoff: https://github.com/tang-vu/tend/actions/runs/31194396324
- Public deployment is intentionally `TEND_MODE=demo` + `MINDS_MODE=mock`.
- Live Minds discovery, cognition access, messaging, and cross-session recall were separately verified with owner credentials. See `docs/evidence/minds-persistence-proof.md`.

The public three-act flow was executed through the Cloudflare hostname, not only localhost. It reached:

1. reset / `ready`;
2. creator teaching / `learned`;
3. medium-risk incident using the Kai boundary receipt;
4. explicit action approval with a 12-second persisted due job;
5. autonomous completed follow-up;
6. resolved incident and generated community pulse.

The public scenario was reset to `ready` after verification.

## Running services on this Windows host

PM2 owns two TEND processes:

| Process       | Purpose                                       | Expected state |
| ------------- | --------------------------------------------- | -------------- |
| `tend-web`    | Next.js standalone server on `127.0.0.1:3000` | online         |
| `tend-tunnel` | Dedicated Cloudflare named tunnel             | online         |

Check without printing process environments:

```powershell
pm2 status
pm2 logs tend-web --lines 50 --nostream
pm2 logs tend-tunnel --lines 50 --nostream
Invoke-WebRequest http://127.0.0.1:3000/api/health -UseBasicParsing
```

PM2 state is saved in the user's PM2 dump. Scheduled Task `PM2 Resurrect` runs `D:\Node\pm2.cmd resurrect` at user logon. It does not start before Windows user logon.

Operational definitions are in `ops/windows/`. `ops/windows/ecosystem.config.cjs` forces the hosted web process to demo/mock and clears live Minds credentials.

## Cloudflare state

- Hostname: `tend.tangvu.dev`
- Dedicated tunnel name: `tend`
- Tunnel UUID: `c2393103-f212-46a2-b9b1-00ef51f19684`
- Proxied CNAME target: `c2393103-f212-46a2-b9b1-00ef51f19684.cfargotunnel.com`
- Local ignored config: `data/cloudflared-tend.yml`
- Credential JSON is outside the repository below the user's `.cloudflared` directory. Never print or commit it.

An initial command inherited the unrelated `rrtrace` default config and created `tend.tangvu.dev.rrtrace.xyz`. The owner deleted that record. The dedicated TEND config now prevents tunnel cross-project bleed.

Wrangler is logged in, but its OAuth grant has zone-read rather than DNS-edit permission. DNS mutations therefore require the Cloudflare dashboard or a separately scoped secret that must never be placed in Git or chat.

## Local state and secrets

Never inspect, print, commit, screenshot, or paste these values:

- root `.env` (contains owner-supplied live Minds configuration);
- files below `data/`;
- Cloudflare credential JSON;
- PM2 environment dumps or raw authorization headers.

Relevant ignored runtime files:

- `data/tend-hosted.db`: public demo SQLite database;
- `data/pm2/`: TEND process logs;
- `data/cloudflared-tend.yml`: concrete local tunnel config;
- root `.env`: local/live diagnostics only.

The hosted PM2 process explicitly clears `MINDS_BUILDER_API_KEY` and `MINDS_MIND_ID`; do not weaken this boundary. Live proof commands load the ignored root environment independently.

## Deploy an updated build on this machine

Run from the repository root:

```powershell
git status --short --branch
git pull --ff-only
pnpm install --frozen-lockfile
pnpm verify
pnpm build
pnpm host:prepare
pm2 restart tend-web --update-env
pm2 save
Invoke-WebRequest http://127.0.0.1:3000/api/health -UseBasicParsing
```

`pnpm host:prepare` copies generated static assets into Next's standalone tree. It is required after every build. If the PM2 script path or ecosystem definition changes, delete and recreate only `tend-web` from `ops/windows/ecosystem.config.cjs`; do not disturb unrelated PM2 processes.

After local health passes, verify public health, landing, CSS, and the demo flow. Reset the public scenario afterward:

```powershell
Invoke-WebRequest https://tend.tangvu.dev/api/health -UseBasicParsing
```

If the Windows resolver temporarily retains an NXDOMAIN result, compare against `Resolve-DnsName tend.tangvu.dev -Server 1.1.1.1` and flush the local cache. Do not change working DNS records merely because of a stale local negative cache.

## Verification status

- `pnpm verify`: passed with 42 Vitest tests at handoff.
- Playwright: 14/14 desktop/mobile tests passed in CI.
- Production Next build: passed.
- OpenAPI validation: passed.
- Secret scan: passed.
- Docker image build: passed in CI.
- Public HTTPS health, landing, CSS, and full three-act persisted demo: passed.
- Git working tree and `origin/main`: synchronized when this handoff was written.

Never claim a later check passed without rerunning it after material changes.

## Important product/security boundaries

- Public hosting is demo/mock only and visibly labeled.
- The mock response is not described as a live Minds call.
- Live Minds persistence proof is genuine and separately documented.
- Consequential actions require explicit approval.
- Ban and kick are unavailable.
- Live dashboard/data APIs fail closed because creator authentication is not implemented.
- Community messages are untrusted data and cannot alter system policy.
- The public demo has shared mutable scenario state; any visitor may reset/replay it. Do not store real member/community data in this deployment.
- SQLite is suitable for this single-host hackathon deployment, not horizontal scaling.

## Highest-priority remaining work

1. Record the 1.5-2 minute video using `docs/DEMO_SCRIPT.md` and the public URL.
2. Complete and submit the remaining unchecked items in `docs/SUBMISSION_CHECKLIST.md`.
3. Deploy/equip the Custom TEND Skill only after setting a server-side `TEND_SKILL_API_KEY`; never put the key in the OpenAPI file, repository, browser, or chat.
4. Test Discord in a dedicated least-privilege server using `docs/DISCORD_SETUP.md`. Do not connect a production community.
5. Add real creator authentication before enabling any public live-mode dashboard.
6. For post-hackathon scaling, migrate SQLite to PostgreSQL and run queue-backed web/Discord workers.
7. Arrange periodic SQLite backups and machine uptime monitoring if this host remains the public demo origin.

External claims still forbidden until verified:

- Custom Skill deployed/equipped/published;
- live Discord delivery;
- production-grade authentication;
- multi-instance durability or availability.

## New-chat startup checklist

1. Read `AGENTS.md` and this file completely.
2. Run `git status --short --branch` and `git log -3 --oneline`.
3. Check `pm2 status` without dumping environments.
4. Check local and public `/api/health`.
5. Preserve ignored runtime state and owner credentials.
6. Continue from `docs/SUBMISSION_CHECKLIST.md` or the user's newest requested feature.
7. After each implementation update: run relevant gates, commit, push, and wait for CI.
