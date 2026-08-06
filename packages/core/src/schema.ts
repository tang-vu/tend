import { z } from "zod";

export const modeSchema = z.enum(["demo", "live"]);
export type TendMode = z.infer<typeof modeSchema>;

export const autonomyPolicySchema = z.object({
  autonomousActionTypes: z.array(
    z.enum([
      "observe",
      "record_pattern",
      "positive_prompt",
      "complete_followup",
    ]),
  ),
  alwaysRequireApproval: z.array(
    z.enum([
      "public_nudge",
      "private_reminder",
      "moderator_review",
      "recommend_timeout",
      "execute_timeout",
      "delete_message",
    ]),
  ),
  newMemberGentleFirst: z.boolean(),
  allowMemberCheckIns: z.boolean(),
});
export type AutonomyPolicy = z.infer<typeof autonomyPolicySchema>;

export const retentionPolicySchema = z.object({
  messageExcerptDays: z.number().int().min(1).max(365),
  auditDays: z.number().int().min(1).max(3650),
  allowMemberDeletionRequest: z.boolean(),
});
export type RetentionPolicy = z.infer<typeof retentionPolicySchema>;

export const communitySchema = z.object({
  id: z.string(),
  name: z.string(),
  platform: z.enum(["discord"]),
  externalGuildId: z.string().nullable(),
  monitoredChannelIds: z.array(z.string()),
  mode: modeSchema,
  creatorTone: z.string(),
  autonomyPolicy: autonomyPolicySchema,
  retentionPolicy: retentionPolicySchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Community = z.infer<typeof communitySchema>;

export const communityTenetSchema = z.object({
  id: z.string(),
  communityId: z.string(),
  title: z.string(),
  statement: z.string(),
  category: z.enum(["value", "written_rule", "unwritten_norm", "escalation"]),
  source: z.string(),
  active: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type CommunityTenet = z.infer<typeof communityTenetSchema>;

export const memberProfileSchema = z.object({
  id: z.string(),
  communityId: z.string(),
  externalMemberId: z.string().nullable(),
  displayName: z.string(),
  privacyStatus: z.enum(["standard", "opted_out", "deletion_requested"]),
  approvedNotes: z.array(z.string()),
  isNewMember: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type MemberProfile = z.infer<typeof memberProfileSchema>;

export const memoryReceiptStatusSchema = z.enum([
  "active",
  "corrected",
  "archived",
]);
export const memoryReceiptSchema = z.object({
  id: z.string(),
  communityId: z.string(),
  subjectType: z.enum(["community", "member", "policy"]),
  subjectId: z.string(),
  claim: z.string(),
  sourceType: z.enum([
    "creator_instruction",
    "member_request",
    "incident_outcome",
  ]),
  sourceReference: z.string(),
  learnedAt: z.string().datetime(),
  confidence: z.number().min(0).max(1),
  status: memoryReceiptStatusSchema,
  whyRelevant: z.string(),
  mindReference: z.string().nullable(),
});
export type MemoryReceipt = z.infer<typeof memoryReceiptSchema>;

export const riskLevelSchema = z.enum(["low", "medium", "high", "critical"]);
export type RiskLevel = z.infer<typeof riskLevelSchema>;

export const incidentStatusSchema = z.enum([
  "pending_review",
  "awaiting_approval",
  "monitoring",
  "resolved",
  "manual_review",
]);
export const incidentSchema = z.object({
  id: z.string(),
  communityId: z.string(),
  externalMessageId: z.string(),
  actorId: z.string(),
  affectedMemberIds: z.array(z.string()),
  messageExcerpt: z.string(),
  conversationContext: z.array(
    z.object({
      author: z.string(),
      content: z.string(),
      offset: z.string(),
    }),
  ),
  status: incidentStatusSchema,
  riskLevel: riskLevelSchema,
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  reasoning: z.string(),
  classification: z.enum([
    "friendly_banter",
    "accidental_harm",
    "harassment",
    "spam",
    "unresolved_conflict",
    "uncertain",
  ]),
  policyMatches: z.array(z.string()),
  memoryReceiptIds: z.array(z.string()),
  promptVersion: z.string(),
  createdAt: z.string().datetime(),
  resolvedAt: z.string().datetime().nullable(),
});
export type Incident = z.infer<typeof incidentSchema>;

export const actionTypeSchema = z.enum([
  "observe",
  "record_pattern",
  "public_nudge",
  "private_reminder",
  "moderator_review",
  "recommend_timeout",
  "execute_timeout",
  "delete_message",
  "positive_prompt",
]);
export type ActionType = z.infer<typeof actionTypeSchema>;

export const proposedActionSchema = z.object({
  id: z.string(),
  incidentId: z.string(),
  type: actionTypeSchema,
  targetId: z.string().nullable(),
  content: z.string(),
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
  idempotencyKey: z.string(),
  proposedAt: z.string().datetime(),
  approvedAt: z.string().datetime().nullable(),
  executedAt: z.string().datetime().nullable(),
  executionResult: z.string().nullable(),
});
export type ProposedAction = z.infer<typeof proposedActionSchema>;

export const followUpSchema = z.object({
  id: z.string(),
  incidentId: z.string(),
  dueAt: z.string().datetime(),
  purpose: z.string(),
  status: z.enum(["scheduled", "claimed", "retrying", "completed", "failed"]),
  attemptCount: z.number().int().nonnegative(),
  lastError: z.string().nullable(),
  idempotencyKey: z.string(),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
});
export type FollowUp = z.infer<typeof followUpSchema>;

export const auditEventSchema = z.object({
  id: z.string(),
  communityId: z.string(),
  incidentId: z.string().nullable(),
  actorType: z.enum(["creator", "tend", "mind", "discord", "worker"]),
  eventType: z.string(),
  payloadSummary: z.string(),
  occurredAt: z.string().datetime(),
});
export type AuditEvent = z.infer<typeof auditEventSchema>;

export const mindDecisionSchema = z.object({
  summary: z.string(),
  classification: incidentSchema.shape.classification,
  riskLevel: riskLevelSchema,
  confidence: z.number().min(0).max(1),
  needsHumanReview: z.boolean(),
  policyMatches: z.array(z.string()),
  memoryReceipts: z.array(
    z.object({
      receiptId: z.string(),
      influence: z.string(),
    }),
  ),
  proposedActions: z.array(
    z.object({
      type: actionTypeSchema,
      targetId: z.string().nullable(),
      content: z.string(),
      rationale: z.string(),
    }),
  ),
  followUps: z.array(
    z.object({
      purpose: z.string(),
      delayMinutes: z.number().nonnegative(),
    }),
  ),
  reasoningForModerator: z.string(),
  uncertainties: z.array(z.string()),
});
export type MindDecision = z.infer<typeof mindDecisionSchema>;

export const demoPhaseSchema = z.enum([
  "ready",
  "learned",
  "incident",
  "scheduled",
  "resolved",
]);
export type DemoPhase = z.infer<typeof demoPhaseSchema>;

export const impactMetricsSchema = z.object({
  incidentsReviewed: z.number().int().nonnegative(),
  lowRiskResolvedWithoutPunishment: z.number().int().nonnegative(),
  approvalsStreamlined: z.number().int().nonnegative(),
  medianResponseSeconds: z.number().nonnegative(),
  followUpsCompleted: z.number().int().nonnegative(),
  repeatConflictRate: z.number().min(0).max(1),
  estimatedModeratorMinutesSaved: z.number().nonnegative(),
  isDemoData: z.boolean(),
});
export type ImpactMetrics = z.infer<typeof impactMetricsSchema>;
