import { NextResponse } from "next/server";
import { apiError } from "@/lib/http";
import { getRepository } from "@/lib/server";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
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
