import { afterEach, describe, expect, it, vi } from "vitest";
import { DEMO_DECISION, DEMO_IDS } from "@tend/core";
import { openDatabase } from "../src/database";
import { SqliteTendRepository } from "../src/store";
import {
  DemoFollowUpProcessor,
  runDueFollowUp,
  type FollowUpProcessor,
} from "../src/worker";

const databases: ReturnType<typeof openDatabase>[] = [];

function setup(now = new Date("2026-08-05T12:00:00.000Z")) {
  const database = openDatabase(":memory:");
  databases.push(database);
  const repository = new SqliteTendRepository(database);
  repository.resetDemo(now);
  repository.learnDemo(now);
  repository.recordDemoIncident(DEMO_DECISION, now);
  repository.approveAction(DEMO_IDS.action, 12_000, now);
  return { database, repository, now };
}

afterEach(() => {
  for (const database of databases.splice(0)) database.close();
  vi.unstubAllEnvs();
});

describe("persisted follow-up worker", () => {
  it("does not run a future job", async () => {
    const { repository, now } = setup();
    await expect(runDueFollowUp(repository, { now })).resolves.toEqual({
      status: "idle",
    });
  });

  it("runs the accelerated demo follow-up when due", async () => {
    vi.useFakeTimers();
    const { repository, now } = setup();
    vi.setSystemTime(new Date(now.getTime() + 12_001));
    const result = await runDueFollowUp(repository, {
      now: new Date(),
      processor: new DemoFollowUpProcessor(),
    });
    expect(result.status).toBe("completed");
    expect(repository.getSnapshot()).toMatchObject({
      demoPhase: "resolved",
      incidents: [{ status: "resolved" }],
      followUps: [{ status: "completed" }],
    });
    vi.useRealTimers();
  });

  it("prevents duplicate execution", async () => {
    const { repository, now } = setup();
    const due = new Date(now.getTime() + 13_000);
    expect(
      (
        await runDueFollowUp(repository, {
          now: due,
          processor: new DemoFollowUpProcessor(),
        })
      ).status,
    ).toBe("completed");
    expect((await runDueFollowUp(repository, { now: due })).status).toBe(
      "idle",
    );
  });

  it("fails closed when no live observation processor is supplied", async () => {
    const { repository, now } = setup();
    const due = new Date(now.getTime() + 13_000);
    const result = await runDueFollowUp(repository, {
      now: due,
      backoffMs: [],
    });

    expect(result.status).toBe("failed");
    expect(repository.getSnapshot()).toMatchObject({
      incidents: [{ status: "manual_review" }],
      followUps: [
        {
          status: "failed",
          lastError:
            "No live observation source is configured for this follow-up; moderator review is required.",
        },
      ],
    });
  });

  it("retries transient failures and exposes permanent failure", async () => {
    const { repository, now } = setup();
    const processor: FollowUpProcessor = {
      process: vi.fn().mockRejectedValue(new Error("temporary unavailable")),
    };
    const firstDue = new Date(now.getTime() + 13_000);
    expect(
      (
        await runDueFollowUp(repository, {
          now: firstDue,
          processor,
          backoffMs: [10],
        })
      ).status,
    ).toBe("retrying");
    const secondDue = new Date(firstDue.getTime() + 11);
    expect(
      (
        await runDueFollowUp(repository, {
          now: secondDue,
          processor,
          backoffMs: [10],
        })
      ).status,
    ).toBe("failed");
    expect(repository.getSnapshot()).toMatchObject({
      incidents: [{ status: "manual_review" }],
      followUps: [{ status: "failed" }],
    });
  });
});

