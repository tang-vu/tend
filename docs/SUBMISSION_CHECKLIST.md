# Creative Minds Jam submission checklist

## Product and deployment

- [x] Working HTTPS deployment created from the verified production build.
- [x] Persistent writable host path configured for `TEND_DB_PATH`; learned state survived a verified PM2 stop/start cycle.
- [x] Public demo reset tested after a cold start and returned to `ready` with no incidents, memories, or follow-ups.
- [x] Public deployment restricted to labeled demo/mock mode; live dashboard separately fails closed without a valid signed creator session.
- [x] Repository visibility verified for judges with an unauthenticated HTTP 200 response.
- [x] README opens with a three-step judge path and honest claim ledger linking live product, integration proofs, and CI.
- [x] README quick start exercised from the empty repository build.

## Minds evidence

- [x] Builder API key and Mind configured in the private live-integration process environment; public demo remains credential-free.
- [x] `pnpm minds:doctor` saved as a sanitized artifact.
- [x] `pnpm minds:proof` demonstrates genuine second-session recall.
- [x] The initial failed recall proof was reported honestly, fixed with envelope parsing, regression-tested, and rerun successfully.
- [x] Cognition balance checked.
- [x] Custom Skill draft authored, schema-validated, and permissions inspected without sharing its bearer credential.
- [ ] Custom Skill App/Connection created, equipped, and tool calls tested — blocked by the confirmed Minds BETA App registration/private-item boundary.
- [x] Skill status described accurately: API deployed and draft validated; App registration, Connection, equip, publication, and live tool calls remain unclaimed.

## Discord evidence

- [x] Dedicated test server and least-privilege bot role verified.
- [x] Guild/channel allowlists tested: configured bot can see the authorized guild and 1/1 allowlisted channel.
- [x] Bot/self loop test captured; a bot-authored allowlisted-channel message left the incident count unchanged.
- [ ] Approved test reminder delivered once and audited.
- [x] No production community contacted; external checks were restricted to the explicitly authorized test server.

## Submission assets

- [x] 1.5–2 minute demo video following `docs/DEMO_SCRIPT.md` rendered locally at 114.7 seconds in 1080p.
- [x] Demo video uploaded to YouTube; unauthenticated oEmbed access returned HTTP 200 with the expected title.
- [x] Credential-free 24-second visual preview rendered with the production FFmpeg scene pipeline.
- [x] Final MiMo TTS narration and MiMo ASR verification generated from the ignored local environment; per-scene word coverage is 95.2–100%.
- [x] Desktop landing, incident, countdown, and resolution screenshots.
- [x] Mobile landing, incident, countdown, and resolution screenshots.
- [x] Project description and primary tagline.
- [x] Form-ready short/full submission copy in `docs/SUBMISSION_COPY.md`.
- [x] Track selected: **Moderation & community assistance**.
- [x] Architecture and security documentation linked.
- [x] Minds persistence proof linked.
- [x] Judge-readable integration evidence page separates public runtime, verified boundaries, and withheld claims.
- [x] Landing and mobile navigation surface a dedicated Judge brief; its four-lens scorecard routes directly to problem fit, Minds depth, runnable execution, and viability evidence.
- [x] Unauthenticated link audit returned HTTP 200 for the live product, demo, evidence, health, public repository, three integration proofs, verified CI run, and YouTube oEmbed.
- [x] Source-linked seven-handoff proof spine and counterfactual make the complete continuity loop inspectable on desktop and mobile.
- [x] Portable Decision Receipt exposes evidence, authority, continuity, and audit in print/PDF and integrity-verifiable JSON without raw effect or integration identifiers.
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
- [x] Video upload and judge-access check completed before the submission deadline.
