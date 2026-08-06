import { NextResponse } from "next/server";
import { requireSkillAuth } from "@/lib/http";
import { getRepository } from "@/lib/server";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const unauthorized = requireSkillAuth(request);
  if (unauthorized) return unauthorized;
  const snapshot = getRepository().getSnapshot();
  const pendingStatuses = new Set([
    "pending_review",
    "awaiting_approval",
    "monitoring",
    "manual_review",
  ]);
  return NextResponse.json({
    incidents: snapshot.incidents.filter((incident) =>
      pendingStatuses.has(incident.status),
    ),
  });
}
