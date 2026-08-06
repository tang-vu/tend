import { actionTypeSchema, evaluateActionPolicy } from "@tend/core";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, requireSkillAuth } from "@/lib/http";
import { getRepository } from "@/lib/server";

const safeSkillActionSchema = actionTypeSchema.exclude([
  "execute_timeout",
  "delete_message",
]);
const inputSchema = z.object({
  incidentId: z.string().min(1),
  type: safeSkillActionSchema,
  targetId: z.string().min(1).nullable(),
  content: z.string().min(3).max(2_000),
  idempotencyKey: z
    .string()
    .min(8)
    .max(200)
    .regex(/^[a-zA-Z0-9:_-]+$/),
});

export async function POST(request: Request) {
  const unauthorized = requireSkillAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const input = inputSchema.parse(await request.json());
    const repository = getRepository();
    const snapshot = repository.getSnapshot();
    const incident = snapshot.incidents.find(
      (item) => item.id === input.incidentId,
    );
    if (!incident) throw new Error("Incident not found.");
    const policy = evaluateActionPolicy(
      input.type,
      snapshot.community.autonomyPolicy,
      incident.confidence,
    );
    if (!policy.allowed) throw new Error(policy.reason);
    const proposal = repository.proposeAction({
      incidentId: input.incidentId,
      type: input.type,
      targetId: input.targetId,
      content: input.content,
      requiresApproval: policy.requiresApproval,
      idempotencyKey: `skill:proposal:${input.idempotencyKey}`,
    });
    return NextResponse.json({
      proposal,
      policyReason: policy.reason,
      executionOccurred: false,
    });
  } catch (error) {
    return apiError(error);
  }
}
