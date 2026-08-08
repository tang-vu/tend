import { describe, expect, it, vi } from "vitest";
import { DEMO_DECISION } from "@tend/core";
import { stewardAlias } from "../src/aliases";
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
  activeMemories: [
    {
      id: "memory-kai-voice-boundary",
      communityId: "community",
      subjectType: "member" as const,
      subjectId: "member-kai",
      claim: "Kai asked people not to joke about their voice.",
      sourceType: "member_request" as const,
      sourceReference: "creator-approved request",
      learnedAt: new Date().toISOString(),
      confidence: 1,
      status: "active" as const,
      whyRelevant: "Known boundary",
      mindReference: null,
    },
  ],
  message: "message",
  conversationContext: [],
};

const followUpInput = {
  community: input.community,
  tenets: input.tenets,
  activeMemories: input.activeMemories,
  incident: {
    id: "incident-1",
    communityId: "community",
    externalMessageId: "message-1",
    sourceChannelId: "channel-1",
    actorId: "member-1",
    affectedMemberIds: [],
    messageExcerpt: "Original message",
    conversationContext: [],
    status: "monitoring" as const,
    riskLevel: "medium" as const,
    confidence: 0.9,
    summary: "A boundary may have been crossed.",
    reasoning: "Known context made the boundary relevant.",
    classification: "accidental_harm" as const,
    policyMatches: [],
    memoryReceiptIds: ["memory-kai-voice-boundary"],
    promptVersion: "test",
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  },
  purpose: "Check whether repair held.",
  observedAt: new Date().toISOString(),
  freshMessages: [
    {
      id: "fresh-message-1",
      author: "Member",
      content: "Thanks for the reminder. I understand the boundary.",
      createdAt: new Date().toISOString(),
    },
  ],
};

const validFollowUpAssessment = {
  incidentStatus: "resolved" as const,
  confidence: 0.92,
  summary: "The fresh exchange indicates that repair held.",
  headline: "Repair held after the reminder.",
  positivePrompt: "Invite members to reinforce respectful creative feedback.",
  observedMessageIds: ["fresh-message-1"],
  reasoningForModerator:
    "The member acknowledged the boundary without renewed conflict.",
  uncertainties: [],
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

  it("rejects fabricated memory references after schema validation", async () => {
    const client = clientWithReplies([
      {
        timedOut: false,
        reply: {
          messageText: JSON.stringify({
            ...DEMO_DECISION,
            memoryReceipts: [
              { receiptId: "fabricated", influence: "Invented evidence" },
            ],
          }),
        },
      },
    ]);
    const adapter = new LiveMindsAdapter({
      builderApiKey: "not-logged",
      mindId: "mind-1",
      client,
    });
    const result = await adapter.analyzeIncident(input);
    expect(result).toMatchObject({
      status: "manual_review",
      reference: { provider: "unavailable" },
    });
  });

  it("rejects oversized and unknown response fields", async () => {
    const oversized = { ...DEMO_DECISION, hiddenReasoning: "x" };
    const adapter = new LiveMindsAdapter({
      builderApiKey: "not-logged",
      mindId: "mind-1",
      client: clientWithReplies([
        { timedOut: false, reply: { messageText: JSON.stringify(oversized) } },
        { timedOut: false, reply: { messageText: "x".repeat(65 * 1024) } },
      ]),
    });
    const result = await adapter.analyzeIncident(input);
    expect(result.status).toBe("manual_review");
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

  it("validates a structured follow-up in the persistent conversation", async () => {
    const client = clientWithReplies([
      {
        timedOut: false,
        reply: { messageText: JSON.stringify(validFollowUpAssessment) },
      },
    ]);
    const adapter = new LiveMindsAdapter({
      builderApiKey: "not-logged",
      mindId: "mind-1",
      client,
    });

    const result = await adapter.analyzeFollowUp(followUpInput);

    expect(result).toMatchObject({
      status: "ok",
      assessment: { incidentStatus: "resolved", confidence: 0.92 },
      reference: { provider: "live" },
    });
    expect(client.ensureConversation).toHaveBeenCalledWith(
      stewardAlias("community"),
      "mind-1",
    );
  });

  it("rejects follow-up references outside the fresh Discord window", async () => {
    const adapter = new LiveMindsAdapter({
      builderApiKey: "not-logged",
      mindId: "mind-1",
      client: clientWithReplies([
        {
          timedOut: false,
          reply: {
            messageText: JSON.stringify({
              ...validFollowUpAssessment,
              observedMessageIds: ["fabricated-message"],
            }),
          },
        },
      ]),
    });

    await expect(adapter.analyzeFollowUp(followUpInput)).resolves.toMatchObject(
      {
        status: "manual_review",
        reference: { provider: "unavailable" },
      },
    );
  });
});
