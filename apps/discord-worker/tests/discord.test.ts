import { describe, expect, it, vi } from "vitest";
import type { ProposedAction } from "@tend/core";
import type { DiscordWorkerConfig } from "../src/config";
import {
  executeApprovedDiscordAction,
  type DiscordActionGateway,
} from "../src/executor";
import { filterDiscordMessage } from "../src/filter";

const config: DiscordWorkerConfig = {
  mode: "live",
  baseUrl: "http://localhost:3000",
  workerApiKey: "worker-key",
  botToken: "bot-key",
  clientId: "client",
  guildId: "guild-1",
  allowedChannelIds: new Set(["channel-1"]),
  moderatorChannelId: "mods",
  testServerAuthorized: true,
};

const message = {
  id: "message-1",
  guildId: "guild-1",
  channelId: "channel-1",
  content: "hello",
  author: { id: "member-1", displayName: "Member", bot: false },
};

function action(overrides: Partial<ProposedAction> = {}): ProposedAction {
  return {
    id: "action-1",
    incidentId: "incident-1",
    type: "private_reminder",
    targetId: "member-1",
    content: "Please respect the known boundary.",
    riskClass: "consequential",
    requiresApproval: true,
    status: "approved",
    idempotencyKey: "key",
    proposedAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
    executedAt: null,
    executionResult: null,
    ...overrides,
  };
}

function gateway(): DiscordActionGateway {
  return {
    sendChannelMessage: vi.fn().mockResolvedValue("sent"),
    sendPrivateReminder: vi.fn().mockResolvedValue("dm sent"),
    notifyModerator: vi.fn().mockResolvedValue("moderator notified"),
    timeoutMember: vi.fn().mockResolvedValue("timed out"),
  };
}

describe("Discord message boundary", () => {
  it("ignores bot messages including itself", () => {
    expect(
      filterDiscordMessage(
        { ...message, author: { ...message.author, bot: true } },
        config,
        null,
      ),
    ).toMatchObject({ accepted: false });
    expect(filterDiscordMessage(message, config, "member-1")).toMatchObject({
      accepted: false,
      reason: "self_message",
    });
  });

  it("rejects unconfigured guilds and channels", () => {
    expect(
      filterDiscordMessage({ ...message, guildId: "other" }, config, null),
    ).toMatchObject({ accepted: false, reason: "wrong_guild" });
    expect(
      filterDiscordMessage({ ...message, channelId: "other" }, config, null),
    ).toMatchObject({ accepted: false, reason: "channel_not_allowed" });
  });

  it("accepts only the explicit allowlist", () => {
    expect(filterDiscordMessage(message, config, null)).toEqual({
      accepted: true,
    });
  });
});

describe("Discord action execution", () => {
  it("executes only an explicitly approved action", async () => {
    const adapter = gateway();
    expect(
      await executeApprovedDiscordAction(
        action({ status: "proposed" }),
        adapter,
      ),
    ).toMatchObject({ executed: false });
    expect(adapter.sendPrivateReminder).not.toHaveBeenCalled();
    expect(await executeApprovedDiscordAction(action(), adapter)).toMatchObject(
      { executed: true },
    );
    expect(adapter.sendPrivateReminder).toHaveBeenCalledOnce();
  });

  it("binds public nudges to the approved target channel", async () => {
    const adapter = gateway();
    await executeApprovedDiscordAction(
      action({ type: "public_nudge", targetId: "channel-1" }),
      adapter,
    );
    expect(adapter.sendChannelMessage).toHaveBeenCalledWith(
      "Please respect the known boundary.",
      "channel-1",
    );
  });

  it("never implements message deletion and gates timeout by approval", async () => {
    const adapter = gateway();
    expect(
      await executeApprovedDiscordAction(
        action({ type: "delete_message" }),
        adapter,
      ),
    ).toMatchObject({ executed: false });
    expect(
      await executeApprovedDiscordAction(
        action({ type: "execute_timeout", status: "proposed" }),
        adapter,
      ),
    ).toMatchObject({ executed: false });
    expect(
      await executeApprovedDiscordAction(
        action({ type: "execute_timeout" }),
        adapter,
      ),
    ).toMatchObject({ executed: true });
    expect(adapter.timeoutMember).toHaveBeenCalledOnce();
  });
});
