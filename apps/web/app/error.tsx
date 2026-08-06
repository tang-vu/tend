"use client";

import { SproutIcon } from "@/components/icons";
import { SiteHeader } from "@/components/site-header";

export default function ErrorState({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="not-found-page">
      <SiteHeader />
      <main id="main-content" role="alert" tabIndex={-1}>
        <SproutIcon />
        <span className="eyebrow">Safe recovery</span>
        <h1>TEND couldn’t load this view.</h1>
        <p>
          No moderation action was executed. Retry, or return to the demo
          controller.
        </p>
        <button className="button button-primary" type="button" onClick={reset}>
          Try again
        </button>
      </main>
    </div>
  );
}
