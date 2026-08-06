import Link from "next/link";
import { SproutIcon } from "@/components/icons";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <div className="not-found-page">
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <SproutIcon />
        <span className="eyebrow">Not found</span>
        <h1>This path hasn’t grown yet.</h1>
        <p>The incident may have been removed by a demo reset.</p>
        <Link className="button button-primary" href="/demo">
          Return to the demo
        </Link>
      </main>
    </div>
  );
}
