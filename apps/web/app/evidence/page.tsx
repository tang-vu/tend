import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowIcon,
  CheckIcon,
  ClockIcon,
  PlayIcon,
  ShieldIcon,
  SproutIcon,
} from "@/components/icons";
import { SiteHeader, Wordmark } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Integration evidence",
  description:
    "Inspect what TEND runs in the public demo, what has been privately verified, and what remains unverified.",
};

const repositoryBase = "https://github.com/tang-vu/tend/blob/main";

const judgeLenses = [
  {
    number: "01",
    label: "Problem fit",
    title: "The creator stops being the memory layer.",
    detail:
      "See why relationship context changes a mild-looking moderation decision.",
    href: "#innovation",
    linkLabel: "See the counterfactual",
  },
  {
    number: "02",
    label: "Minds depth",
    title: "Memory is part of the control loop.",
    detail:
      "Trace the persistent Mind through validation, policy, approval, and follow-up.",
    href: "#proof-spine",
    linkLabel: "Trace seven handoffs",
  },
  {
    number: "03",
    label: "Execution",
    title: "The complete story is publicly runnable.",
    detail:
      "Exercise real persistence, approval transitions, a due job, and the audit trail.",
    href: "/demo",
    linkLabel: "Run the three-act demo",
  },
  {
    number: "04",
    label: "Viability",
    title: "Claims have explicit operating boundaries.",
    detail:
      "Inspect what is verified, what is only partial, and what TEND still withholds.",
    href: "#verified-boundaries",
    linkLabel: "Audit the boundaries",
  },
] as const;

const proofSpine = [
  {
    number: "01",
    verb: "Receive",
    authority: "Application boundary",
    detail:
      "Only allowlisted, non-bot Discord content enters as a bounded, sanitized excerpt.",
    artifact: "discord.message_ingested",
    href: `${repositoryBase}/apps/discord-worker/src/filter.ts`,
  },
  {
    number: "02",
    verb: "Remember",
    authority: "Persistent Mind",
    detail:
      "Creator-approved receipts carry relationship context into a later conversation session.",
    artifact: "receipt ID + Mind reference",
    href: `${repositoryBase}/packages/minds/src/live.ts`,
  },
  {
    number: "03",
    verb: "Validate",
    authority: "Schema boundary",
    detail:
      "Structured output is Zod-validated, repaired once, then fails closed to manual review.",
    artifact: "prompt version + fingerprint",
    href: `${repositoryBase}/packages/core/src/schema.ts`,
  },
  {
    number: "04",
    verb: "Govern",
    authority: "Core policy",
    detail:
      "Post-model policy removes unavailable actions and makes low confidence non-actionable.",
    artifact: "policy decision + tests",
    href: `${repositoryBase}/packages/core/src/policy.ts`,
  },
  {
    number: "05",
    verb: "Approve",
    authority: "Creator",
    detail:
      "Consequential repair remains a proposal until a person explicitly approves it.",
    artifact: "approval state transition",
    href: `${repositoryBase}/apps/web/app/api/actions/%5Bid%5D/approve/route.ts`,
  },
  {
    number: "06",
    verb: "Return",
    authority: "Persisted worker",
    detail:
      "An atomic due-job claim, bounded retry, and idempotency key make follow-up durable.",
    artifact: "follow-up row + audit event",
    href: `${repositoryBase}/packages/db/src/worker.ts`,
  },
  {
    number: "07",
    verb: "Close the loop",
    authority: "Grounded outcome",
    detail:
      "Live resolution requires fresh evidence; demo evidence stays explicitly seeded and labeled.",
    artifact: "outcome + community pulse",
    href: `${repositoryBase}/apps/discord-worker/src/followup.ts`,
  },
] as const;

