import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreatorLoginForm } from "@/components/creator-login-form";
import { ShieldIcon } from "@/components/icons";
import { SiteHeader } from "@/components/site-header";
import { creatorAuthConfigured, readCreatorSession } from "@/lib/creator-auth";

export const metadata: Metadata = {
  title: "Creator sign in",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (process.env.TEND_MODE !== "live") redirect("/community");
  if (await readCreatorSession()) redirect("/community");
  const configured = creatorAuthConfigured();

  return (
    <div className="auth-page">
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <section className="auth-card">
          <span className="auth-icon">
            <ShieldIcon />
          </span>
          <span className="eyebrow">Creator-only surface</span>
          <h1>Return to your community.</h1>
          <p>
            Live incident evidence, memories, and moderation controls stay
            sealed until a creator session is verified.
          </p>
          {configured ? (
            <CreatorLoginForm />
          ) : (
            <div className="auth-configuration" role="status">
              Authentication is not configured. Set both
              <code>TEND_CREATOR_ACCESS_KEY</code> and
              <code>TEND_SESSION_SECRET</code> to distinct values of at least 32
              characters, then restart the server.
            </div>
          )}
          <small>
            Sessions expire after 8 hours. The access key never enters persisted
            community state.
          </small>
        </section>
      </main>
    </div>
  );
}
