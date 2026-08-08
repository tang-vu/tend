import { afterEach, describe, expect, it, vi } from "vitest";
import type { Client } from "discord.js";
import { DEMO_DECISION } from "@tend/core";
import { openDatabase, runDueFollowUp, SqliteTendRepository } from "@tend/db";
import type { MindsAdapter, MindsFollowUpResult } from "@tend/minds";
import type { DiscordWorkerConfig } from "../src/config";
import { DiscordJsObservationGateway } from "../src/discord-observation";
import {
  DiscordMindsFollowUpProcessor,
  type DiscordObservationGateway,
} from "../src/followup";

const databases: ReturnType<typeof openDatabase>[] = [];

afterEach(() => {
  for (const database of databases.splice(0)) database.close();
  vi.unstubAllEnvs();
});

function setup() {
  vi.stubEnv("TEND_MODE", "live");
  vi.stubEnv("DISCORD_GUILD_ID", "guild-live");
  vi.stubEnv("DISCORD_ALLOWED_CHANNEL_IDS", "channel-live");
  const database = openDatabase(":memory:");
  databases.push(database);
  const repository = new SqliteTendRepository(database);
  const now = new Date("2026-08-08T01:00:00.000Z");
  const incident = repository.recordAnalyzedIncident(
    {
      externalMessageId: "trigger-message",
      sourceChannelId: "channel-live",
      actorId: "member-live",
      messageExcerpt: "A boundary-crossing message",
      conversationContext: [],
      decision: DEMO_DECISION,
      forceManualReview: false,
    },
    now,
  );
  const followUp = repository.scheduleFollowUp(
    {
      incidentId: incident.id,
      dueAt: new Date(now.getTime() + 60_000),
      purpose: "Check whether repair held using fresh Discord context.",
      idempotencyKey: "live:discord-observation:test",
    },
    now,
  );
  return { repository, followUp, due: new Date(now.getTime() + 60_001) };
}

function gateway(
  messages = [
    {
      id: "fresh-message-1",
      author: "Member",
      content: "I understand. I will respect that boundary.",
      createdAt: "2026-08-08T01:00:30.000Z",
    },
  ],
): DiscordObservationGateway {
  return { fetchAfter: vi.fn().mockResolvedValue(messages) };
}

function minds(result: MindsFollowUpResult): MindsAdapter {
  return {
    mode: "live",
    teach: vi.fn(),
    analyzeIncident: vi.fn(),
    analyzeFollowUp: vi.fn().mockResolvedValue(result),
  } as unknown as MindsAdapter;
}

function liveResult(
  overrides: Partial<MindsFollowUpResult["assessment"]> = {},
): MindsFollowUpResult {
  return {
    assessment: {
      incidentStatus: "resolved",
      confidence: 0.93,
      summary: "Fresh Discord context shows that repair held.",
      headline: "Repair held after a fresh observation.",
      positivePrompt: "Reinforce the respectful norm that helped repair hold.",
      observedMessageIds: ["fresh-message-1"],
      reasoningForModerator:
        "The member acknowledged the boundary and conflict did not recur.",
      uncertainties: [],
      ...overrides,
    },
    reference: {
      provider: "live",
      conversationAlias: "tend:steward:community-live-tend",
      responseFingerprint: "live-followup-fingerprint",
      promptVersion: "test-followup-v1",
    },
    status: "ok",
    notice: "Validated live follow-up.",
  };
}

