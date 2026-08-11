# TEND continuation handoff

Last updated: 2026-08-11 (Asia/Saigon).

Read `AGENTS.md` first. This document is the durable operational and implementation handoff for a new chat or maintainer.

## Current outcome

- Public credential-free demo: **https://tend.tangvu.dev**
- Judge-readable integration evidence: **https://tend.tangvu.dev/evidence** — now includes a four-lens judge scorecard, source-linked seven-handoff proof spine, explicit counterfactual, and direct product-film/demo paths.
- Health: `https://tend.tangvu.dev/api/health`
- Incident audit includes a portable Decision Receipt: print/PDF plus a strict
  `tend.decision-receipt.v1` JSON envelope with SHA-256 payload integrity. It is
  reachable from the demo incident/resolved states and requires creator auth in
  live mode.
- Repository: `https://github.com/tang-vu/tend`, branch `main`
- Use `git log -1 --oneline` for the deployed source revision; the repository is kept synchronized after each release.
- Latest verified CI at handoff: https://github.com/tang-vu/tend/actions/runs/31457939100
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

The optional private live-integration profile adds `tend-live-web` on loopback port 3001 and `tend-discord-worker`. It loads the ignored root `.env` through `ops/windows/ecosystem.live.config.cjs`; the public port-3000 process still clears every live credential. Both live processes were online and saved in PM2 on 2026-08-11 after the current build deployment; loopback live health returned 200 and the unauthenticated state API returned 401.

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
- `artifacts/video/`: generated preview/final MP4, temporary WAV files, and MiMo ASR verification output.

The hosted PM2 process explicitly clears `MINDS_BUILDER_API_KEY` and `MINDS_MIND_ID`; do not weaken this boundary. Live proof commands load the ignored root environment independently.

## Deploy an updated build on this machine

Run from the repository root:

```powershell
git status --short --branch
git pull --ff-only
pnpm install --frozen-lockfile
pm2 stop tend-web
pnpm verify
pnpm build
pnpm host:prepare
pm2 restart tend-web --update-env
pm2 save
Invoke-WebRequest http://127.0.0.1:3000/api/health -UseBasicParsing
```

`pnpm host:prepare` copies generated static assets into Next's standalone tree. It is required after every build. If the PM2 script path or ecosystem definition changes, delete and recreate only `tend-web` from `ops/windows/ecosystem.config.cjs`; do not disturb unrelated PM2 processes.

If the optional private profile is running, stop `tend-live-web` and `tend-discord-worker` together with `tend-web` before `pnpm verify`: both web profiles execute the same standalone tree, and the worker should not intake work while its private web endpoint is down. Restart all three named TEND processes after `pnpm host:prepare`, verify ports 3000/3001, then `pm2 save`. Never stop an unrelated process merely because it temporarily owns a preferred port.

After local health passes, verify public health, landing, CSS, and the demo flow. Reset the public scenario afterward:

```powershell
Invoke-WebRequest https://tend.tangvu.dev/api/health -UseBasicParsing
```

If the Windows resolver temporarily retains an NXDOMAIN result, compare against `Resolve-DnsName tend.tangvu.dev -Server 1.1.1.1` and flush the local cache. Do not change working DNS records merely because of a stale local negative cache.

## Verification status

