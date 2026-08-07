import type { FollowUp } from "@tend/core";
import type { FollowUpCompletion, TendRepository } from "./store";

export interface FollowUpProcessor {
  process(followUp: FollowUp): Promise<FollowUpCompletion>;
}

export interface WorkerResult {
  status: "idle" | "completed" | "retrying" | "failed";
  followUpId?: string;
  attemptCount?: number;
}

const DEFAULT_BACKOFF_MS = [2_000, 5_000] as const;

export class DemoFollowUpProcessor implements FollowUpProcessor {
  async process(): Promise<FollowUpCompletion> {
    return Promise.resolve({
      incidentStatus: "resolved",
      evidenceKind: "seeded_demo",
      headline: "Repair held. No renewed conflict.",
      summary:
        "TEND checked the persisted case after the intervention. No further voice jokes or escalation appeared, so the incident is resolved.",
      positivePrompt:
        "Share one creative risk you took this week—and one kind response that helped.",
    });
  }
}

export class FailClosedFollowUpProcessor implements FollowUpProcessor {
  async process(): Promise<FollowUpCompletion> {
    await Promise.resolve();
    throw new Error(
      "No live observation source is configured for this follow-up; moderator review is required.",
    );
  }
}

export async function runDueFollowUp(
  repository: TendRepository,
  options: {
    now?: Date;
    processor?: FollowUpProcessor;
    backoffMs?: readonly number[];
  } = {},
): Promise<WorkerResult> {
  const now = options.now ?? new Date();
  const followUp = repository.claimNextDue(now);
  if (!followUp) return { status: "idle" };

  const processor = options.processor ?? new FailClosedFollowUpProcessor();
  const backoff = options.backoffMs ?? DEFAULT_BACKOFF_MS;
  try {
    const completion = await processor.process(followUp);
    repository.completeFollowUp(followUp.id, completion, now);
    return {
      status: "completed",
      followUpId: followUp.id,
      attemptCount: followUp.attemptCount,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown follow-up failure";
    const retryIndex = followUp.attemptCount - 1;
    const delay = backoff[retryIndex];
    if (delay !== undefined) {
      repository.retryFollowUp(
        followUp.id,
        message,
        new Date(now.getTime() + delay),
        now,
      );
      return {
        status: "retrying",
        followUpId: followUp.id,
        attemptCount: followUp.attemptCount,
      };
    }
    repository.failFollowUp(followUp.id, message, now);
    return {
      status: "failed",
      followUpId: followUp.id,
      attemptCount: followUp.attemptCount,
    };
  }
}
