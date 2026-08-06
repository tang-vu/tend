import { NextResponse } from "next/server";
import { requireDemoMode } from "@/lib/http";
import { getRepository } from "@/lib/server";

export async function POST() {
  const disabled = requireDemoMode();
  if (disabled) return disabled;
  return NextResponse.json({ ok: true, snapshot: getRepository().resetDemo() });
}
