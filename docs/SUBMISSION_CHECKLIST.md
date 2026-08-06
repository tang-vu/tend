# Creative Minds Jam submission checklist

## Product and deployment

- [ ] Working HTTPS deployment created from the verified Docker image.
- [ ] Persistent writable volume configured for `TEND_DB_PATH`.
- [ ] Public demo reset tested after a cold start.
- [ ] Dashboard protected or deployment restricted; MVP has no creator authentication.
- [ ] Repository visibility set for judges.
- [ ] README quick start re-run on a clean clone.

## Minds evidence

- [ ] Builder API key and Mind configured in deployment secrets.
- [ ] `pnpm minds:doctor` saved as a sanitized artifact.
- [ ] `pnpm minds:proof` demonstrates genuine second-session recall.
- [ ] Failed recall, if any, reported honestly and fixed before recording.
- [ ] Cognition balance checked.
- [ ] Custom Skill deployed, permissions inspected, equipped, and tool calls tested.
- [ ] Skill publication status described accurately.

## Discord evidence

- [ ] Dedicated test server and least-privilege bot role.
- [ ] Guild/channel allowlists tested.
- [ ] Bot/self loop test captured.
- [ ] Approved test reminder delivered once and audited.
- [ ] No production community contacted.

## Submission assets

- [ ] 1.5–2 minute demo video following `docs/DEMO_SCRIPT.md`.
- [ ] Desktop landing, incident, countdown, and resolution screenshots.
- [ ] Mobile landing and resolution screenshots.
- [ ] Project description and primary tagline.
- [ ] Track selected: **Moderation & community assistance**.
- [ ] Architecture and security documentation linked.
- [ ] Minds persistence proof linked.
- [ ] Known limitations stated.

## Final safety and delivery

- [ ] `pnpm verify` and `pnpm test:e2e` pass.
- [ ] Docker build and container smoke pass.
- [ ] `pnpm secrets:check` passes.
- [ ] Git diff contains no `.env`, token, proof private content, or accidental database.
- [ ] Product copy distinguishes mock/configured/verified/live.
- [ ] No automatic ban, kick, delete, or timeout path.
- [ ] Credentials rotated after screen recording if they were visible anywhere.
- [ ] Deadline buffer reserved for upload and judge-access checks.
