import { memoryReceiptStatusSchema } from "@tend/core";
import { NextResponse } from "next/server";
import {
  apiError,
  requireCreatorDashboard,
  requireSameOrigin,
} from "@/lib/http";
import { getRepository } from "@/lib/server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const invalidOrigin = requireSameOrigin(request);
  if (invalidOrigin) return invalidOrigin;
  const unavailable = await requireCreatorDashboard();
  if (unavailable) return unavailable;
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as unknown;
    const status = memoryReceiptStatusSchema.parse(
      typeof payload === "object" && payload && "status" in payload
        ? (payload as { status: unknown }).status
        : null,
    );
    return NextResponse.json({
      ok: true,
      snapshot: getRepository().updateMemoryStatus(id, status),
    });
  } catch (error) {
    return apiError(error);
  }
}
