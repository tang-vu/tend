import { NextResponse } from "next/server";
import { getRepository, readiness } from "@/lib/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    ok: true,
    snapshot: getRepository().getSnapshot(),
    readiness: readiness(),
    serverTime: new Date().toISOString(),
  });
}
