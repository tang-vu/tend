import type {
  ActionType,
  AutonomyPolicy,
  MemoryReceipt,
  MindDecision,
  ProposedAction,
} from "./schema";

const unavailableActions = new Set(["ban", "kick"]);
const consequentialActions = new Set<ActionType>([
  "public_nudge",
  "private_reminder",
  "moderator_review",
  "recommend_timeout",
  "execute_timeout",
  "delete_message",
]);

export interface PolicyResult {
  allowed: boolean;
  requiresApproval: boolean;
  reason: string;
}

export function evaluateActionPolicy(
  actionType: ActionType | "ban" | "kick",
  policy: AutonomyPolicy,
  confidence: number,
): PolicyResult {
  if (unavailableActions.has(actionType)) {
    return {
      allowed: false,
      requiresApproval: true,
      reason: `${actionType} is unavailable in the TEND MVP.`,
    };
  }

  if (confidence < 0.55) {
    return {
      allowed: actionType === "moderator_review",
      requiresApproval: true,
      reason: "Low-confidence situations must be reviewed by a moderator.",
    };
  }

  const typedAction = actionType as ActionType;
  if (
    consequentialActions.has(typedAction) ||
    typedAction === "execute_timeout"
  ) {
    return {
      allowed: true,
      requiresApproval: true,
      reason:
        "This action can affect a member and requires explicit creator approval.",
    };
  }

  const autonomous = policy.autonomousActionTypes.includes(
    typedAction as (typeof policy.autonomousActionTypes)[number],
  );
  return {
    allowed: true,
    requiresApproval: !autonomous,
    reason: autonomous
      ? "The creator policy explicitly allows this low-risk autonomous action."
      : "The creator has not allowed this action to run autonomously.",
  };
}

export function activeEvidence(receipts: MemoryReceipt[]): MemoryReceipt[] {
  return receipts.filter((receipt) => receipt.status === "active");
}

export function enforceDecisionPolicy(
  decision: MindDecision,
  policy: AutonomyPolicy,
): Array<
  Pick<ProposedAction, "type" | "riskClass" | "requiresApproval"> & {
    policyReason: string;
  }
> {
  if (decision.confidence < 0.55) {
    return [
      {
        type: "moderator_review",
        riskClass: "consequential",
        requiresApproval: true,
        policyReason: "The Mind reported insufficient confidence.",
      },
    ];
  }

  return decision.proposedActions.map((action) => {
    const result = evaluateActionPolicy(
      action.type,
      policy,
      decision.confidence,
    );
    return {
      type: result.allowed ? action.type : "moderator_review",
      riskClass: consequentialActions.has(action.type)
        ? "consequential"
        : "low",
      requiresApproval: result.requiresApproval,
      policyReason: result.reason,
    };
  });
}

export function messageContainsPolicyOverrideAttempt(message: string): boolean {
  const patterns = [
    /ignore (all|any|the) (previous|prior|system) instructions/i,
    /you are now/i,
    /reveal (the )?(system prompt|secrets?|api key)/i,
    /do not follow (the )?(moderation|creator|policy)/i,
    /<\s*system\s*>/i,
  ];
  return patterns.some((pattern) => pattern.test(message));
}
