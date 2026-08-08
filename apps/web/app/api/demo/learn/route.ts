import { DEMO_IDS, DEMO_TEACHING } from "@tend/core";
import { NextResponse } from "next/server";
import { apiError, requireDemoMode, requireSameOrigin } from "@/lib/http";
import { getMindsAdapter, getRepository } from "@/lib/server";

export async function POST(request: Request) {
  const invalidOrigin = requireSameOrigin(request);
  if (invalidOrigin) return invalidOrigin;
  const disabled = requireDemoMode();
  if (disabled) return disabled;
  try {
    const adapter = getMindsAdapter();
    const reference = await adapter.teach({
      communityId: DEMO_IDS.community,
      statement: DEMO_TEACHING,
    });
    return NextResponse.json({
      ok: true,
      snapshot: getRepository().learnDemo(),
      provider: reference.provider,
      notice:
        reference.provider === "mock"
          ? "Demo fixture acknowledged; no live Minds call occurred."
          : "Creator context sent to the configured Mind.",
    });
  } catch (error) {
    return apiError(error, 503);
  }
}
