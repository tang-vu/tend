import "server-only";

import { timingSafeEqual } from "node:crypto";
import { creatorDashboardEnabled } from "@tend/core";
import { NextResponse } from "next/server";

function bearerMatches(request: Request, expected: string): boolean {
  const supplied = request.headers.get("authorization") ?? "";
  const expectedHeader = `Bearer ${expected}`;
  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expectedHeader);
  return (
    suppliedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(suppliedBuffer, expectedBuffer)
  );
}

export function requireDemoMode(): Response | null {
  if (process.env.TEND_MODE === "live") {
    return NextResponse.json(
      {
        ok: false,
        error: "Demo seed and reset operations are disabled in live mode.",
      },
      { status: 409 },
    );
  }
  return null;
}

export function creatorDashboardAvailable(): boolean {
  return creatorDashboardEnabled(process.env.TEND_MODE);
}

export function requireCreatorDashboard(): Response | null {
  if (!creatorDashboardAvailable()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Creator dashboard access is disabled in live mode until authentication is configured.",
      },
      { status: 503 },
    );
  }
  return null;
}

export function apiError(error: unknown, status = 400) {
  const message =
    error instanceof Error ? error.message : "Unexpected request failure.";
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function requireSkillAuth(request: Request): Response | null {
  const expected = process.env.TEND_SKILL_API_KEY;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "TEND Skill API is not configured on this server." },
      { status: 503 },
    );
  }
  if (!bearerMatches(request, expected)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized." },
      { status: 401 },
    );
  }
  return null;
}

export function requireWorkerAuth(request: Request): Response | null {
  const expected = process.env.TEND_WORKER_API_KEY;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "Internal worker API is not configured." },
      { status: 503 },
    );
  }
  if (!bearerMatches(request, expected)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized." },
      { status: 401 },
    );
  }
  return null;
}