const evidence = [
  {
    icon: <SproutIcon />,
    integration: "Live Minds",
    status: "Verified",
    tone: "verified",
    summary:
      "The official server-side client discovered the configured Mind, accessed cognition, and demonstrated genuine recall in a second conversation session.",
    scope:
      "This proof runs in the private live profile. The credential-free public demo intentionally uses Mock Minds.",
    href: `${repositoryBase}/docs/evidence/minds-persistence-proof.md`,
    linkLabel: "Read persistence proof",
  },
  {
    icon: <ShieldIcon />,
    integration: "Custom TEND Skill API",
    status: "API verified",
    tone: "partial",
    summary:
      "The public bearer-protected API rejects missing authorization, accepts its dedicated connection key, and refuses unavailable destructive actions.",
    scope:
      "The owner-authenticated Minds Skill still needs to be created, equipped, and tool-call tested before TEND claims full Skill verification.",
    href: `${repositoryBase}/docs/evidence/tend-skill-deployment-proof.md`,
    linkLabel: "Read Skill API proof",
  },
  {
    icon: <CheckIcon />,
    integration: "Discord boundary",
    status: "Boundary verified",
    tone: "partial",
    summary:
      "Gateway login, the dedicated test guild, the one-channel allowlist, least-privilege permissions, and bot/self-loop rejection were externally verified.",
    scope:
      "Human-authored intake, one-time reminder delivery, and grounded follow-up observation remain unverified and are not presented as live evidence.",
    href: `${repositoryBase}/docs/evidence/discord-live-proof.md`,
    linkLabel: "Read Discord proof",
  },
  {
    icon: <ClockIcon />,
    integration: "Persisted autonomy",
    status: "Publicly runnable",
    tone: "verified",
    summary:
      "SQLite state, approval gates, atomic due-job claims, autonomous completion, and the audit timeline run in the public three-act demo.",
    scope:
      "Judgment and follow-up evidence are deterministic fixtures in demo mode and are labeled as such throughout the product.",
    href: "/demo",
    linkLabel: "Run the three-act demo",
  },
] as const;

