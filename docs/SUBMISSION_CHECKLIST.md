# Creative Minds Jam submission checklist

## Product and deployment

- [x] Working HTTPS deployment created from the verified production build.
- [ ] Persistent writable volume configured for `TEND_DB_PATH`.
- [ ] Public demo reset tested after a cold start.
- [x] Public deployment restricted to labeled demo/mock mode; live dashboard separately fails closed without a valid signed creator session.
- [ ] Repository visibility set for judges.
- [x] README quick start exercised from the empty repository build.

## Minds evidence

- [ ] Builder API key and Mind configured in deployment secrets.
- [x] `pnpm minds:doctor` saved as a sanitized artifact.
- [x] `pnpm minds:proof` demonstrates genuine second-session recall.
- [ ] Failed recall, if any, reported honestly and fixed before recording.
- [x] Cognition balance checked.
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
- [x] Desktop landing, incident, countdown, and resolution screenshots.
- [x] Mobile landing, incident, countdown, and resolution screenshots.
- [x] Project description and primary tagline.
- [x] Form-ready short/full submission copy in `docs/SUBMISSION_COPY.md`.
- [ ] Track selected: **Moderation & community assistance**.
- [x] Architecture and security documentation linked.
- [x] Minds persistence proof linked.
- [x] Known limitations stated.

## Final safety and delivery

- [x] `pnpm verify` and `pnpm test:e2e` pass.
- [x] Docker image build passes and the standalone server returns HTTP 200 at startup.
- [ ] Sustained container smoke rerun outside the current tool environment, which sends detached containers SIGTERM after about 16 seconds.
- [x] `pnpm secrets:check` passes.
- [x] Git diff contains no `.env`, token, proof private content, or accidental database.
- [x] Product copy distinguishes mock/configured/verified/live.
- [x] No automatic ban, kick, delete, or timeout path.
- [ ] Credentials rotated after screen recording if they were visible anywhere.
- [ ] Deadline buffer reserved for upload and judge-access checks.
