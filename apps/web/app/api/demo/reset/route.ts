import { NextResponse } from "next/server";
import { requireDemoMode, requireSameOrigin } from "@/lib/http";
import { getRepository } from "@/lib/server";

export async function POST(request: Request) {
  const invalidOrigin = requireSameOrigin(request);
  if (invalidOrigin) return invalidOrigin;
  const disabled = requireDemoMode();
  if (disabled) return disabled;
  return NextResponse.json({ ok: true, snapshot: getRepository().resetDemo() });
}