export default function EvidencePage() {
  return (
    <div className="evidence-page">
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <section className="evidence-hero">
          <div>
            <span className="eyebrow">Judge-readable proof</span>
            <h1>Runtime truth, without the hand-waving.</h1>
            <p>
              TEND separates what anyone can run in the public demo from what
              has been verified with private integration credentials. Partial
              verification stays partial.
            </p>
            <div className="evidence-hero-actions">
              <Link className="button button-primary" href="/demo">
                Run the proof story <ArrowIcon />
              </Link>
              <a
                className="evidence-video-link"
                href="https://youtu.be/seHv0MV4Y0U"
                rel="noreferrer"
                target="_blank"
              >
                <PlayIcon />
                <span>
                  <strong>Watch the product film</strong>
                  1:55 · no sign-in
                </span>
              </a>
            </div>
          </div>
          <div className="evidence-runtime-card">
            <span className="evidence-live-dot" />
            <div>
              <span>Public runtime</span>
              <strong>Demo mode · Mock Minds · Local Discord</strong>
              <p>No judge credentials or real community data required.</p>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="judge-lenses-heading"
          className="judge-lenses"
        >
          <div className="judge-lenses-heading">
            <div>
              <span className="eyebrow">Judge brief · four review lenses</span>
              <h2 id="judge-lenses-heading">
                The case for TEND, in four lenses.
              </h2>
            </div>
            <p>
              Start with the lens you score. Every claim leads to a runnable
              surface, inspectable source, or an explicit scope boundary.
            </p>
          </div>
          <ol>
            {judgeLenses.map((lens) => (
              <li key={lens.number}>
                <div className="judge-lens-topline">
                  <span>{lens.number}</span>
                  <strong>{lens.label}</strong>
                </div>
                <h3>{lens.title}</h3>
                <p>{lens.detail}</p>
                <Link href={lens.href}>
                  {lens.linkLabel} <ArrowIcon />
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="proof-spine-heading"
          className="proof-spine"
          id="proof-spine"
        >
          <div className="proof-spine-heading">
            <div>
              <span className="eyebrow">The continuity proof spine</span>
              <h2 id="proof-spine-heading">
                One message. Seven accountable handoffs.
              </h2>
            </div>
            <p>
              Every junction names who holds authority, what can fail, and which
              artifact makes the transition inspectable.
            </p>
          </div>
          <ol aria-label="TEND decision and follow-up proof chain">
            {proofSpine.map((step) => (
              <li className="proof-step" key={step.number}>
                <div className="proof-step-marker">
                  <span>{step.number}</span>
                  <i />
                </div>
                <span className="proof-authority">{step.authority}</span>
                <h3>{step.verb}</h3>
                <p>{step.detail}</p>
                <div className="proof-artifact">
                  <span>Proof artifact</span>
                  <strong>{step.artifact}</strong>
                </div>
                <a href={step.href} rel="noreferrer" target="_blank">
                  Inspect source <ArrowIcon />
                </a>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="counterfactual-heading"
          className="evidence-counterfactual"
          id="innovation"
        >
          <div className="counterfactual-intro">
            <span className="eyebrow light">The innovation, in one glance</span>
            <h2 id="counterfactual-heading">
              The words are mild.
              <br />
              The history isn&apos;t.
            </h2>
            <p>
              The same message produces a different—and more humane—decision
              when the system can recall a member-stated boundary and return to
              check the outcome.
            </p>
          </div>
          <div className="counterfactual-comparison">
            <article>
              <span className="counterfactual-label muted">
                Isolated moderation
              </span>
              <blockquote>
                “Kai made another clip with that cracking voice?”
              </blockquote>
              <div className="counterfactual-flow muted">
                <span>No obvious slur</span>
                <ArrowIcon />
                <strong>Ignore or fixed warning</strong>
              </div>
              <small>Context resets. Outcome is never checked.</small>
            </article>
            <article className="tend-counterfactual">
              <span className="counterfactual-label">TEND + Minds</span>
              <blockquote>
                “Kai asked people not to joke about their voice.”
              </blockquote>
              <div className="counterfactual-flow">
                <span>Known boundary</span>
                <ArrowIcon />
                <strong>Private repair · approval gated</strong>
              </div>
              <small>Persisted follow-up checks whether repair held.</small>
            </article>
          </div>
        </section>

        <section
          aria-labelledby="evidence-heading"
          className="evidence-proof"
          id="verified-boundaries"
        >
          <div className="evidence-section-heading">
            <div>
              <span className="eyebrow">Verified boundaries</span>
              <h2 id="evidence-heading">What each claim actually proves.</h2>
            </div>
            <a
              href="https://github.com/tang-vu/tend"
              rel="noreferrer"
              target="_blank"
            >
              Inspect the repository <ArrowIcon />
            </a>
          </div>
          <div className="evidence-grid">
            {evidence.map((item) => (
              <article className="evidence-card" key={item.integration}>
                <div className="evidence-card-top">
                  <span className="evidence-icon">{item.icon}</span>
                  <span className={`evidence-state ${item.tone}`}>
                    {item.status}
                  </span>
                </div>
                <h3>{item.integration}</h3>
                <p>{item.summary}</p>
                <div className="evidence-scope">
                  <strong>Scope boundary</strong>
                  <span>{item.scope}</span>
                </div>
                {item.href.startsWith("/") ? (
                  <Link className="evidence-link" href={item.href}>
                    {item.linkLabel} <ArrowIcon />
                  </Link>
                ) : (
                  <a
                    className="evidence-link"
                    href={item.href}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {item.linkLabel} <ArrowIcon />
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="evidence-next">
          <div>
            <span className="eyebrow light">Claims still withheld</span>
            <h2>Two checks remain before the strongest live claim.</h2>
            <p>
              Equip and exercise the Custom Skill in the owner&apos;s Mind, then
              complete the consenting Discord delivery and fresh-message
              follow-up in the dedicated test server.
            </p>
          </div>
          <ol>
            <li>
              <span>01</span>
              <div>
                <strong>Equip the Skill</strong>
                <p>Inspect permissions and test every narrow operation.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Close the Discord loop</strong>
                <p>Verify exactly-once delivery and grounded observation.</p>
              </div>
            </li>
          </ol>
        </section>
      </main>
      <footer className="landing-footer">
        <Wordmark />
        <p>
          Evidence is sanitized; secrets and raw community content stay out.
        </p>
        <Link href="/demo">Run the demo →</Link>
      </footer>
    </div>
  );
}
