import { z } from "zod";
import {
  actionTypeSchema,
  incidentStatusSchema,
  memoryReceiptStatusSchema,
  riskLevelSchema,
} from "./schema";
import type {
  AuditEvent,
  Community,
  FollowUp,
  Incident,
  MemoryReceipt,
  ProposedAction,
} from "./schema";

const receiptTimestampSchema = z.string().datetime();

export const decisionReceiptSchema = z
  .object({
    schemaVersion: z.literal("tend.decision-receipt.v1"),
    receiptId: z.string().min(1),
    community: z
      .object({
        id: z.string(),
        name: z.string(),
        mode: z.enum(["demo", "live"]),
      })
      .strict(),
    disclosure: z
      .object({
        judgment: z.enum([
          "deterministic_fixture",
          "live_minds_or_manual_review",
        ]),
        discordEffect: z.enum(["recorded_only", "approval_gated_worker"]),
        followUpEvidence: z.enum(["seeded_demo", "live_observation_required"]),
        sharingNotice: z.string(),
      })
      .strict(),
    decision: z
      .object({
        incidentId: z.string(),
        status: incidentStatusSchema,
        classification: z.enum([
          "friendly_banter",
          "accidental_harm",
          "harassment",
          "spam",
          "unresolved_conflict",
          "uncertain",
        ]),
        riskLevel: riskLevelSchema,
        confidence: z.number().min(0).max(1),
        summary: z.string(),
        reasoning: z.string(),
        promptVersion: z.string(),
        messageExcerpt: z.string(),
        untrustedMessageData: z.literal(true),
        createdAt: receiptTimestampSchema,
        resolvedAt: receiptTimestampSchema.nullable(),
      })
      .strict(),
    evidence: z
      .object({
        policyMatches: z.array(z.string()),
        memoryReceipts: z.array(
          z
            .object({
              id: z.string(),
              claim: z.string(),
              sourceType: z.enum([
                "creator_instruction",
                "member_request",
                "incident_outcome",
              ]),
              sourceReference: z.string(),
              learnedAt: receiptTimestampSchema,
              confidence: z.number().min(0).max(1),
              currentStatus: memoryReceiptStatusSchema,
              whyRelevant: z.string(),
              mindReferencePresent: z.boolean(),
            })
            .strict(),
        ),
      })
      .strict(),
    governance: z
      .object({
        unavailableActions: z.tuple([z.literal("ban"), z.literal("kick")]),
        actions: z.array(
          z
            .object({
              id: z.string(),
              type: actionTypeSchema,
              riskClass: z.enum(["low", "consequential"]),
              requiresApproval: z.boolean(),
              status: z.enum([
                "proposed",
                "approved",
                "executing",
                "rejected",
                "executed",
                "failed",
              ]),
              proposedAt: receiptTimestampSchema,
              approvedAt: receiptTimestampSchema.nullable(),
              executedAt: receiptTimestampSchema.nullable(),
              idempotencyKeyPresent: z.boolean(),
            })
            .strict(),
        ),
      })
      .strict(),
    continuity: z
      .object({
        followUps: z.array(
          z
            .object({
              id: z.string(),
              purpose: z.string(),
              status: z.enum([
                "scheduled",
                "claimed",
                "retrying",
                "completed",
                "failed",
              ]),
              dueAt: receiptTimestampSchema,
              attemptCount: z.number().int().nonnegative(),
              createdAt: receiptTimestampSchema,
              completedAt: receiptTimestampSchema.nullable(),
              idempotencyKeyPresent: z.boolean(),
            })
            .strict(),
        ),
      })
      .strict(),
    audit: z.array(
      z
        .object({
          id: z.string(),
          actorType: z.enum(["creator", "tend", "mind", "discord", "worker"]),
          eventType: z.string(),
          payloadSummary: z.string(),
          occurredAt: receiptTimestampSchema,
        })
        .strict(),
    ),
  })
  .strict();

export type DecisionReceipt = z.infer<typeof decisionReceiptSchema>;

export const decisionReceiptEnvelopeSchema = z
  .object({
    exportedAt: receiptTimestampSchema,
    receipt: decisionReceiptSchema,
    integrity: z
      .object({
        algorithm: z.literal("SHA-256"),
        digest: z.string().regex(/^[a-f0-9]{64}$/),
        covers: z.literal("receipt"),
        note: z.string(),
      })
      .strict(),
  })
  .strict();

