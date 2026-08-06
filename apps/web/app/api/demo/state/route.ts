import { NextResponse } from "next/server";
import { requireCreatorDashboard } from "@/lib/http";
import { getRepository, readiness } from "@/lib/server";

export const dynamic = "force-dynamic";

export function GET() {
  const unavailable = requireCreatorDashboard();
  if (unavailable) return unavailable;
  return NextResponse.json({
    ok: true,
    snapshot: getRepository().getSnapshot(),
    readiness: readiness(),
    serverTime: new Date().toISOString(),
  });
}
