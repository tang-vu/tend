import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { MemoryManager } from "@/components/memory-manager";
import { LiveDashboardLocked } from "@/components/live-dashboard-locked";
import { creatorDashboardAvailable } from "@/lib/http";
import { getRepository } from "@/lib/server";

export const dynamic = "force-dynamic";

export default async function MemoriesPage() {
  if (!(await creatorDashboardAvailable())) return <LiveDashboardLocked />;
  const snapshot = getRepository().getSnapshot();
  return (
    <DashboardShell
      actions={
        <Link className="button button-primary" href="/demo">
          Teach in demo
        </Link>
      }
      description="An auditable mirror of creator-approved facts. Corrected and archived receipts are excluded from active evidence."
      eyebrow="Memory & tenets"
      title="What TEND has been asked to remember."
    >
      <section className="tenet-strip">
        {snapshot.tenets.map((tenet) => (
          <article key={tenet.id}>
            <span>{tenet.category.replaceAll("_", " ")}</span>
            <h2>{tenet.title}</h2>
            <p>{tenet.statement}</p>
          </article>
        ))}
      </section>
      <div className="section-title-row memory-title">
        <div>
          <span className="eyebrow">Audit controls</span>
          <h2>Memory receipts</h2>
        </div>
        <span>{snapshot.memories.length} total</span>
      </div>
      <MemoryManager initialMemories={snapshot.memories} />
    </DashboardShell>
  );
}