describe("live Discord follow-up processor", () => {
  it("resolves only from grounded, high-confidence live evidence", async () => {
    const { repository, due } = setup();
    const observation = gateway();
    const processor = new DiscordMindsFollowUpProcessor(
      repository,
      observation,
      minds(liveResult()),
      () => due,
    );

    await expect(
      runDueFollowUp(repository, { now: due, processor, backoffMs: [] }),
    ).resolves.toMatchObject({ status: "completed" });

    expect(observation.fetchAfter).toHaveBeenCalledWith(
      "channel-live",
      "trigger-message",
    );
    expect(repository.getSnapshot()).toMatchObject({
      incidents: [{ status: "resolved" }],
      followUps: [{ status: "completed" }],
      pulse: { communityId: "community-live-tend" },
      auditEvents: expect.arrayContaining([
        expect.objectContaining({ eventType: "mind.followup_reference" }),
      ]),
    });
  });

  it.each([
    {
      name: "low confidence",
      messages: undefined,
      assessment: { confidence: 0.6 },
    },
    {
      name: "no grounded fresh message",
      messages: [],
      assessment: { observedMessageIds: [] },
    },
  ])("routes $name to manual review without a positive pulse", async (test) => {
    const { repository, due } = setup();
    const processor = new DiscordMindsFollowUpProcessor(
      repository,
      gateway(test.messages),
      minds(liveResult(test.assessment)),
      () => due,
    );

    await expect(
      runDueFollowUp(repository, { now: due, processor, backoffMs: [] }),
    ).resolves.toMatchObject({ status: "completed" });
    expect(repository.getSnapshot()).toMatchObject({
      incidents: [{ status: "manual_review" }],
      followUps: [{ status: "completed" }],
      pulse: null,
    });
    expect(() =>
      repository.recordIncidentOutcome(
        repository.getSnapshot().incidents[0]!.id,
        "resolved",
        "A later caller tried to override the uncertain observation.",
        due,
      ),
    ).toThrow(/completed follow-up that resolved/);
  });

  it("fails closed when the Mind is unavailable", async () => {
    const { repository, due } = setup();
    const unavailable = liveResult();
    unavailable.status = "manual_review";
    unavailable.reference.provider = "unavailable";
    const processor = new DiscordMindsFollowUpProcessor(
      repository,
      gateway(),
      minds(unavailable),
      () => due,
    );

    await expect(
      runDueFollowUp(repository, { now: due, processor, backoffMs: [] }),
    ).resolves.toMatchObject({ status: "failed" });
    expect(repository.getSnapshot()).toMatchObject({
      incidents: [{ status: "manual_review" }],
      followUps: [{ status: "failed" }],
      pulse: null,
    });
  });

  it("rejects message references outside the fetched observation", async () => {
    const { repository, due } = setup();
    const processor = new DiscordMindsFollowUpProcessor(
      repository,
      gateway(),
      minds(liveResult({ observedMessageIds: ["fabricated-message"] })),
      () => due,
    );

    await expect(
      runDueFollowUp(repository, { now: due, processor, backoffMs: [] }),
    ).resolves.toMatchObject({ status: "failed" });
  });
});

describe("Discord observation boundary", () => {
  const config: DiscordWorkerConfig = {
    mode: "live",
    baseUrl: "http://localhost:3000",
    workerApiKey: "worker-key",
    botToken: "bot-key",
    clientId: "client-id",
    guildId: "guild-live",
    allowedChannelIds: new Set(["channel-live"]),
    moderatorChannelId: "mods",
    testServerAuthorized: true,
  };

  it("rechecks channel ownership and returns only bounded human text", async () => {
    const fetchMessages = vi.fn().mockResolvedValue(
      new Map([
        [
          "fresh-2",
          {
            id: "fresh-2",
            author: { bot: false, displayName: "Second" },
            content: "later",
            createdTimestamp: 2,
            createdAt: new Date("2026-08-08T01:02:00.000Z"),
          },
        ],
        [
          "bot-message",
          {
            id: "bot-message",
            author: { bot: true, displayName: "Bot" },
            content: "ignore",
            createdTimestamp: 3,
            createdAt: new Date("2026-08-08T01:03:00.000Z"),
          },
        ],
        [
          "fresh-1",
          {
            id: "fresh-1",
            author: { bot: false, displayName: "First" },
            content: "earlier",
            createdTimestamp: 1,
            createdAt: new Date("2026-08-08T01:01:00.000Z"),
          },
        ],
      ]),
    );
    const client = {
      channels: {
        fetch: vi.fn().mockResolvedValue({
          guildId: "guild-live",
          isTextBased: () => true,
          messages: { fetch: fetchMessages },
        }),
      },
    } as unknown as Client;
    const observation = new DiscordJsObservationGateway(client, config);

    await expect(
      observation.fetchAfter("channel-live", "trigger-message"),
    ).resolves.toMatchObject([
      { id: "fresh-1", content: "earlier" },
      { id: "fresh-2", content: "later" },
    ]);
    expect(fetchMessages).toHaveBeenCalledWith({
      after: "trigger-message",
      limit: 50,
    });
  });

  it("rejects channels outside the allowlist before fetching Discord", async () => {
    const fetchChannel = vi.fn();
    const client = {
      channels: { fetch: fetchChannel },
    } as unknown as Client;
    const observation = new DiscordJsObservationGateway(client, config);

    await expect(
      observation.fetchAfter("other-channel", "trigger-message"),
    ).rejects.toThrow(/not allowlisted/);
    expect(fetchChannel).not.toHaveBeenCalled();
  });
});
