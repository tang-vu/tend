import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowIcon,
  CheckIcon,
  ClockIcon,
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

        <section aria-labelledby="evidence-heading" className="evidence-proof">
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
