import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, requireSkillAuth } from "@/lib/http";
import { getRepository } from "@/lib/server";

const inputSchema = z.object({
  outcome: z.enum(["resolved", "manual_review"]),
  summary: z.string().min(3).max(1_000),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const unauthorized = requireSkillAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const { id } = await context.params;
    const input = inputSchema.parse(await request.json());
    const incident = getRepository().recordIncidentOutcome(
      id,
      input.outcome,
      input.summary,
    );
    return NextResponse.json({ incident, destructiveActionOccurred: false });
  } catch (error) {
    return apiError(error);
  }
}