- Release verification passed with lint, typecheck, 65/65 Vitest tests, production build, OpenAPI validation, and secret scan. On Windows, stop every running TEND web profile before rebuilding because they share and lock `.next/standalone`.
- Browser coverage: 14/14 demo desktop/mobile tests plus 1/1 dedicated live-mode authentication test passed. The live test covers unauthorized reads/mutations, cross-origin rejection, credential failure/success, cookie attributes, authenticated state, logout, post-logout rejection, and the 429 throttle boundary.
- Updated standalone deployment: local/public health and landing returned 200; CSP, frame denial, and HSTS reached the Cloudflare hostname; the public fictional scenario was reset to `ready` with no incidents, memories, or follow-ups.
- Playwright: 14/14 desktop/mobile tests passed in CI.
- Production Next build: passed.
- OpenAPI validation: passed.
- Secret scan: passed.
- Docker image build: passed in CI.
- The final demo video rendered locally at 114.7 seconds, 1920×1080/30 fps, H.264/AAC 48 kHz, -16.6 LUFS integrated, and -1.5 dBFS true peak. MiMo ASR word coverage is 95.2–100% across all six narration scenes. The ignored deliverable is `artifacts/video/tend-creative-minds-jam-demo.mp4`.
- The uploaded demo video is `https://youtu.be/seHv0MV4Y0U`; unauthenticated YouTube oEmbed access returned HTTP 200 with the expected title on 2026-08-09.
- Public HTTPS health, landing, CSS, and full three-act persisted demo: passed.
- Public `/evidence` returned 200 with the judge-facing runtime/proof boundary after the 2026-08-10 deployment.
- On 2026-08-11, the upgraded public `/evidence` returned 200 through Cloudflare with its responsive seven-handoff proof spine, counterfactual, product-film path, production CSS, and unchanged partial-claim boundaries. Desktop/mobile visual QA showed no page overflow.
- On 2026-08-11, the landing and site header were upgraded with a prominent Judge brief path that remains visible on mobile. The deployed `/evidence` scorecard routes four review lenses—problem fit, Minds depth, execution, and viability—to inspectable proof. Desktop/mobile visual QA passed without overflow; the full browser run passed 14/14 demo tests plus 1/1 live-auth test, and Cloudflare returned the new markers with the partial-claim disclosure intact.
- The 2026-08-11 browser run passed 14/14 demo desktop/mobile tests plus 1/1 isolated live-auth test. The live-auth harness now defaults to dedicated port 3101 and supports `TEND_LIVE_E2E_PORT` override, avoiding contention with the private port-3001 runtime.
- The Decision Receipt browser run passed at 1440Ã—900 and 390Ã—844 with no horizontal overflow; the download digest was independently recomputed, demo disclosures were asserted, raw effect fields were absent, and the live API returned 401 before authentication and 404 only after a valid session.
- The deployed public Decision Receipt returned 200 through Cloudflare before and
  after the complete demo flow. Its digest was independently recomputed, the
  resolved export contained a completed follow-up, and the hosted scenario was
  reset to `ready` with zero incidents, memories, or follow-ups. The private
  loopback live receipt API returned 401 without a creator session.
- The complete public three-act flow was rerun after the 2026-08-11 deployment, reached `resolved` with a completed follow-up, and was reset to `ready` with zero incidents, memories, or follow-ups.
- The public host retained the `learned` scenario and four memory receipts across a verified PM2 stop/start, then reset to `ready` with no incidents, memories, or follow-ups.
- The public repository returned HTTP 200 without authentication.
- Discord Gateway login, the authorized guild, 1/1 allowlisted channel, least-privilege permissions, and bot self-loop rejection were externally verified in the dedicated test server. See `docs/evidence/discord-live-proof.md`.
- The Custom TEND Skill API is deployed on the public hostname with a dedicated ignored runtime bearer key. Missing auth returns 401, valid auth returns 200, and a destructive `delete_message` proposal returns 400. The Minds Skill/Connection is not yet created, equipped, or published. See `docs/evidence/tend-skill-deployment-proof.md`.
- Git working tree and `origin/main`: synchronized when this handoff was written.

Never claim a later check passed without rerunning it after material changes.

## Important product/security boundaries

- Public hosting is demo/mock only and visibly labeled. Its server-side Skill API is protected by a dedicated bearer key stored in ignored runtime data; this does not grant creator-dashboard, Minds, worker, or Discord access.
- The mock response is not described as a live Minds call.
- Live Minds persistence proof is genuine and separately documented.
- Consequential actions require explicit approval.
- Ban and kick are unavailable.
- Live dashboard/data APIs fail closed unless two distinct 32+ character creator secrets are configured and an eight-hour signed session is valid.
- Browser mutations require an exact trusted origin. The current auth model is single-creator/single-community, not production-grade multi-user identity or tenant authorization.
- Community messages are untrusted data and cannot alter system policy.
- Decision Receipts contain a bounded community excerpt and cited memory claims;
  review before sharing. They omit raw effect keys and integration/member target
  IDs. Their SHA-256 digest detects payload changes but is not a signer identity
  proof.
- The public demo has shared mutable scenario state; any visitor may reset/replay it. Do not store real member/community data in this deployment.
- SQLite is suitable for this single-host hackathon deployment, not horizontal scaling.

## Highest-priority remaining work

1. Complete the DoraHacks submission form using `docs/SUBMISSION_COPY.md`, verify every external link in a signed-out browser, and save a confirmation screenshot.
2. Complete and submit the remaining unchecked items in `docs/SUBMISSION_CHECKLIST.md`.
3. In the owner-authenticated Minds profile, create the Connection using the ignored `data/tend-skill-api.key`, ask the Mind to build from `docs/tend-skill-openapi.yaml`, inspect permissions, equip it, and test every operation. Never put the key in the OpenAPI file, repository, browser history, or chat.
4. Complete the remaining human-authored Discord intake, explicit reminder approval, one-time delivery, and fresh-message follow-up tests in the already connected dedicated server. Do not connect a production community.
5. Replace the single-creator boundary with managed identity, MFA/recovery, community roles, revocable sessions, and distributed throttling before multi-user or horizontally scaled deployment.
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
