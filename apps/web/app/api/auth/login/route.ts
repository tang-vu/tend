import { z } from "zod";
import { NextResponse } from "next/server";
import {
  constantTimeSecretMatches,
  readCreatorAuthConfig,
} from "@/lib/creator-auth-core";
import { startCreatorSession } from "@/lib/creator-auth";
import { requireSameOrigin } from "@/lib/http";
import { creatorLoginLimiter, loginClientKey } from "@/lib/login-rate-limit";

const loginSchema = z.object({
  accessKey: z.string().min(1).max(512),
});

export async function POST(request: Request) {
  if (process.env.TEND_MODE !== "live") {
    return NextResponse.json(
      { ok: false, error: "Creator sign-in is only used in live mode." },
      { status: 409 },
    );
  }
  const invalidOrigin = requireSameOrigin(request);
  if (invalidOrigin) return invalidOrigin;
  const config = readCreatorAuthConfig(process.env);
  if (!config) {
    return NextResponse.json(
      { ok: false, error: "Creator authentication is not configured." },
      { status: 503 },
    );
  }

  const clientKey = loginClientKey(request);
  const retryAfter = creatorLoginLimiter.retryAfterSeconds(clientKey);
  if (retryAfter > 0) {
    return NextResponse.json(
      { ok: false, error: "Too many sign-in attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  const supplied = parsed.success ? parsed.data.accessKey : "";
  if (!constantTimeSecretMatches(supplied, config.accessKey)) {
    creatorLoginLimiter.recordFailure(clientKey);
    return NextResponse.json(
      { ok: false, error: "Invalid creator credentials." },
      { status: 401 },
    );
  }

  creatorLoginLimiter.reset(clientKey);
  if (!(await startCreatorSession())) {
    return NextResponse.json(
      { ok: false, error: "Creator authentication is not configured." },
      { status: 503 },
    );
  }
  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
