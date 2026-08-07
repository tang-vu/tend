# Always-on Windows host

This profile runs the credential-free public demo on the repository owner's always-on Windows machine. It uses PM2 for process recovery and a dedicated Cloudflare named tunnel.

## Safety boundary

- The hosted process forces `TEND_MODE=demo` and `MINDS_MODE=mock`.
- Live Minds credentials are explicitly cleared from the hosted process.
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
