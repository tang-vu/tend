# Sanitized Minds persistence proof

Verified on 2026-08-06 with the official `@animocabrands/minds-client-lib` server-side integration.

## Command

```text
pnpm minds:doctor
pnpm minds:usage
pnpm minds:proof
```

## Observed result

- The configured Mind was discovered and enabled.
- Cognition health was available.
- Teaching and recall used distinct deterministic conversation aliases.
- In the first conversation, TEND taught the creator-approved fact that playful roasting is allowed but Kai asked people not to joke about their voice.
- In the second conversation, the Mind recalled that boundary without receiving it again.
- The recalled boundary materially changed its assessment of the later “cracking voice” message.
- Reported recall confidence was `0.95`.
- The proof evaluator returned `genuineCrossSessionRecallObserved: true` with no validation error.
- No Builder API key or authorization material was printed or stored in this report.

## Integrity notes

The proof command does not hard-code success. It requires a distinct session, an explicit Kai/voice fact, a material decision effect, confidence of at least `0.5`, and a schema-valid response. The first live attempt exposed an HTML `<pre>` response envelope that the parser did not yet support. TEND reported failure, the response history was inspected, envelope parsing was added with regression coverage, and a new live two-session proof then passed.

This evidence verifies live Minds discovery, cognition access, messaging, and cross-session recall. It does not claim that the Custom Skill is deployed/equipped or that Discord delivery has been tested.
