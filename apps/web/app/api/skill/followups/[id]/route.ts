import { NextResponse } from "next/server";
import { requireSkillAuth } from "@/lib/http";
import { getRepository } from "@/lib/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const unauthorized = requireSkillAuth(request);
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  const followUp = getRepository().getFollowUp(id);
  if (!followUp) {
    return NextResponse.json(
      { error: "Follow-up not found." },
      { status: 404 },
    );
  }
  return NextResponse.json({ followUp });
}
