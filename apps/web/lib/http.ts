import "server-only";

import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { creatorAuthConfigured, readCreatorSession } from "./creator-auth";

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

export async function creatorDashboardAvailable(): Promise<boolean> {
  if (process.env.TEND_MODE !== "live") return true;
  return (await readCreatorSession()) !== null;
}

export async function requireCreatorDashboard(): Promise<Response | null> {
  if (process.env.TEND_MODE !== "live") return null;
  if (!creatorAuthConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: "Creator authentication is not configured on this server.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!(await readCreatorSession())) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  return null;
}

export function requireSameOrigin(request: Request): Response | null {
  const suppliedOrigin = request.headers.get("origin");
  const configuredOrigin = process.env.TEND_PUBLIC_ORIGIN;
  try {
    const expectedOrigin = new URL(configuredOrigin ?? request.url).origin;
    if (suppliedOrigin && new URL(suppliedOrigin).origin === expectedOrigin)
      return null;
  } catch {
    // Invalid or absent origins fail closed.
  }
  return NextResponse.json(
    { ok: false, error: "Invalid request origin." },
    { status: 403 },
  );
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
