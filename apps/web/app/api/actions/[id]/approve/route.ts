import { NextResponse } from "next/server";
import {
  apiError,
  requireCreatorDashboard,
  requireSameOrigin,
} from "@/lib/http";
import { ensureLocalWorker, getRepository } from "@/lib/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const invalidOrigin = requireSameOrigin(request);
  if (invalidOrigin) return invalidOrigin;
  const unavailable = await requireCreatorDashboard();
  if (unavailable) return unavailable;
  try {
    const { id } = await context.params;
    const payload = (await request.json().catch(() => ({}))) as {
      content?: unknown;
    };
    const repository = getRepository();
    if (typeof payload.content === "string") {
      repository.editActionContent(id, payload.content);
    }
    const demoSafeExecution = process.env.TEND_MODE !== "live";
    const factor = Math.max(
      0.1,
      Number(process.env.DEMO_ACCELERATION_FACTOR ?? 1),
    );
    const delayMs = demoSafeExecution
      ? Math.round(12_000 / factor)
      : 30 * 60_000;
    const snapshot = repository.approveAction(
      id,
      delayMs,
      new Date(),
      demoSafeExecution,
    );
    ensureLocalWorker();
    return NextResponse.json({ ok: true, snapshot, delayMs });
  } catch (error) {
    return apiError(error);
  }
}
