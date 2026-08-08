import { activeEvidence, DEMO_TRIGGER } from "@tend/core";
import { NextResponse } from "next/server";
import { apiError, requireDemoMode, requireSameOrigin } from "@/lib/http";
import { getMindsAdapter, getRepository } from "@/lib/server";

export async function POST(request: Request) {
  const invalidOrigin = requireSameOrigin(request);
  if (invalidOrigin) return invalidOrigin;
  const disabled = requireDemoMode();
  if (disabled) return disabled;
  try {
    const repository = getRepository();
    const snapshot = repository.getSnapshot();
    const result = await getMindsAdapter().analyzeIncident({
      community: snapshot.community,
      tenets: snapshot.tenets,
      activeMemories: activeEvidence(snapshot.memories),
      message: DEMO_TRIGGER,
      conversationContext: [
        { author: "Mina", content: "Kai's new clip is up!", offset: "−1m" },
        { author: "Jules", content: DEMO_TRIGGER, offset: "now" },
      ],
    });
    if (result.status !== "ok") {
      return NextResponse.json(
        { ok: false, error: result.notice, decision: result.decision },
        { status: 503 },
      );
    }
    return NextResponse.json({
      ok: true,
      snapshot: repository.recordDemoIncident(result.decision),
      provider: result.reference.provider,
      notice: result.notice,
    });
  } catch (error) {
    return apiError(error);
  }
}
