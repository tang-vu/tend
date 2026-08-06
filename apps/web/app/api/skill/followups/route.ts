import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, requireSkillAuth } from "@/lib/http";
import { getRepository } from "@/lib/server";

const inputSchema = z.object({
  incidentId: z.string().min(1),
  dueAt: z.string().datetime(),
  purpose: z.string().min(3).max(1_000),
});

export async function POST(request: Request) {
  const unauthorized = requireSkillAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const input = inputSchema.parse(await request.json());
    const followUp = getRepository().scheduleFollowUp({
      incidentId: input.incidentId,
      dueAt: new Date(input.dueAt),
      purpose: input.purpose,
    });
    return NextResponse.json({ followUp, persisted: true });
  } catch (error) {
    return apiError(error);
  }
}
