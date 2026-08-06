import Link from "next/link";
import {
  ArrowIcon,
  CheckIcon,
  ClockIcon,
  MemoryIcon,
  ShieldIcon,
  SproutIcon,
} from "@/components/icons";
import { ModeBadge } from "@/components/mode-badge";
import { SiteHeader, Wordmark } from "@/components/site-header";

const capability = [
  {
    number: "01",
    icon: <MemoryIcon />,
    title: "Remembers",
    copy: "Creator values, unwritten norms, member-stated boundaries, and corrections stay available beyond one message.",
  },
  {
    number: "02",
    icon: <SproutIcon />,
    title: "Continues",
    copy: "A persistent Mind connects a new incident to the history that makes it understandable and proportionate.",
  },
  {
    number: "03",
    icon: <ClockIcon />,
    title: "Follows up",
    copy: "Persisted due jobs check whether repair held, close loops, and surface unresolved needs without another prompt.",
  },
];

export default function Home() {
  return (
    <div className="landing">
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <section className="hero">
          <div className="hero-copy">
            <div className="hero-label">
              <span>Community stewardship, with continuity</span>
              <i />
              <span>Built with Minds</span>
            </div>
            <h1>
              Moderation shouldn’t reset
              <br />
              <em>with every message.</em>
            </h1>
            <p>
              TEND is a persistent community steward that remembers people,
              context, and the kind of community a creator is trying to build.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/demo">
                Try the three-act demo <ArrowIcon />
              </Link>
              <Link className="button button-quiet" href="/#how-it-works">
                See how it works
              </Link>
            </div>
            <div className="hero-trust">
              <ModeBadge />
              <span>
                <ShieldIcon />
                High-risk actions always need a person
              </span>
            </div>
          </div>
          <div
            aria-label="TEND incident decision preview"
            className="hero-visual"
          >
            <div className="growth-rings ring-one" />
            <div className="growth-rings ring-two" />
            <div className="signal-card card-message">
              <span className="avatar avatar-jules">J</span>
              <div>
                <div className="card-meta">
                  <strong>Jules</strong>
                  <span>just now</span>
                </div>
                <p>Kai made another clip with that cracking voice?</p>
              </div>
            </div>
            <div className="connection-line" />
            <div className="signal-card card-memory">
              <span className="tiny-label">
                <MemoryIcon /> Active memory
              </span>
              <p>“Kai asked people not to joke about their voice.”</p>
              <div className="confidence-line">
                <span>Creator-approved</span>
                <strong>100%</strong>
              </div>
            </div>
            <div className="signal-card card-decision">
              <div>
                <span className="risk-pill medium">Medium risk</span>
                <span className="decision-confidence">91% confidence</span>
              </div>
              <h3>Context changes the meaning.</h3>
              <p>Gentle private reminder · Approval required</p>
              <span className="why-link">
                Why this decision? <ArrowIcon />
              </span>
            </div>
            <div className="garden-note">
              <SproutIcon />
              <span>
                No ban. No timeout.
                <strong>Repair first.</strong>
              </span>
            </div>
          </div>
        </section>

        <section className="thesis-strip">
          <span>AutoMod keeps a server clean.</span>
          <strong>TEND helps keep a community healthy.</strong>
        </section>

        <section className="problem-section">
          <div className="section-heading">
            <span className="eyebrow">The missing layer</span>
            <h2>A rule can catch a word. It can’t remember a relationship.</h2>
          </div>
          <div className="comparison-grid">
            <article className="comparison-card conventional">
              <span className="comparison-label">Conventional moderation</span>
              <h3>One message at a time</h3>
              <ul>
                <li>
                  <span>01</span> Detect a keyword
                </li>
                <li>
                  <span>02</span> Apply a fixed threshold
                </li>
                <li>
                  <span>03</span> Delete, warn, or escalate
                </li>
              </ul>
              <p>
                Fast, but context-blind. The creator becomes the memory layer.
              </p>
            </article>
            <article className="comparison-card tend-way">
              <span className="comparison-label">TEND’s approach</span>
              <h3>Context across time</h3>
              <ul>
                <li>
                  <CheckIcon /> Recall creator values and boundaries
                </li>
                <li>
                  <CheckIcon /> Explain evidence and uncertainty
                </li>
                <li>
                  <CheckIcon /> Repair, then check what happened
                </li>
              </ul>
              <p>Less creator load. More consistent, human decisions.</p>
            </article>
          </div>
        </section>

        <section className="capabilities-section" id="how-it-works">
          <div className="section-heading center">
            <span className="eyebrow">
              One persistent Mind · three capabilities
            </span>
            <h2>Stewardship that accumulates care.</h2>
            <p>
              The Mind is the continuity layer—not an optional chatbot beside
              the product.
            </p>
          </div>
          <div className="capability-grid">
            {capability.map((item) => (
              <article key={item.title}>
                <div className="capability-top">
                  <span className="capability-icon">{item.icon}</span>
                  <span className="capability-number">{item.number}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="safety-section" id="safety">
          <div>
            <span className="eyebrow light">Human authority stays human</span>
            <h2>Autonomy with a fence around it.</h2>
            <p>
              TEND can observe, remember, schedule, and prepare. Consequential
              enforcement stays behind explicit approval, with a clear audit
              trail.
            </p>
          </div>
          <ul>
            <li>
              <CheckIcon /> No automatic bans or kicks
            </li>
            <li>
              <CheckIcon /> Channel allowlists and least privilege
            </li>
            <li>
              <CheckIcon /> Correctable memory receipts
            </li>
            <li>
              <CheckIcon /> Prompt-injection boundaries
            </li>
          </ul>
        </section>

        <section className="minds-section">
          <div className="minds-mark">
            <Wordmark />
          </div>
          <div>
            <span className="eyebrow">Creative Minds Jam #1 · Hong Kong</span>
            <h2>Minds is the memory and continuity engine.</h2>
            <p>
              TEND gives a persistent Mind trusted creator context, structured
              incident evidence, and narrowly scoped Skill tools. The
              application mirrors approved facts for audit; it never pretends a
              database row is the Mind’s memory.
            </p>
          </div>
          <Link className="button button-outline-light" href="/demo">
            See persistence in action <ArrowIcon />
          </Link>
        </section>

        <section className="final-cta">
          <SproutIcon />
          <h2>Tend the culture, not just the queue.</h2>
          <p>
            Run the complete story locally—no Discord or Minds credentials
            required.
          </p>
          <Link className="button button-primary" href="/demo">
            Start the demo <ArrowIcon />
          </Link>
        </section>
      </main>
      <footer className="landing-footer">
        <Wordmark />
        <p>Persistent community stewardship for independent creators.</p>
        <span>Hackathon MVP · 2026</span>
      </footer>
    </div>
  );
}
