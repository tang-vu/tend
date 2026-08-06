import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { CheckIcon, ShieldIcon } from "@/components/icons";
import { LiveDashboardLocked } from "@/components/live-dashboard-locked";
import { creatorDashboardAvailable } from "@/lib/http";
import { getRepository, readiness } from "@/lib/server";

export const dynamic = "force-dynamic";

function readinessLabel(value: "configured_unverified" | "not_configured") {
  return value === "configured_unverified"
    ? "Configured · not live-verified"
    : "Not configured";
}

export default function SettingsPage() {
  if (!creatorDashboardAvailable()) return <LiveDashboardLocked />;
  const snapshot = getRepository().getSnapshot();
  const status = readiness();

  return (
    <DashboardShell
      actions={
        <Link className="button button-quiet" href="/onboarding">
          Revisit onboarding
        </Link>
      }
      description="Autonomy, retention, integration readiness, and the boundaries TEND will not cross."
      eyebrow="Configuration"
      title="Safety is a setting you can inspect."
    >
      <div className="settings-grid">
        <section className="settings-card">
          <div className="settings-card-head">
            <span>
              <ShieldIcon />
            </span>
            <div>
              <h2>Autonomy policy</h2>
              <p>Applied after every Mind proposal.</p>
            </div>
          </div>
          <h3>Allowed without another creator prompt</h3>
          <ul className="settings-list">
            {snapshot.community.autonomyPolicy.autonomousActionTypes.map(
              (action) => (
                <li key={action}>
                  <CheckIcon />
                  {action.replaceAll("_", " ")}
                </li>
              ),
            )}
          </ul>
          <h3>Always waits for approval</h3>
          <div className="tag-cloud">
            {snapshot.community.autonomyPolicy.alwaysRequireApproval.map(
              (action) => (
                <span key={action}>{action.replaceAll("_", " ")}</span>
              ),
            )}
          </div>
          <div className="hard-boundary">
            <strong>Unavailable</strong>
            <span>
              Ban · kick · covert profiling · protected-trait inference
            </span>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-head">
            <span>30</span>
            <div>
              <h2>Retention policy</h2>
              <p>Minimum useful data, documented manual deletion process.</p>
            </div>
          </div>
          <dl className="settings-dl">
            <div>
              <dt>Message excerpts</dt>
              <dd>
                {snapshot.community.retentionPolicy.messageExcerptDays} days
              </dd>
            </div>
            <div>
              <dt>Sanitized audit events</dt>
              <dd>{snapshot.community.retentionPolicy.auditDays} days</dd>
            </div>
            <div>
              <dt>Member deletion requests</dt>
              <dd>
                {snapshot.community.retentionPolicy.allowMemberDeletionRequest
                  ? "Manual process declared"
                  : "Disabled"}
              </dd>
            </div>
          </dl>
          <p className="settings-note">
            Member notes must be explicitly approved. TEND does not create
            hidden psychological profiles. Automated purge and verified external
            deletion are not implemented in this MVP.
          </p>
        </section>

        <section className="settings-card integrations-card">
          <div className="settings-card-head">
            <span>↗</span>
            <div>
              <h2>Integration readiness</h2>
              <p>Configuration is not the same as verification.</p>
            </div>
          </div>
          <div className="integration-row">
            <div>
              <strong>Mock Minds</strong>
              <span>Readable deterministic decision fixture</span>
            </div>
            <span className="integration-state ready">Ready</span>
          </div>
          <div className="integration-row">
            <div>
              <strong>Live Minds</strong>
              <span>Official client stays server-side</span>
            </div>
            <span className="integration-state">
              {readinessLabel(status.liveMinds)}
            </span>
          </div>
          <div className="integration-row">
            <div>
              <strong>Discord</strong>
              <span>Worker allowlists guild and channels</span>
            </div>
            <span className="integration-state">
              {readinessLabel(status.discord)}
            </span>
          </div>
          <div className="integration-row">
            <div>
              <strong>Custom TEND Skill</strong>
              <span>OpenAPI exists; no destructive tools</span>
            </div>
            <span className="integration-state">
              {status.customSkill.deployed
                ? "Deployed · unverified"
                : "Local spec only"}
            </span>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-head">
            <span>#</span>
            <div>
              <h2>Discord allowlist</h2>
              <p>Live worker refuses anything outside this boundary.</p>
            </div>
          </div>
          <dl className="settings-dl">
            <div>
              <dt>Guild</dt>
              <dd>{snapshot.community.externalGuildId ?? "Not connected"}</dd>
            </div>
            <div>
              <dt>Channels</dt>
              <dd>{snapshot.community.monitoredChannelIds.join(", ")}</dd>
            </div>
            <div>
              <dt>Demo delivery</dt>
              <dd>Local record only</dd>
            </div>
          </dl>
          <p className="settings-note">
            Never paste a bot token into chat. Put it in an ignored
            `.env.local`, `.env`, or deployment secret store.
          </p>
        </section>
      </div>
    </DashboardShell>
  );
}
