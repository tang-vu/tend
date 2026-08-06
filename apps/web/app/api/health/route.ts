import { NextResponse } from "next/server";
import { getRepository } from "@/lib/server";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    const snapshot = getRepository().getSnapshot();
    return NextResponse.json(
      {
        ok: true,
        service: "tend-web",
        mode: snapshot.community.mode,
        persistence: "ready",
      },
      {
        headers: { "cache-control": "no-store" },
      },
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        service: "tend-web",
        persistence: "unavailable",
      },
      {
        status: 503,
        headers: { "cache-control": "no-store" },
      },
    );
  }
}
