import { NextResponse } from "next/server";
import {
  apiError,
  requireCreatorDashboard,
  requireSameOrigin,
} from "@/lib/http";
import { getRepository } from "@/lib/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const invalidOrigin = requireSameOrigin(request);
  if (invalidOrigin) return invalidOrigin;
  const unavailable = await requireCreatorDashboard();
  if (unavailable) return unavailable;
  try {
    const { id } = await context.params;
    return NextResponse.json({
      ok: true,
      snapshot: getRepository().rejectAction(id),
    });
  } catch (error) {
    return apiError(error);
  }
}
