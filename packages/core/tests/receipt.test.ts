import { describe, expect, it } from "vitest";
import {
  buildDecisionReceipt,
  canonicalReceiptJson,
  type AuditEvent,
  type Community,
  type FollowUp,
  type Incident,
  type MemoryReceipt,
  type ProposedAction,
} from "../src";

const createdAt = "2026-08-11T08:00:00.000Z";
const laterAt = "2026-08-11T08:05:00.000Z";

const community: Community = {
  id: "community-1",
  name: "The Green Room",
  platform: "discord",
  externalGuildId: "guild-secret-reference",
  monitoredChannelIds: ["channel-secret-reference"],
  mode: "demo",
  creatorTone: "Warm and direct",
  autonomyPolicy: {
    autonomousActionTypes: [
      "observe",
      "record_pattern",
      "positive_prompt",
      "complete_followup",
    ],
    alwaysRequireApproval: [
      "public_nudge",
      "private_reminder",
      "moderator_review",
      "recommend_timeout",
      "execute_timeout",
      "delete_message",
    ],
    newMemberGentleFirst: true,
    allowMemberCheckIns: true,
  },
  retentionPolicy: {
    messageExcerptDays: 30,
    auditDays: 365,
    allowMemberDeletionRequest: true,
  },
  createdAt,
  updatedAt: createdAt,
};

const incident: Incident = {
  id: "incident-1",
  communityId: community.id,
  externalMessageId: "discord-message-secret-reference",
  sourceChannelId: "discord-channel-secret-reference",
  actorId: "member-private-reference",
  affectedMemberIds: ["affected-private-reference"],
  messageExcerpt: "That landed harder than intended.",
  conversationContext: [],
  status: "monitoring",
  riskLevel: "medium",
  confidence: 0.91,
  summary: "Repair is appropriate before escalation.",
  reasoning: "An approved boundary memory changes the interpretation.",
  classification: "accidental_harm",
  policyMatches: ["New members receive a gentle first response."],
  memoryReceiptIds: ["memory-used"],
  promptVersion: "moderation-v2",
  createdAt,
  resolvedAt: null,
};

const memories: MemoryReceipt[] = [
  {
    id: "memory-unused",
    communityId: community.id,
    subjectType: "community",
    subjectId: community.id,
    claim: "This evidence was not used.",
    sourceType: "creator_instruction",
    sourceReference: "Creator setup",
    learnedAt: createdAt,
    confidence: 1,
    status: "active",
    whyRelevant: "Not relevant to this incident.",
    mindReference: null,
  },
  {
    id: "memory-used",
    communityId: community.id,
    subjectType: "member",
    subjectId: "member-private-reference",
    claim: "The member asked for direct repair rather than public pressure.",
    sourceType: "member_request",
    sourceReference: "Approved member note",
    learnedAt: createdAt,
    confidence: 1,
    status: "active",
    whyRelevant: "It supports the least invasive effective response.",
    mindReference: "mind-internal-reference",
  },
];

const actions: ProposedAction[] = [
  {
    id: "action-other",
    incidentId: "incident-other",
    type: "observe",
    targetId: null,
    content: "Unrelated action content",
    riskClass: "low",
    requiresApproval: false,
    status: "executed",
    idempotencyKey: "unrelated-effect-key",
    proposedAt: createdAt,
    approvedAt: null,
    executedAt: createdAt,
    executionResult: "recorded",
  },
  {
    id: "action-1",
    incidentId: incident.id,
    type: "private_reminder",
    targetId: "member-private-reference",
    content: "Sensitive intervention content",
    riskClass: "consequential",
    requiresApproval: true,
    status: "approved",
    idempotencyKey: "sensitive-effect-key",
    proposedAt: laterAt,
    approvedAt: laterAt,
    executedAt: null,
    executionResult: null,
  },
];

const followUps: FollowUp[] = [
  {
    id: "follow-up-1",
    incidentId: incident.id,
    dueAt: laterAt,
    purpose: "Check whether the repair held.",
    status: "scheduled",
    attemptCount: 0,
    lastError: null,
    idempotencyKey: "sensitive-follow-up-key",
    createdAt: laterAt,
    completedAt: null,
  },
];

const auditEvents: AuditEvent[] = [
  {
    id: "audit-later",
    communityId: community.id,
    incidentId: incident.id,
    actorType: "creator",
    eventType: "action.approved",
    payloadSummary: "Creator approved the bounded action.",
    occurredAt: laterAt,
  },
  {
    id: "audit-earlier",
    communityId: community.id,
    incidentId: incident.id,
    actorType: "tend",
    eventType: "incident.created",
    payloadSummary: "TEND persisted a reviewable incident.",
    occurredAt: createdAt,
  },
  {
    id: "audit-other",
    communityId: community.id,
    incidentId: "incident-other",
    actorType: "tend",
    eventType: "incident.created",
    payloadSummary: "Unrelated event.",
    occurredAt: createdAt,
  },
];

function makeReceipt() {
  return buildDecisionReceipt({
    community,
    incident,
    memories,
    actions,
    followUps,
    auditEvents,
  });
}

describe("decision receipt", () => {
  it("projects only incident-scoped evidence, effects, continuity, and audit", () => {
    const receipt = makeReceipt();

    expect(receipt.evidence.memoryReceipts.map((memory) => memory.id)).toEqual([
      "memory-used",
    ]);
    expect(receipt.governance.actions.map((action) => action.id)).toEqual([
      "action-1",
    ]);
    expect(receipt.continuity.followUps.map((followUp) => followUp.id)).toEqual(
      ["follow-up-1"],
    );
    expect(receipt.audit.map((event) => event.id)).toEqual([
      "audit-earlier",
      "audit-later",
    ]);
    expect(receipt.governance.unavailableActions).toEqual(["ban", "kick"]);
  });

  it("makes deterministic demo truth and idempotency protection explicit", () => {
    const receipt = makeReceipt();

    expect(receipt.disclosure).toMatchObject({
      judgment: "deterministic_fixture",
      discordEffect: "recorded_only",
      followUpEvidence: "seeded_demo",
    });
    expect(receipt.governance.actions[0]?.idempotencyKeyPresent).toBe(true);
    expect(receipt.continuity.followUps[0]?.idempotencyKeyPresent).toBe(true);
  });

  it("omits raw effect keys, target IDs, integration IDs, and action content", () => {
    const serialized = canonicalReceiptJson(makeReceipt());

    for (const privateValue of [
      "sensitive-effect-key",
      "sensitive-follow-up-key",
      "member-private-reference",
      "guild-secret-reference",
      "discord-message-secret-reference",
      "Sensitive intervention content",
    ]) {
      expect(serialized).not.toContain(privateValue);
    }
  });

  it("canonicalizes equivalent receipts independently of key insertion order", () => {
    const receipt = makeReceipt();
    const reordered = {
      ...receipt,
      community: {
        mode: receipt.community.mode,
        name: receipt.community.name,
        id: receipt.community.id,
      },
    };

    expect(canonicalReceiptJson(reordered)).toBe(canonicalReceiptJson(receipt));
  });
});
