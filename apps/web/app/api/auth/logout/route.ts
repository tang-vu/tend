import { NextResponse } from "next/server";
import { endCreatorSession } from "@/lib/creator-auth";
import { requireSameOrigin } from "@/lib/http";

export async function POST(request: Request) {
  const invalidOrigin = requireSameOrigin(request);
  if (invalidOrigin) return invalidOrigin;
  await endCreatorSession();
  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
