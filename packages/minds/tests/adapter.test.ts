import { describe, expect, it, vi } from "vitest";
import { DEMO_DECISION } from "@tend/core";
import {
  createLiveMindsAdapterFromEnv,
  LiveMindsAdapter,
  MindsUnavailableError,
  type MindsClientPort,
} from "../src/live";

function clientWithReplies(
  replies: Array<{ timedOut: boolean; reply?: { messageText: string } }>,
) {
  return {
    listMinds: vi.fn().mockResolvedValue([{ mindId: "mind-1" }]),
    getMind: vi.fn().mockResolvedValue({ mindId: "mind-1" }),
    ensureConversation: vi.fn().mockResolvedValue({}),
    getLatestHistoryFingerprint: vi.fn().mockResolvedValue("before"),
    sendMessage: vi.fn().mockResolvedValue({}),
    waitForReply: vi
      .fn()
      .mockImplementation(async () => replies.shift() ?? { timedOut: true }),
  } satisfies MindsClientPort;
}

const input = {
  community: {
    id: "community",
    name: "Test",
    platform: "discord" as const,
    externalGuildId: null,
    monitoredChannelIds: [],
    mode: "live" as const,
    creatorTone: "Warm",
    autonomyPolicy: {
      autonomousActionTypes: ["observe" as const],
      alwaysRequireApproval: ["private_reminder" as const],
      newMemberGentleFirst: true,
      allowMemberCheckIns: true,
    },
    retentionPolicy: {
      messageExcerptDays: 30,
      auditDays: 90,
      allowMemberDeletionRequest: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  tenets: [],
  activeMemories: [],
  message: "message",
  conversationContext: [],
};

describe("LiveMindsAdapter", () => {
  it("reports unavailable credentials without revealing a secret", () => {
    const previousKey = process.env.MINDS_BUILDER_API_KEY;
    const previousMind = process.env.MINDS_MIND_ID;
    delete process.env.MINDS_BUILDER_API_KEY;
    delete process.env.MINDS_MIND_ID;
    expect(() => createLiveMindsAdapterFromEnv()).toThrow(
      MindsUnavailableError,
    );
    if (previousKey) process.env.MINDS_BUILDER_API_KEY = previousKey;
    if (previousMind) process.env.MINDS_MIND_ID = previousMind;
  });

  it("accepts a valid structured response", async () => {
    const client = clientWithReplies([
      {
        timedOut: false,
        reply: { messageText: JSON.stringify(DEMO_DECISION) },
      },
    ]);
    const adapter = new LiveMindsAdapter({
      builderApiKey: "not-logged",
      mindId: "mind-1",
      client,
    });
    const result = await adapter.analyzeIncident(input);
    expect(result.status).toBe("ok");
    expect(result.decision.riskLevel).toBe("medium");
  });

  it("repairs invalid JSON once", async () => {
    const client = clientWithReplies([
      { timedOut: false, reply: { messageText: "not json" } },
      {
        timedOut: false,
        reply: { messageText: JSON.stringify(DEMO_DECISION) },
      },
    ]);
    const adapter = new LiveMindsAdapter({
      builderApiKey: "not-logged",
      mindId: "mind-1",
      client,
    });
    const result = await adapter.analyzeIncident(input);
    expect(result.status).toBe("ok");
    expect(client.sendMessage).toHaveBeenCalledTimes(2);
  });

  it.each([
    {
      name: "schema failure",
      replies: [
        { timedOut: false, reply: { messageText: "{}" } },
        { timedOut: false, reply: { messageText: "{}" } },
      ],
    },
    { name: "timeout", replies: [{ timedOut: true }] },
  ])("falls back safely on $name", async ({ replies }) => {
    const adapter = new LiveMindsAdapter({
      builderApiKey: "not-logged",
      mindId: "mind-1",
      client: clientWithReplies(replies),
    });
    const result = await adapter.analyzeIncident(input);
    expect(result).toMatchObject({
      status: "manual_review",
      reference: { provider: "unavailable" },
      decision: {
        needsHumanReview: true,
        proposedActions: [{ type: "moderator_review" }],
      },
    });
  });
});
