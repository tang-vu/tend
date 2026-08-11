import { NextResponse } from "next/server";
import { createDecisionReceiptEnvelope } from "@/lib/decision-receipt";
import { requireCreatorDashboard } from "@/lib/http";
import { getRepository } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const unavailable = await requireCreatorDashboard();
  if (unavailable) return unavailable;

  const { id } = await context.params;
  const envelope = createDecisionReceiptEnvelope(
    getRepository().getSnapshot(),
    id,
  );
  if (!envelope) {
    return NextResponse.json(
      { ok: false, error: "Incident not found." },
      { status: 404, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const safeId = envelope.receipt.decision.incidentId.replace(
    /[^a-zA-Z0-9_-]/g,
    "-",
  );
  return new Response(`${JSON.stringify(envelope, null, 2)}\n`, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="tend-${safeId}-receipt.json"`,
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
