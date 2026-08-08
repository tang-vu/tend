import { NextResponse } from "next/server";
import { requireCreatorDashboard } from "@/lib/http";
import { getRepository, readiness } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const unavailable = await requireCreatorDashboard();
  if (unavailable) return unavailable;
  return NextResponse.json(
    {
      ok: true,
      snapshot: getRepository().getSnapshot(),
      readiness: readiness(),
      serverTime: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
