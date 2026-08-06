import type { ProposedAction } from "@tend/core";

export interface DiscordActionGateway {
  sendChannelMessage(content: string): Promise<string>;
  sendPrivateReminder(targetId: string, content: string): Promise<string>;
  notifyModerator(content: string): Promise<string>;
  timeoutMember(
    targetId: string,
    durationMs: number,
    reason: string,
  ): Promise<string>;
}

export interface DiscordExecutionResult {
  executed: boolean;
  result: string;
}

export async function executeApprovedDiscordAction(
  action: ProposedAction,
  gateway: DiscordActionGateway,
): Promise<DiscordExecutionResult> {
  if (action.status !== "approved" && action.status !== "executing") {
    return {
      executed: false,
      result: "Refused: action lacks explicit approval.",
    };
  }
  if (action.type === "delete_message") {
    return {
      executed: false,
      result: "Refused: message deletion is not implemented in this MVP.",
    };
  }
  if (
    action.type === "observe" ||
    action.type === "record_pattern" ||
    action.type === "positive_prompt"
  ) {
    return {
      executed: true,
      result: "Low-risk application state recorded; no Discord member action.",
    };
  }
  if (action.type === "public_nudge") {
    return {
      executed: true,
      result: await gateway.sendChannelMessage(action.content),
    };
  }
  if (action.type === "private_reminder") {
    if (!action.targetId)
      return {
        executed: false,
        result: "Refused: private reminder has no target.",
      };
    return {
      executed: true,
      result: await gateway.sendPrivateReminder(
        action.targetId,
        action.content,
      ),
    };
  }
  if (
    action.type === "moderator_review" ||
    action.type === "recommend_timeout"
  ) {
    return {
      executed: true,
      result: await gateway.notifyModerator(action.content),
    };
  }
  if (action.type === "execute_timeout") {
    if (!action.targetId)
      return { executed: false, result: "Refused: timeout has no target." };
    return {
      executed: true,
      result: await gateway.timeoutMember(
        action.targetId,
        10 * 60_000,
        action.content,
      ),
    };
  }
  return { executed: false, result: "Refused: unsupported action type." };
}