export type DecisionReceiptEnvelope = z.infer<
  typeof decisionReceiptEnvelopeSchema
>;

export interface DecisionReceiptInput {
  community: Community;
  incident: Incident;
  memories: MemoryReceipt[];
  actions: ProposedAction[];
  followUps: FollowUp[];
  auditEvents: AuditEvent[];
}

export function buildDecisionReceipt(
  input: DecisionReceiptInput,
): DecisionReceipt {
  const { community, incident } = input;
  const memoryById = new Map(
    input.memories.map((memory) => [memory.id, memory] as const),
  );
  const memoryReceipts = incident.memoryReceiptIds.flatMap((receiptId) => {
    const memory = memoryById.get(receiptId);
    if (!memory) return [];
    return [
      {
        id: memory.id,
        claim: memory.claim,
        sourceType: memory.sourceType,
        sourceReference: memory.sourceReference,
        learnedAt: memory.learnedAt,
        confidence: memory.confidence,
        currentStatus: memory.status,
        whyRelevant: memory.whyRelevant,
        mindReferencePresent: memory.mindReference !== null,
      },
    ];
  });

  return decisionReceiptSchema.parse({
    schemaVersion: "tend.decision-receipt.v1",
    receiptId: `receipt:${incident.id}`,
    community: {
      id: community.id,
      name: community.name,
      mode: community.mode,
    },
    disclosure: {
      judgment:
        community.mode === "demo"
          ? "deterministic_fixture"
          : "live_minds_or_manual_review",
      discordEffect:
        community.mode === "demo" ? "recorded_only" : "approval_gated_worker",
      followUpEvidence:
        community.mode === "demo" ? "seeded_demo" : "live_observation_required",
      sharingNotice:
        "Creator governance artifact. It contains a bounded community-message excerpt and approved memory evidence; review before sharing.",
    },
    decision: {
      incidentId: incident.id,
      status: incident.status,
      classification: incident.classification,
      riskLevel: incident.riskLevel,
      confidence: incident.confidence,
      summary: incident.summary,
      reasoning: incident.reasoning,
      promptVersion: incident.promptVersion,
      messageExcerpt: incident.messageExcerpt,
      untrustedMessageData: true,
      createdAt: incident.createdAt,
      resolvedAt: incident.resolvedAt,
    },
    evidence: {
      policyMatches: incident.policyMatches,
      memoryReceipts,
    },
    governance: {
      unavailableActions: ["ban", "kick"],
      actions: input.actions
        .filter((action) => action.incidentId === incident.id)
        .sort((left, right) => left.proposedAt.localeCompare(right.proposedAt))
        .map((action) => ({
          id: action.id,
          type: action.type,
          riskClass: action.riskClass,
          requiresApproval: action.requiresApproval,
          status: action.status,
          proposedAt: action.proposedAt,
          approvedAt: action.approvedAt,
          executedAt: action.executedAt,
          idempotencyKeyPresent: action.idempotencyKey.length > 0,
        })),
    },
    continuity: {
      followUps: input.followUps
        .filter((followUp) => followUp.incidentId === incident.id)
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
        .map((followUp) => ({
          id: followUp.id,
          purpose: followUp.purpose,
          status: followUp.status,
          dueAt: followUp.dueAt,
          attemptCount: followUp.attemptCount,
          createdAt: followUp.createdAt,
          completedAt: followUp.completedAt,
          idempotencyKeyPresent: followUp.idempotencyKey.length > 0,
        })),
    },
    audit: input.auditEvents
      .filter((event) => event.incidentId === incident.id)
      .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt))
      .map((event) => ({
        id: event.id,
        actorType: event.actorType,
        eventType: event.eventType,
        payloadSummary: event.payloadSummary,
        occurredAt: event.occurredAt,
      })),
  });
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) {
      throw new TypeError("Decision receipt contains a non-JSON value.");
    }
    return serialized;
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalize(item)).join(",")}]`;
  }
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object)
    .filter((key) => object[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize(object[key])}`)
    .join(",")}}`;
}

export function canonicalReceiptJson(receipt: DecisionReceipt): string {
  return canonicalize(decisionReceiptSchema.parse(receipt));
}