describe("Discord persistence boundaries", () => {
  it("deduplicates external messages and never auto-executes a proposal", () => {
    const database = openDatabase(":memory:");
    databases.push(database);
    const repository = new SqliteTendRepository(database);
    const now = new Date("2026-08-05T12:00:00.000Z");
    repository.resetDemo(now);
    const first = repository.recordAnalyzedIncident(
      {
        externalMessageId: "discord-message-1",
        actorId: "member",
        messageExcerpt: "A test message",
        conversationContext: [],
        decision: DEMO_DECISION,
        forceManualReview: false,
      },
      now,
    );
    const duplicate = repository.recordAnalyzedIncident(
      {
        externalMessageId: "discord-message-1",
        actorId: "member",
        messageExcerpt: "A test message",
        conversationContext: [],
        decision: DEMO_DECISION,
        forceManualReview: false,
      },
      now,
    );
    expect(duplicate.id).toBe(first.id);
    const snapshot = repository.getSnapshot();
    expect(snapshot.incidents).toHaveLength(1);
    expect(snapshot.actions[0]?.status).toBe("proposed");
    expect(repository.claimNextApprovedAction()).toBeNull();
  });

  it("replaces low-confidence proposals with a moderator-review item", () => {
    const database = openDatabase(":memory:");
    databases.push(database);
    const repository = new SqliteTendRepository(database);
    const now = new Date("2026-08-05T12:00:00.000Z");
    repository.resetDemo(now);

    repository.recordAnalyzedIncident(
      {
        externalMessageId: "discord-message-low-confidence",
        actorId: DEMO_IDS.jules,
        messageExcerpt: "An ambiguous message",
        conversationContext: [],
        decision: {
          ...DEMO_DECISION,
          confidence: 0.2,
          proposedActions: [
            {
              type: "private_reminder",
              targetId: DEMO_IDS.jules,
              content: "This proposal must not remain actionable.",
              rationale: "The test deliberately supplies a low-confidence action.",
            },
          ],
        },
        forceManualReview: false,
      },
      now,
    );

    const snapshot = repository.getSnapshot();
    expect(snapshot.incidents).toMatchObject([{ status: "manual_review" }]);
    expect(snapshot.actions).toMatchObject([
      { type: "moderator_review", targetId: null, status: "proposed" },
    ]);
  });
});

describe("Custom Skill idempotency", () => {
  it("returns the original action and follow-up for an identical retry", () => {
    const { repository, now } = setup();
    const actionInput = {
      incidentId: DEMO_IDS.incident,
      type: "private_reminder" as const,
      targetId: DEMO_IDS.jules,
      content: "Please respect the member-stated boundary.",
      requiresApproval: true,
      idempotencyKey: "skill:proposal:test-action-1",
    };
    const firstAction = repository.proposeAction(actionInput, now);
    expect(repository.proposeAction(actionInput, now).id).toBe(firstAction.id);

    const followUpInput = {
      incidentId: DEMO_IDS.incident,
      dueAt: new Date(now.getTime() + 60_000),
      purpose: "Check whether the reminder held.",
      idempotencyKey: "skill:followup:test-followup-1",
    };
    const firstFollowUp = repository.scheduleFollowUp(followUpInput, now);
    expect(repository.scheduleFollowUp(followUpInput, now).id).toBe(
      firstFollowUp.id,
    );
  });

  it("rejects reuse of a key for different input", () => {
    const { repository, now } = setup();
    const input = {
      incidentId: DEMO_IDS.incident,
      type: "private_reminder" as const,
      targetId: DEMO_IDS.jules,
      content: "Please respect the member-stated boundary.",
      requiresApproval: true,
      idempotencyKey: "skill:proposal:test-action-2",
    };
    repository.proposeAction(input, now);
    expect(() =>
      repository.proposeAction(
        { ...input, content: "Different content." },
        now,
      ),
    ).toThrow(/already used/);
  });

  it("requires completed follow-up evidence before resolving an incident", async () => {
    const { repository, now } = setup();

    expect(() =>
      repository.recordIncidentOutcome(
        DEMO_IDS.incident,
        "resolved",
        "No further conflict occurred.",
        now,
      ),
    ).toThrow(/completed follow-up/);

    await runDueFollowUp(repository, {
      now: new Date(now.getTime() + 13_000),
      processor: new DemoFollowUpProcessor(),
    });

    expect(
      repository.recordIncidentOutcome(
        DEMO_IDS.incident,
        "resolved",
        "The completed follow-up found no further conflict.",
        new Date(now.getTime() + 14_000),
      ).status,
    ).toBe("resolved");
  });
});

describe("live storage bootstrap", () => {
  it("never seeds fictional demo members or demo metrics", () => {
    vi.stubEnv("TEND_MODE", "live");
    vi.stubEnv("DISCORD_GUILD_ID", "guild-live");
    vi.stubEnv("DISCORD_ALLOWED_CHANNEL_IDS", "channel-a,channel-b");
    const database = openDatabase(":memory:");
    databases.push(database);
    const snapshot = new SqliteTendRepository(database).getSnapshot();

    expect(snapshot).toMatchObject({
      community: {
        mode: "live",
        externalGuildId: "guild-live",
        monitoredChannelIds: ["channel-a", "channel-b"],
      },
      members: [],
      memories: [],
      metrics: { isDemoData: false },
    });
  });
});
