# Always-on Windows host

This profile runs the credential-free public demo on the repository owner's always-on Windows machine. It uses PM2 for process recovery and a dedicated Cloudflare named tunnel.

## Safety boundary

- The hosted process forces `TEND_MODE=demo` and `MINDS_MODE=mock`.
- Live Minds credentials are explicitly cleared from the hosted process.
- Live creator credentials are explicitly cleared; the fictional demo remains credential-free.
- Worker and Discord credentials are explicitly cleared from the public process.
- The Skill API uses a dedicated high-entropy bearer key persisted in the ignored `data/tend-skill-api.key`; it is never a creator, Minds, or Discord credential.
- SQLite is persisted below the ignored `data/` directory.
- The Cloudflare tunnel credential and concrete local config stay untracked.
- `tend.tangvu.dev` is the only intended public hostname.

## Prepare

```powershell
pnpm install --frozen-lockfile
pnpm build
pnpm host:prepare
New-Item -ItemType Directory -Force data\pm2
```

Create `data/cloudflared-tend.yml` using the dedicated tunnel ID and credential file:

```yaml
tunnel: <tunnel UUID>
credentials-file: <absolute ignored credential JSON path>
ingress:
  - hostname: tend.tangvu.dev
    service: http://127.0.0.1:3000
  - service: http_status:404
```

Create a proxied CNAME in the `tangvu.dev` Cloudflare zone:

```text
Name: tend
Target: <tunnel UUID>.cfargotunnel.com
Proxy: enabled
```

## Run and persist

```powershell
pm2 start ops/windows/ecosystem.config.cjs
pm2 save
pm2 status
```

The web profile invokes Next's standalone server with Node directly instead of spawning a shell wrapper. Run `pnpm host:prepare` after every production build so standalone static assets match the new build. PM2 on Windows needs an existing logon/startup integration to resurrect saved processes after a reboot. This machine already uses PM2 for long-running services; verify that integration separately after reboot.

## Verify

```powershell
Invoke-WebRequest http://127.0.0.1:3000/api/health -UseBasicParsing
Invoke-WebRequest https://tend.tangvu.dev/api/health -UseBasicParsing
pm2 logs tend-web --lines 50 --nostream
pm2 logs tend-tunnel --lines 50 --nostream
```

Never commit `.env`, files below `data/`, tunnel credential JSON, database files, or PM2 logs.

## Private live integration profile

The optional `ecosystem.live.config.cjs` profile runs two loopback-only processes without changing the public demo:

- `tend-live-web` on `127.0.0.1:3001`, using live Minds and `data/tend-live-test.db`;
- `tend-discord-worker`, connected to the authorized test guild and the live web process.

It loads only the required values from the ignored root `.env` and fails before startup if any required value is absent. Start it only after completing `docs/DISCORD_SETUP.md`:

```powershell
pm2 start ops/windows/ecosystem.live.config.cjs
pm2 save
Invoke-WebRequest http://127.0.0.1:3001/api/health -UseBasicParsing
pm2 logs tend-discord-worker --lines 50 --nostream
```

Stop `tend-web` and `tend-live-web` before rebuilding because both execute the same standalone tree. After `pnpm build` and `pnpm host:prepare`, restart both web processes and the worker.
