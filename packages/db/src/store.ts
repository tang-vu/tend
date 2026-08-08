import { randomUUID } from "node:crypto";
import {
  auditEventSchema,
  communitySchema,
  communityTenetSchema,
  DEMO_IDS,
  demoPhaseSchema,
  followUpSchema,
  impactMetricsSchema,
  incidentSchema,
  memberProfileSchema,
  memoryReceiptSchema,
  proposedActionSchema,
  TEND_PROMPT_VERSION,
  type AuditEvent,
  type ActionType,
  type Community,
  type CommunityTenet,
  type DemoPhase,
  type FollowUp,
  type ImpactMetrics,
  type Incident,
  type MemberProfile,
  type MemoryReceipt,
  type MindDecision,
  type ProposedAction,
} from "@tend/core";
import type { TendDatabase } from "./database";

type Row = Record<string, unknown>;

function parseJson<T>(value: unknown): T {
  if (typeof value !== "string")
    throw new Error("Expected persisted JSON text");
  return JSON.parse(value) as T;
}

function bool(value: unknown): boolean {
  return value === 1;
}

function communityFromRow(row: Row): Community {
  return communitySchema.parse({
    id: row.id,
    name: row.name,
    platform: row.platform,
    externalGuildId: row.external_guild_id,
    monitoredChannelIds: parseJson(row.monitored_channel_ids),
    mode: row.mode,
    creatorTone: row.creator_tone,
    autonomyPolicy: parseJson(row.autonomy_policy),
    retentionPolicy: parseJson(row.retention_policy),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function tenetFromRow(row: Row): CommunityTenet {
  return communityTenetSchema.parse({
    id: row.id,
    communityId: row.community_id,
    title: row.title,
    statement: row.statement,
    category: row.category,
    source: row.source,
    active: bool(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function memberFromRow(row: Row): MemberProfile {
  return memberProfileSchema.parse({
    id: row.id,
    communityId: row.community_id,
    externalMemberId: row.external_member_id,
    displayName: row.display_name,
    privacyStatus: row.privacy_status,
    approvedNotes: parseJson(row.approved_notes),
    isNewMember: bool(row.is_new_member),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function memoryFromRow(row: Row): MemoryReceipt {
  return memoryReceiptSchema.parse({
    id: row.id,
    communityId: row.community_id,
    subjectType: row.subject_type,
    subjectId: row.subject_id,
    claim: row.claim,
    sourceType: row.source_type,
    sourceReference: row.source_reference,
    learnedAt: row.learned_at,
    confidence: row.confidence,
    status: row.status,
    whyRelevant: row.why_relevant,
    mindReference: row.mind_reference,
  });
}

function incidentFromRow(row: Row): Incident {
  return incidentSchema.parse({
    id: row.id,
    communityId: row.community_id,
    externalMessageId: row.external_message_id,
    sourceChannelId: row.source_channel_id ?? null,
    actorId: row.actor_id,
    affectedMemberIds: parseJson(row.affected_member_ids),
    messageExcerpt: row.message_excerpt,
    conversationContext: parseJson(row.conversation_context),
    status: row.status,
    riskLevel: row.risk_level,
    confidence: row.confidence,
    summary: row.summary,
    reasoning: row.reasoning,
    classification: row.classification,
    policyMatches: parseJson(row.policy_matches),
    memoryReceiptIds: parseJson(row.memory_receipt_ids),
    promptVersion: row.prompt_version,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  });
}

function actionFromRow(row: Row): ProposedAction {
  return proposedActionSchema.parse({
    id: row.id,
    incidentId: row.incident_id,
    type: row.type,
    targetId: row.target_id,
    content: row.content,
    riskClass: row.risk_class,
    requiresApproval: bool(row.requires_approval),
    status: row.status,
    idempotencyKey: row.idempotency_key,
    proposedAt: row.proposed_at,
    approvedAt: row.approved_at,
    executedAt: row.executed_at,
    executionResult: row.execution_result,
  });
}

function followUpFromRow(row: Row): FollowUp {
  return followUpSchema.parse({
    id: row.id,
    incidentId: row.incident_id,
    dueAt: row.due_at,
    purpose: row.purpose,
    status: row.status,
    attemptCount: row.attempt_count,
    lastError: row.last_error,
    idempotencyKey: row.idempotency_key,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  });
}

function auditFromRow(row: Row): AuditEvent {
  return auditEventSchema.parse({
    id: row.id,
    communityId: row.community_id,
    incidentId: row.incident_id,
    actorType: row.actor_type,
    eventType: row.event_type,
    payloadSummary: row.payload_summary,
    occurredAt: row.occurred_at,
  });
}

export interface CommunityPulse {
  id: string;
  communityId: string;
  headline: string;
  summary: string;
  positivePrompt: string;
  createdAt: string;
}

export interface FollowUpCompletion {
  incidentStatus: "resolved" | "manual_review";
  evidenceKind: "seeded_demo" | "live_observation";
  summary: string;
  headline?: string;
  positivePrompt?: string;
  evidenceReference?: {
    provider: "live";
    conversationAlias: string | null;
    responseFingerprint: string | null;
    promptVersion: string;
    observedMessageCount: number;
  };
}

export interface FollowUpContext {
  followUp: FollowUp;
  incident: Incident;
  community: Community;
  tenets: CommunityTenet[];
  activeMemories: MemoryReceipt[];
}

export interface TendSnapshot {
  community: Community;
  tenets: CommunityTenet[];
  members: MemberProfile[];
  memories: MemoryReceipt[];
  incidents: Incident[];
  actions: ProposedAction[];
  followUps: FollowUp[];
  auditEvents: AuditEvent[];
  pulse: CommunityPulse | null;
  demoPhase: DemoPhase;
  metrics: ImpactMetrics;
}

export interface TendRepository {
  resetDemo(now?: Date): TendSnapshot;
  getSnapshot(): TendSnapshot;
  learnDemo(now?: Date): TendSnapshot;
  recordDemoIncident(decision: MindDecision, now?: Date): TendSnapshot;
  editActionContent(
    actionId: string,
    content: string,
    now?: Date,
  ): TendSnapshot;
  approveAction(
    actionId: string,
    demoDelayMs: number,
    now?: Date,
    demoSafeExecution?: boolean,
  ): TendSnapshot;
  rejectAction(actionId: string, now?: Date): TendSnapshot;
  updateMemoryStatus(
    receiptId: string,
    status: "active" | "corrected" | "archived",
    now?: Date,
  ): TendSnapshot;
  claimNextDue(now?: Date): FollowUp | null;
  completeFollowUp(
    followUpId: string,
    completion: FollowUpCompletion,
    now?: Date,
  ): void;
  retryFollowUp(
    followUpId: string,
    error: string,
    nextDueAt: Date,
    now?: Date,
  ): void;
  failFollowUp(followUpId: string, error: string, now?: Date): void;
  hasProcessedMessage(externalMessageId: string): boolean;
  markMessageProcessed(
    externalMessageId: string,
    communityId: string,
    now?: Date,
  ): boolean;
  proposeAction(
    input: {
      incidentId: string;
      type: Exclude<ActionType, "execute_timeout" | "delete_message">;
      targetId: string | null;
      content: string;
      requiresApproval: boolean;
      idempotencyKey: string;
    },
    now?: Date,
  ): ProposedAction;
  scheduleFollowUp(
    input: {
      incidentId: string;
      dueAt: Date;
      purpose: string;
      idempotencyKey: string;
    },
    now?: Date,
  ): FollowUp;
  recordIncidentOutcome(
    incidentId: string,
    outcome: "resolved" | "manual_review",
    summary: string,
    now?: Date,
  ): Incident;
  getFollowUp(followUpId: string): FollowUp | null;
  getFollowUpContext(followUpId: string): FollowUpContext | null;
  recordAnalyzedIncident(
    input: {
      externalMessageId: string;
      sourceChannelId?: string | null;
      actorId: string;
      messageExcerpt: string;
      conversationContext: Array<{
        author: string;
        content: string;
        offset: string;
      }>;
      decision: MindDecision;
      forceManualReview: boolean;
      analysisReference?: {
        provider: "mock" | "live" | "unavailable";
        conversationAlias: string | null;
        responseFingerprint: string | null;
        promptVersion: string;
      };
    },
    now?: Date,
  ): Incident;
  claimNextApprovedAction(): ProposedAction | null;
  markActionExecuted(actionId: string, result: string, now?: Date): void;
  markActionFailed(actionId: string, result: string, now?: Date): void;
}

export class SqliteTendRepository implements TendRepository {
  constructor(private readonly database: TendDatabase) {}

  private initializeLive(now = new Date()): TendSnapshot {
    const timestamp = now.toISOString();
    const communityId = "community-live-tend";
    const monitoredChannels = (process.env.DISCORD_ALLOWED_CHANNEL_IDS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const initialize = this.database.transaction(() => {
      this.database
        .prepare(
          `INSERT INTO communities (
            id, name, platform, external_guild_id, monitored_channel_ids, mode, creator_tone,
            autonomy_policy, retention_policy, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, 'live', ?, ?, ?, ?, ?)`,
        )
        .run(
          communityId,
          "TEND Live Community",
          "discord",
          process.env.DISCORD_GUILD_ID ?? null,
          JSON.stringify(monitoredChannels),
          "Warm, direct, private-first, and restorative.",
          JSON.stringify({
            autonomousActionTypes: ["observe", "record_pattern"],
            alwaysRequireApproval: [
              "public_nudge",
              "private_reminder",
              "moderator_review",
              "recommend_timeout",
              "execute_timeout",
              "delete_message",
            ],
            newMemberGentleFirst: true,
            allowMemberCheckIns: false,
          }),
          JSON.stringify({
            messageExcerptDays: 30,
            auditDays: 180,
            allowMemberDeletionRequest: true,
          }),
          timestamp,
          timestamp,
        );
      this.database
        .prepare(
          `INSERT INTO community_tenets (
            id, community_id, title, statement, category, source, active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        )
        .run(
          "tenet-live-human-authority",
          communityId,
          "Consequential actions need a person",
          "Deletion, restriction, and member contact require explicit creator approval.",
          "escalation",
          "TEND safety baseline",
          timestamp,
          timestamp,
        );
      this.insertAudit(
        communityId,
        null,
        "tend",
        "community.live_initialized",
        "Live community storage initialized from server-side guild and channel configuration; no demo members or memories were created.",
        timestamp,
      );
    });
    initialize();
    return this.getSnapshot();
  }

  resetDemo(now = new Date()): TendSnapshot {
    const timestamp = now.toISOString();
    const reset = this.database.transaction(() => {
      for (const table of [
        "processed_messages",
        "community_pulses",
        "audit_events",
        "follow_ups",
        "proposed_actions",
        "incidents",
        "memory_receipts",
        "member_profiles",
        "community_tenets",
        "demo_state",
        "communities",
      ]) {
        this.database.prepare(`DELETE FROM ${table}`).run();
      }

      this.database
        .prepare(
          `INSERT INTO communities (
            id, name, platform, external_guild_id, monitored_channel_ids, mode, creator_tone,
            autonomy_policy, retention_policy, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          DEMO_IDS.community,
          "The Green Room",
          "discord",
          null,
          JSON.stringify(["demo-stage"]),
          "demo",
          "Warm, direct, private-first, and never punitive for its own sake.",
          JSON.stringify({
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
          }),
          JSON.stringify({
            messageExcerptDays: 30,
            auditDays: 180,
            allowMemberDeletionRequest: true,
          }),
          timestamp,
          timestamp,
        );

      const insertMember = this.database.prepare(
        `INSERT INTO member_profiles (
          id, community_id, external_member_id, display_name, privacy_status, approved_notes,
          is_new_member, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      insertMember.run(
        DEMO_IDS.kai,
        DEMO_IDS.community,
        "demo-kai",
        "Kai",
        "standard",
        "[]",
        0,
        timestamp,
        timestamp,
      );
      insertMember.run(
        DEMO_IDS.jules,
        DEMO_IDS.community,
        "demo-jules",
        "Jules",
        "standard",
        "[]",
        1,
        timestamp,
        timestamp,
      );

      const insertTenet = this.database.prepare(
        `INSERT INTO community_tenets (
          id, community_id, title, statement, category, source, active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      insertTenet.run(
        "tenet-restorative",
        DEMO_IDS.community,
        "Repair before punishment",
        "Use the least invasive intervention that can restore community health.",
        "value",
        "Onboarding",
        1,
        timestamp,
        timestamp,
      );
      insertTenet.run(
        "tenet-human-enforcement",
        DEMO_IDS.community,
        "Consequential actions need a person",
        "Deletion, restriction, and other consequential actions require explicit creator approval.",
        "escalation",
        "TEND safety baseline",
        1,
        timestamp,
        timestamp,
      );
      this.database
        .prepare(
          "INSERT INTO demo_state (community_id, phase, updated_at) VALUES (?, ?, ?)",
        )
        .run(DEMO_IDS.community, "ready", timestamp);
      this.insertAudit(
        DEMO_IDS.community,
        null,
        "creator",
        "demo.reset",
        "Demo scenario reset. No live Minds or Discord call occurred.",
        timestamp,
      );
    });
    reset();
    return this.getSnapshot();
  }

  getSnapshot(): TendSnapshot {
    const communityRow = this.database
      .prepare("SELECT * FROM communities ORDER BY created_at LIMIT 1")
      .get() as Row | undefined;
    if (!communityRow) {
      return process.env.TEND_MODE === "live"
        ? this.initializeLive()
        : this.resetDemo();
    }
    const community = communityFromRow(communityRow);
    const tenets = (
      this.database
        .prepare(
          "SELECT * FROM community_tenets WHERE community_id = ? ORDER BY created_at",
        )
        .all(community.id) as Row[]
    ).map(tenetFromRow);
    const members = (
      this.database
        .prepare(
          "SELECT * FROM member_profiles WHERE community_id = ? ORDER BY display_name",
        )
        .all(community.id) as Row[]
    ).map(memberFromRow);
    const memories = (
      this.database
        .prepare(
          "SELECT * FROM memory_receipts WHERE community_id = ? ORDER BY learned_at",
        )
        .all(community.id) as Row[]
    ).map(memoryFromRow);
    const incidents = (
      this.database
        .prepare(
          "SELECT * FROM incidents WHERE community_id = ? ORDER BY created_at DESC",
        )
        .all(community.id) as Row[]
    ).map(incidentFromRow);
    const actions = (
      this.database
        .prepare(
          "SELECT a.* FROM proposed_actions a JOIN incidents i ON i.id = a.incident_id WHERE i.community_id = ? ORDER BY a.proposed_at DESC",
        )
        .all(community.id) as Row[]
    ).map(actionFromRow);
    const followUps = (
      this.database
        .prepare(
          "SELECT f.* FROM follow_ups f JOIN incidents i ON i.id = f.incident_id WHERE i.community_id = ? ORDER BY f.created_at DESC",
        )
        .all(community.id) as Row[]
    ).map(followUpFromRow);
    const auditEvents = (
      this.database
        .prepare(
          "SELECT * FROM audit_events WHERE community_id = ? ORDER BY occurred_at DESC",
        )
        .all(community.id) as Row[]
    ).map(auditFromRow);
    const pulseRow = this.database
      .prepare(
        "SELECT * FROM community_pulses WHERE community_id = ? ORDER BY created_at DESC LIMIT 1",
      )
      .get(community.id) as Row | undefined;
    const demoRow = this.database
      .prepare("SELECT phase FROM demo_state WHERE community_id = ?")
      .get(community.id) as Row | undefined;

    const completedFollowUps = followUps.filter(
      (item) => item.status === "completed",
    ).length;
    const resolvedWithoutPunishment = incidents.filter(
      (item) =>
        item.status === "resolved" &&
        item.riskLevel !== "high" &&
        item.riskLevel !== "critical",
    ).length;
    const metrics = impactMetricsSchema.parse({
      incidentsReviewed: incidents.length,
      lowRiskResolvedWithoutPunishment: resolvedWithoutPunishment,
      approvalsStreamlined: actions.filter((item) => item.status === "executed")
        .length,
      medianResponseSeconds: incidents.length > 0 ? 4 : 0,
      followUpsCompleted: completedFollowUps,
      repeatConflictRate: completedFollowUps > 0 ? 0 : 0,
      estimatedModeratorMinutesSaved:
        resolvedWithoutPunishment * 4 + completedFollowUps * 3,
      isDemoData: community.mode === "demo",
    });

    return {
      community,
      tenets,
      members,
      memories,
      incidents,
      actions,
      followUps,
      auditEvents,
      pulse: pulseRow
        ? {
            id: String(pulseRow.id),
            communityId: String(pulseRow.community_id),
            headline: String(pulseRow.headline),
            summary: String(pulseRow.summary),
            positivePrompt: String(pulseRow.positive_prompt),
            createdAt: String(pulseRow.created_at),
          }
        : null,
      demoPhase: demoPhaseSchema.parse(demoRow?.phase ?? "ready"),
      metrics,
    };
  }

  learnDemo(now = new Date()): TendSnapshot {
    const timestamp = now.toISOString();
    const learn = this.database.transaction(() => {
      const insert = this.database.prepare(
        `INSERT OR IGNORE INTO memory_receipts (
          id, community_id, subject_type, subject_id, claim, source_type, source_reference,
          learned_at, confidence, status, why_relevant, mind_reference
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      const shared = [
        DEMO_IDS.community,
        "creator_instruction",
        "Demo teaching · Act 1",
        timestamp,
        1,
      ];
      insert.run(
        "memory-roasting-norm",
        shared[0],
        "community",
        shared[0],
        "Playful roasting is normally allowed.",
        shared[1],
        shared[2],
        shared[3],
        shared[4],
        "active",
        "Prevents over-moderating ordinary community banter.",
        "mock:steward-demo:act-1",
      );
      insert.run(
        "memory-kai-voice-boundary",
        shared[0],
        "member",
        DEMO_IDS.kai,
        "Kai asked people not to joke about their voice.",
        "member_request",
        "Creator-approved boundary from demo teaching",
        shared[3],
        1,
        "active",
        "Turns otherwise ambiguous voice jokes into a known boundary crossing.",
        "mock:steward-demo:act-1",
      );
      insert.run(
        "memory-new-member-reminder",
        shared[0],
        "policy",
        shared[0],
        "New members should always receive a gentle reminder first.",
        shared[1],
        shared[2],
        shared[3],
        shared[4],
        "active",
        "Sets the proportional first-response policy for Jules.",
        "mock:steward-demo:act-1",
      );
      insert.run(
        "memory-no-auto-ban",
        shared[0],
        "policy",
        shared[0],
        "TEND must never ban anyone automatically.",
        shared[1],
        shared[2],
        shared[3],
        shared[4],
        "active",
        "Constrains enforcement; ban and kick are unavailable in this MVP.",
        "mock:steward-demo:act-1",
      );
      this.database
        .prepare(
          "UPDATE demo_state SET phase = ?, updated_at = ? WHERE community_id = ?",
        )
        .run("learned", timestamp, DEMO_IDS.community);
      this.insertAudit(
        DEMO_IDS.community,
        null,
        "mind",
        "memory.receipts_recorded",
        "Mock Minds returned four creator-approved facts; TEND stored auditable receipts.",
        timestamp,
      );
    });
    learn();
    return this.getSnapshot();
  }

  recordDemoIncident(decision: MindDecision, now = new Date()): TendSnapshot {
    const timestamp = now.toISOString();
    const record = this.database.transaction(() => {
      const activeReceiptIds = (
        this.database
          .prepare(
            "SELECT id FROM memory_receipts WHERE community_id = ? AND status = 'active'",
          )
          .all(DEMO_IDS.community) as Array<{ id: string }>
      ).map((row) => row.id);
      if (!activeReceiptIds.includes("memory-kai-voice-boundary")) {
        throw new Error(
          "Act 1 must be completed with an active Kai boundary receipt.",
        );
      }
      this.database
        .prepare(
          `INSERT OR IGNORE INTO incidents (
            id, community_id, external_message_id, actor_id, affected_member_ids, message_excerpt,
            conversation_context, status, risk_level, confidence, summary, reasoning,
            classification, policy_matches, memory_receipt_ids, prompt_version, created_at, resolved_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          DEMO_IDS.incident,
          DEMO_IDS.community,
          "demo-message-jules-001",
          DEMO_IDS.jules,
          JSON.stringify([DEMO_IDS.kai]),
          "Kai made another clip with that cracking voice? ",
          JSON.stringify([
            { author: "Mina", content: "Kai's new clip is up!", offset: "−1m" },
            {
              author: "Jules",
              content: "Kai made another clip with that cracking voice? ",
              offset: "now",
            },
          ]),
          "awaiting_approval",
          decision.riskLevel,
          decision.confidence,
          decision.summary,
          decision.reasoningForModerator,
          decision.classification,
          JSON.stringify(decision.policyMatches),
          JSON.stringify(
            decision.memoryReceipts.map((receipt) => receipt.receiptId),
          ),
          TEND_PROMPT_VERSION,
          timestamp,
          null,
        );
      const proposal = decision.proposedActions[0];
      if (!proposal)
        throw new Error("Demo decision did not contain a proposed action.");
      this.database
        .prepare(
          `INSERT OR IGNORE INTO proposed_actions (
            id, incident_id, type, target_id, content, risk_class, requires_approval, status,
            idempotency_key, proposed_at, approved_at, executed_at, execution_result
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          DEMO_IDS.action,
          DEMO_IDS.incident,
          proposal.type,
          proposal.targetId,
          proposal.content,
          "consequential",
          1,
          "proposed",
          "demo:private-reminder:jules:voice-boundary:v1",
          timestamp,
          null,
          null,
          null,
        );
      this.database
        .prepare(
          "UPDATE demo_state SET phase = ?, updated_at = ? WHERE community_id = ?",
        )
        .run("incident", timestamp, DEMO_IDS.community);
      this.insertAudit(
        DEMO_IDS.community,
        DEMO_IDS.incident,
        "mind",
        "incident.analyzed",
        "Mock Minds classified an ambiguous joke using the active Kai boundary receipt; no action executed.",
        timestamp,
      );
      this.insertAudit(
        DEMO_IDS.community,
        DEMO_IDS.incident,
        "tend",
        "action.approval_requested",
        "Private reminder requires explicit approval before any live delivery.",
        timestamp,
      );
    });
    record();
    return this.getSnapshot();
  }

  editActionContent(
    actionId: string,
    content: string,
    now = new Date(),
  ): TendSnapshot {
    const normalized = content.trim();
    if (normalized.length < 10 || normalized.length > 2_000) {
      throw new Error(
        "Edited action content must be between 10 and 2,000 characters.",
      );
    }
    const action = this.database
      .prepare(
        `SELECT proposed_actions.incident_id, incidents.community_id
         FROM proposed_actions
         JOIN incidents ON incidents.id = proposed_actions.incident_id
         WHERE proposed_actions.id = ? AND proposed_actions.status = 'proposed'`,
      )
      .get(actionId) as
      | { incident_id: string; community_id: string }
      | undefined;
    if (!action) throw new Error("Only proposed actions can be edited.");
    this.database
      .prepare(
        "UPDATE proposed_actions SET content = ? WHERE id = ? AND status = 'proposed'",
      )
      .run(normalized, actionId);
    this.insertAudit(
      action.community_id,
      action.incident_id,
      "creator",
      "action.edited",
      "Creator edited the proposed response before approval; audit content is summarized.",
      now.toISOString(),
    );
    return this.getSnapshot();
  }

  approveAction(
    actionId: string,
    demoDelayMs: number,
    now = new Date(),
    demoSafeExecution = true,
  ): TendSnapshot {
    const timestamp = now.toISOString();
    const dueAt = new Date(now.getTime() + demoDelayMs).toISOString();
    const approve = this.database.transaction(() => {
      const action = this.database
        .prepare(
          `SELECT proposed_actions.*, incidents.community_id, communities.mode AS community_mode
           FROM proposed_actions
           JOIN incidents ON incidents.id = proposed_actions.incident_id
           JOIN communities ON communities.id = incidents.community_id
           WHERE proposed_actions.id = ?`,
        )
        .get(actionId) as Row | undefined;
      if (!action) throw new Error("Action not found.");
      if (action.status === "executed") return;
      if (!bool(action.requires_approval))
        throw new Error("Approval endpoint is only for gated actions.");
      this.database
        .prepare(
          `UPDATE proposed_actions
           SET status = ?, approved_at = ?, executed_at = ?, execution_result = ?
           WHERE id = ? AND status = 'proposed'`,
        )
        .run(
          demoSafeExecution ? "executed" : "approved",
          timestamp,
          demoSafeExecution ? timestamp : null,
          demoSafeExecution
            ? "Demo-safe delivery recorded. No live Discord message was sent."
            : "Approved for the allowlisted Discord worker; not yet executed.",
          actionId,
        );
      this.database
        .prepare("UPDATE incidents SET status = 'monitoring' WHERE id = ?")
        .run(action.incident_id);
      this.database
        .prepare(
          `INSERT OR IGNORE INTO follow_ups (
            id, incident_id, due_at, purpose, status, attempt_count, last_error, idempotency_key,
            claimed_at, created_at, completed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          action.community_mode === "demo"
            ? DEMO_IDS.followUp
            : `followup-${randomUUID()}`,
          action.incident_id,
          dueAt,
          "Re-evaluate the conversation for renewed conflict and prepare a supportive community update.",
          "scheduled",
          0,
          null,
          action.community_mode === "demo"
            ? "demo:followup:voice-boundary:v1"
            : `approved-action:${actionId}:followup:v1`,
          null,
          timestamp,
          null,
        );
      if (action.community_mode === "demo") {
        this.database
          .prepare(
            "UPDATE demo_state SET phase = ?, updated_at = ? WHERE community_id = ?",
          )
          .run("scheduled", timestamp, action.community_id);
      }
      this.insertAudit(
        String(action.community_id),
        String(action.incident_id),
        "creator",
        "action.approved",
        demoSafeExecution
          ? "Creator approved the private reminder; demo-safe execution was recorded."
          : "Creator approved the proposal for idempotent execution by the allowlisted Discord worker.",
        timestamp,
      );
      this.insertAudit(
        String(action.community_id),
        String(action.incident_id),
        "tend",
        "followup.scheduled",
        `Persisted follow-up scheduled for ${dueAt}.`,
        timestamp,
      );
    });
    approve();
    return this.getSnapshot();
  }

  rejectAction(actionId: string, now = new Date()): TendSnapshot {
    const timestamp = now.toISOString();
    const action = this.database
      .prepare(
        `SELECT proposed_actions.*, incidents.community_id
         FROM proposed_actions
         JOIN incidents ON incidents.id = proposed_actions.incident_id
         WHERE proposed_actions.id = ?`,
      )
      .get(actionId) as Row | undefined;
    if (!action) throw new Error("Action not found.");
    this.database
      .prepare(
        "UPDATE proposed_actions SET status = 'rejected' WHERE id = ? AND status = 'proposed'",
      )
      .run(actionId);
    this.database
      .prepare("UPDATE incidents SET status = 'manual_review' WHERE id = ?")
      .run(action.incident_id);
    this.insertAudit(
      String(action.community_id),
      String(action.incident_id),
      "creator",
      "action.rejected",
      "Creator rejected the proposed response; incident moved to manual review.",
      timestamp,
    );
    return this.getSnapshot();
  }

  updateMemoryStatus(
    receiptId: string,
    status: "active" | "corrected" | "archived",
    now = new Date(),
  ): TendSnapshot {
    const receipt = this.database
      .prepare("SELECT community_id FROM memory_receipts WHERE id = ?")
      .get(receiptId) as { community_id: string } | undefined;
    if (!receipt) throw new Error("Memory receipt not found.");
    const result = this.database
      .prepare("UPDATE memory_receipts SET status = ? WHERE id = ?")
      .run(status, receiptId);
    if (result.changes !== 1) throw new Error("Memory receipt not found.");
    this.insertAudit(
      receipt.community_id,
      null,
      "creator",
      `memory.${status}`,
      `Creator changed receipt ${receiptId} to ${status}.`,
      now.toISOString(),
    );
    return this.getSnapshot();
  }

  claimNextDue(now = new Date()): FollowUp | null {
    const timestamp = now.toISOString();
    const claim = this.database.transaction(() => {
      const row = this.database
        .prepare(
          `SELECT * FROM follow_ups
           WHERE status IN ('scheduled', 'retrying') AND due_at <= ?
           ORDER BY due_at ASC LIMIT 1`,
        )
        .get(timestamp) as Row | undefined;
      if (!row) return null;
      const result = this.database
        .prepare(
          `UPDATE follow_ups SET status = 'claimed', claimed_at = ?, attempt_count = attempt_count + 1
           WHERE id = ? AND status IN ('scheduled', 'retrying')`,
        )
        .run(timestamp, row.id);
      if (result.changes !== 1) return null;
      const claimed = this.database
        .prepare("SELECT * FROM follow_ups WHERE id = ?")
        .get(row.id) as Row;
      return followUpFromRow(claimed);
    });
    return claim();
  }

  completeFollowUp(
    followUpId: string,
    completion: FollowUpCompletion,
    now = new Date(),
  ): void {
    const timestamp = now.toISOString();
    const summary = completion.summary.trim();
    if (summary.length < 3 || summary.length > 1_000) {
      throw new Error(
        "Follow-up summary must be between 3 and 1,000 characters.",
      );
    }
    const complete = this.database.transaction(() => {
      const row = this.database
        .prepare(
          `SELECT follow_ups.*, incidents.community_id, communities.mode AS community_mode
           FROM follow_ups
           JOIN incidents ON incidents.id = follow_ups.incident_id
           JOIN communities ON communities.id = incidents.community_id
           WHERE follow_ups.id = ?`,
        )
        .get(followUpId) as Row | undefined;
      if (!row) throw new Error("Follow-up not found.");
      if (row.status === "completed") return;
      if (row.status !== "claimed")
        throw new Error("Only claimed follow-ups can complete.");
      if (
        completion.evidenceKind === "seeded_demo" &&
        row.community_mode !== "demo"
      ) {
        throw new Error(
          "Seeded demo evidence cannot complete a live follow-up.",
        );
      }
      this.database
        .prepare(
          "UPDATE follow_ups SET status = 'completed', completed_at = ?, last_error = NULL WHERE id = ?",
        )
        .run(timestamp, followUpId);
      this.database
        .prepare(
          "UPDATE incidents SET status = ?, resolved_at = ? WHERE id = ?",
        )
        .run(
          completion.incidentStatus,
          completion.incidentStatus === "resolved" ? timestamp : null,
          row.incident_id,
        );
      if (completion.incidentStatus === "resolved") {
        this.database
          .prepare(
            `INSERT OR IGNORE INTO community_pulses
             (id, community_id, headline, summary, positive_prompt, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
          )
          .run(
            row.community_mode === "demo"
              ? DEMO_IDS.pulse
              : `pulse-${randomUUID()}`,
            row.community_id,
            completion.headline ?? "Follow-up completed.",
            summary,
            completion.positivePrompt ??
              "Invite the community to reinforce a healthy norm.",
            timestamp,
          );
      }
      if (row.community_mode === "demo") {
        this.database
          .prepare(
            "UPDATE demo_state SET phase = 'resolved', updated_at = ? WHERE community_id = ?",
          )
          .run(timestamp, row.community_id);
      }
      this.insertAudit(
        String(row.community_id),
        String(row.incident_id),
        "worker",
        "followup.completed",
        `Due-job worker completed with ${completion.evidenceKind} evidence; incident moved to ${completion.incidentStatus}.`,
        timestamp,
      );
      if (completion.evidenceReference) {
        this.insertAudit(
          String(row.community_id),
          String(row.incident_id),
          "mind",
          "mind.followup_reference",
          JSON.stringify(completion.evidenceReference),
          timestamp,
        );
      }
      this.insertAudit(
        String(row.community_id),
        String(row.incident_id),
        "tend",
        completion.incidentStatus === "resolved"
          ? "incident.resolved"
          : "incident.manual_review",
        summary,
        timestamp,
      );
    });
    complete();
  }

  retryFollowUp(
    followUpId: string,
    error: string,
    nextDueAt: Date,
    now = new Date(),
  ): void {
    this.database
      .prepare(
        `UPDATE follow_ups
         SET status = 'retrying', due_at = ?, last_error = ?, claimed_at = NULL
         WHERE id = ? AND status = 'claimed'`,
      )
      .run(nextDueAt.toISOString(), error.slice(0, 500), followUpId);
    const incident = this.followUpOwnership(followUpId);
    if (incident) {
      this.insertAudit(
        incident.community_id,
        incident.incident_id,
        "worker",
        "followup.retry_scheduled",
        `Transient follow-up failure; bounded retry scheduled at ${nextDueAt.toISOString()}.`,
        now.toISOString(),
      );
    }
  }

  failFollowUp(followUpId: string, error: string, now = new Date()): void {
    this.database
      .prepare(
        "UPDATE follow_ups SET status = 'failed', last_error = ? WHERE id = ?",
      )
      .run(error.slice(0, 500), followUpId);
    const incident = this.followUpOwnership(followUpId);
    if (incident) {
      this.database
        .prepare("UPDATE incidents SET status = 'manual_review' WHERE id = ?")
        .run(incident.incident_id);
    }
    if (incident) {
      this.insertAudit(
        incident.community_id,
        incident.incident_id,
        "worker",
        "followup.failed",
        "Follow-up exhausted bounded retries and requires manual review.",
        now.toISOString(),
      );
    }
  }

  hasProcessedMessage(externalMessageId: string): boolean {
    return Boolean(
      this.database
        .prepare(
          "SELECT 1 FROM processed_messages WHERE external_message_id = ?",
        )
        .get(externalMessageId),
    );
  }

  markMessageProcessed(
    externalMessageId: string,
    communityId: string,
    now = new Date(),
  ): boolean {
    const result = this.database
      .prepare(
        "INSERT OR IGNORE INTO processed_messages (external_message_id, community_id, processed_at) VALUES (?, ?, ?)",
      )
      .run(externalMessageId, communityId, now.toISOString());
    return result.changes === 1;
  }

  proposeAction(
    input: {
      incidentId: string;
      type: Exclude<ActionType, "execute_timeout" | "delete_message">;
      targetId: string | null;
      content: string;
      requiresApproval: boolean;
      idempotencyKey: string;
    },
    now = new Date(),
  ): ProposedAction {
    const existing = this.database
      .prepare("SELECT * FROM proposed_actions WHERE idempotency_key = ?")
      .get(input.idempotencyKey) as Row | undefined;
    if (existing) {
      const action = actionFromRow(existing);
      if (
        action.incidentId !== input.incidentId ||
        action.type !== input.type ||
        action.targetId !== input.targetId ||
        action.content !== input.content.trim()
      ) {
        throw new Error("Idempotency key was already used for another action.");
      }
      return action;
    }
    const incident = this.database
      .prepare("SELECT community_id FROM incidents WHERE id = ?")
      .get(input.incidentId) as { community_id: string } | undefined;
    if (!incident) throw new Error("Incident not found.");
    const content = input.content.trim();
    if (content.length < 3 || content.length > 2_000) {
      throw new Error("Action content must be between 3 and 2,000 characters.");
    }
    const id = `action-${randomUUID()}`;
    const timestamp = now.toISOString();
    this.database
      .prepare(
        `INSERT INTO proposed_actions (
          id, incident_id, type, target_id, content, risk_class, requires_approval, status,
          idempotency_key, proposed_at, approved_at, executed_at, execution_result
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'proposed', ?, ?, NULL, NULL, NULL)`,
      )
      .run(
        id,
        input.incidentId,
        input.type,
        input.targetId,
        content,
        input.requiresApproval ? "consequential" : "low",
        input.requiresApproval ? 1 : 0,
        input.idempotencyKey,
        timestamp,
      );
    this.insertAudit(
      incident.community_id,
      input.incidentId,
      "mind",
      "skill.action_proposed",
      `Custom Skill proposed ${input.type}; no Discord action was executed.`,
      timestamp,
    );
    const row = this.database
      .prepare("SELECT * FROM proposed_actions WHERE id = ?")
      .get(id) as Row;
    return actionFromRow(row);
  }

  scheduleFollowUp(
    input: {
      incidentId: string;
      dueAt: Date;
      purpose: string;
      idempotencyKey: string;
    },
    now = new Date(),
  ): FollowUp {
    const existing = this.database
      .prepare("SELECT * FROM follow_ups WHERE idempotency_key = ?")
      .get(input.idempotencyKey) as Row | undefined;
    if (existing) {
      const followUp = followUpFromRow(existing);
      if (
        followUp.incidentId !== input.incidentId ||
        followUp.dueAt !== input.dueAt.toISOString() ||
        followUp.purpose !== input.purpose.trim()
      ) {
        throw new Error(
          "Idempotency key was already used for another follow-up.",
        );
      }
      return followUp;
    }
    const incident = this.database
      .prepare("SELECT community_id FROM incidents WHERE id = ?")
      .get(input.incidentId) as { community_id: string } | undefined;
    if (!incident) throw new Error("Incident not found.");
    if (input.dueAt.getTime() <= now.getTime())
      throw new Error("Follow-up due time must be future.");
    const purpose = input.purpose.trim();
    if (purpose.length < 3 || purpose.length > 1_000) {
      throw new Error(
        "Follow-up purpose must be between 3 and 1,000 characters.",
      );
    }
    const id = `followup-${randomUUID()}`;
    const timestamp = now.toISOString();
    this.database
      .prepare(
        `INSERT INTO follow_ups (
          id, incident_id, due_at, purpose, status, attempt_count, last_error, idempotency_key,
          claimed_at, created_at, completed_at
        ) VALUES (?, ?, ?, ?, 'scheduled', 0, NULL, ?, NULL, ?, NULL)`,
      )
      .run(
        id,
        input.incidentId,
        input.dueAt.toISOString(),
        purpose,
        input.idempotencyKey,
        timestamp,
      );
    this.insertAudit(
      incident.community_id,
      input.incidentId,
      "mind",
      "skill.followup_scheduled",
      `Custom Skill scheduled a persisted follow-up for ${input.dueAt.toISOString()}.`,
      timestamp,
    );
    const row = this.database
      .prepare("SELECT * FROM follow_ups WHERE id = ?")
      .get(id) as Row;
    return followUpFromRow(row);
  }

  recordIncidentOutcome(
    incidentId: string,
    outcome: "resolved" | "manual_review",
    summary: string,
    now = new Date(),
  ): Incident {
    const row = this.database
      .prepare("SELECT community_id, status FROM incidents WHERE id = ?")
      .get(incidentId) as
      | { community_id: string; status: Incident["status"] }
      | undefined;
    if (!row) throw new Error("Incident not found.");
    if (outcome === "resolved") {
      const completedFollowUp = this.database
        .prepare(
          "SELECT 1 FROM follow_ups WHERE incident_id = ? AND status = 'completed' LIMIT 1",
        )
        .get(incidentId);
      if (!completedFollowUp || row.status !== "resolved") {
        throw new Error(
          "Resolved outcomes require a completed follow-up that resolved the incident.",
        );
      }
    }
    const normalized = summary.trim();
    if (normalized.length < 3 || normalized.length > 1_000) {
      throw new Error(
        "Outcome summary must be between 3 and 1,000 characters.",
      );
    }
    const timestamp = now.toISOString();
    this.database
      .prepare("UPDATE incidents SET status = ?, resolved_at = ? WHERE id = ?")
      .run(outcome, outcome === "resolved" ? timestamp : null, incidentId);
    this.insertAudit(
      row.community_id,
      incidentId,
      "mind",
      "skill.outcome_recorded",
      `Custom Skill recorded ${outcome}: ${normalized}`,
      timestamp,
    );
    return incidentFromRow(
      this.database
        .prepare("SELECT * FROM incidents WHERE id = ?")
        .get(incidentId) as Row,
    );
  }

  getFollowUp(followUpId: string): FollowUp | null {
    const row = this.database
      .prepare("SELECT * FROM follow_ups WHERE id = ?")
      .get(followUpId) as Row | undefined;
    return row ? followUpFromRow(row) : null;
  }

  getFollowUpContext(followUpId: string): FollowUpContext | null {
    const ownership = this.database
      .prepare(
        `SELECT follow_ups.*, incidents.community_id
         FROM follow_ups
         JOIN incidents ON incidents.id = follow_ups.incident_id
         WHERE follow_ups.id = ?`,
      )
      .get(followUpId) as Row | undefined;
    if (!ownership) return null;

    const communityId = String(ownership.community_id);
    const community = communityFromRow(
      this.database
        .prepare("SELECT * FROM communities WHERE id = ?")
        .get(communityId) as Row,
    );
    const incident = incidentFromRow(
      this.database
        .prepare("SELECT * FROM incidents WHERE id = ?")
        .get(ownership.incident_id) as Row,
    );
    const tenets = (
      this.database
        .prepare(
          "SELECT * FROM community_tenets WHERE community_id = ? ORDER BY created_at",
        )
        .all(communityId) as Row[]
    ).map(tenetFromRow);
    const activeMemories = (
      this.database
        .prepare(
          "SELECT * FROM memory_receipts WHERE community_id = ? AND status = 'active' ORDER BY learned_at",
        )
        .all(communityId) as Row[]
    ).map(memoryFromRow);

    return {
      followUp: followUpFromRow(ownership),
      incident,
      community,
      tenets,
      activeMemories,
    };
  }

  recordAnalyzedIncident(
    input: {
      externalMessageId: string;
      sourceChannelId?: string | null;
      actorId: string;
      messageExcerpt: string;
      conversationContext: Array<{
        author: string;
        content: string;
        offset: string;
      }>;
      decision: MindDecision;
      forceManualReview: boolean;
      analysisReference?: {
        provider: "mock" | "live" | "unavailable";
        conversationAlias: string | null;
        responseFingerprint: string | null;
        promptVersion: string;
      };
    },
    now = new Date(),
  ): Incident {
    const existing = this.database
      .prepare("SELECT * FROM incidents WHERE external_message_id = ?")
      .get(input.externalMessageId) as Row | undefined;
    if (existing) return incidentFromRow(existing);
    const snapshot = this.getSnapshot();
    const id = `incident-${randomUUID()}`;
    const timestamp = now.toISOString();
    const status =
      input.forceManualReview || input.decision.confidence < 0.55
        ? "manual_review"
        : "awaiting_approval";
    const insert = this.database.transaction(() => {
      this.database
        .prepare(
          `INSERT INTO incidents (
            id, community_id, external_message_id, source_channel_id, actor_id, affected_member_ids, message_excerpt,
            conversation_context, status, risk_level, confidence, summary, reasoning,
            classification, policy_matches, memory_receipt_ids, prompt_version, created_at, resolved_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
        )
        .run(
          id,
          snapshot.community.id,
          input.externalMessageId,
          input.sourceChannelId ?? null,
          input.actorId,
          JSON.stringify([]),
          input.messageExcerpt.slice(0, 1_000),
          JSON.stringify(input.conversationContext),
          status,
          input.decision.riskLevel,
          input.decision.confidence,
          input.decision.summary,
          input.decision.reasoningForModerator,
          input.decision.classification,
          JSON.stringify(input.decision.policyMatches),
          JSON.stringify(
            input.decision.memoryReceipts.map((memory) => memory.receiptId),
          ),
          input.analysisReference?.promptVersion ?? TEND_PROMPT_VERSION,
          timestamp,
        );
      const governedProposals =
        status === "manual_review"
          ? [
              {
                type: "moderator_review" as const,
                targetId: null,
                content:
                  "Review the original message and community context manually.",
              },
            ]
          : input.decision.proposedActions;
      for (const [proposalIndex, proposal] of governedProposals.entries()) {
        const safeType =
          proposal.type === "execute_timeout" ||
          proposal.type === "delete_message"
            ? "moderator_review"
            : proposal.type;
        this.database
          .prepare(
            `INSERT INTO proposed_actions (
              id, incident_id, type, target_id, content, risk_class, requires_approval, status,
              idempotency_key, proposed_at, approved_at, executed_at, execution_result
            ) VALUES (?, ?, ?, ?, ?, ?, 1, 'proposed', ?, ?, NULL, NULL, NULL)`,
          )
          .run(
            `action-${randomUUID()}`,
            id,
            safeType,
            proposal.targetId,
            proposal.content.slice(0, 2_000),
            safeType === "observe" || safeType === "record_pattern"
              ? "low"
              : "consequential",
            `discord:proposal:${input.externalMessageId}:${safeType}:${proposalIndex}`,
            timestamp,
          );
      }
      this.insertAudit(
        snapshot.community.id,
        id,
        "discord",
        "discord.message_ingested",
        "Allowlisted Discord message was accepted and stored as a sanitized incident excerpt.",
        timestamp,
      );
      this.insertAudit(
        snapshot.community.id,
        id,
        input.forceManualReview ? "tend" : "mind",
        input.forceManualReview
          ? "incident.manual_review"
          : "incident.analyzed",
        input.forceManualReview
          ? "No validated Minds decision was available; no automatic action occurred."
          : "Validated Minds decision stored; proposed actions remain approval-gated.",
        timestamp,
      );
      if (input.analysisReference) {
        this.insertAudit(
          snapshot.community.id,
          id,
          "mind",
          "mind.response_reference",
          JSON.stringify({
            provider: input.analysisReference.provider,
            conversationAlias:
              input.analysisReference.conversationAlias?.slice(0, 200) ?? null,
            responseFingerprint:
              input.analysisReference.responseFingerprint?.slice(0, 200) ??
              null,
            promptVersion: input.analysisReference.promptVersion.slice(0, 100),
          }),
          timestamp,
        );
      }
    });
    insert();
    return incidentFromRow(
      this.database
        .prepare("SELECT * FROM incidents WHERE id = ?")
        .get(id) as Row,
    );
  }

  claimNextApprovedAction(): ProposedAction | null {
    const claim = this.database.transaction(() => {
      const row = this.database
        .prepare(
          "SELECT * FROM proposed_actions WHERE status = 'approved' ORDER BY approved_at LIMIT 1",
        )
        .get() as Row | undefined;
      if (!row) return null;
      const updated = this.database
        .prepare(
          "UPDATE proposed_actions SET status = 'executing' WHERE id = ? AND status = 'approved'",
        )
        .run(row.id);
      if (updated.changes !== 1) return null;
      return actionFromRow(
        this.database
          .prepare("SELECT * FROM proposed_actions WHERE id = ?")
          .get(row.id) as Row,
      );
    });
    return claim();
  }

  markActionExecuted(actionId: string, result: string, now = new Date()): void {
    this.database
      .prepare(
        `UPDATE proposed_actions
         SET status = 'executed', executed_at = ?, execution_result = ?
         WHERE id = ? AND status = 'executing'`,
      )
      .run(now.toISOString(), result.slice(0, 500), actionId);
  }

  markActionFailed(actionId: string, result: string, now = new Date()): void {
    this.database
      .prepare(
        `UPDATE proposed_actions
         SET status = 'failed', executed_at = ?, execution_result = ?
         WHERE id = ? AND status = 'executing'`,
      )
      .run(now.toISOString(), result.slice(0, 500), actionId);
  }

  private followUpOwnership(
    followUpId: string,
  ): { incident_id: string; community_id: string } | undefined {
    return this.database
      .prepare(
        `SELECT follow_ups.incident_id, incidents.community_id
         FROM follow_ups
         JOIN incidents ON incidents.id = follow_ups.incident_id
         WHERE follow_ups.id = ?`,
      )
      .get(followUpId) as
      | { incident_id: string; community_id: string }
      | undefined;
  }

  private insertAudit(
    communityId: string,
    incidentId: string | null,
    actorType: AuditEvent["actorType"],
    eventType: string,
    payloadSummary: string,
    occurredAt: string,
  ): void {
    this.database
      .prepare(
        `INSERT INTO audit_events
         (id, community_id, incident_id, actor_type, event_type, payload_summary, occurred_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        `audit-${randomUUID()}`,
        communityId,
        incidentId,
        actorType,
        eventType,
        payloadSummary,
        occurredAt,
      );
  }
}
