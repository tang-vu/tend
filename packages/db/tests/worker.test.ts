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
});
