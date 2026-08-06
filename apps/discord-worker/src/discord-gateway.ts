import { type Client, type Guild, type SendableChannels } from "discord.js";
import type { DiscordWorkerConfig } from "./config";
import type { DiscordActionGateway } from "./executor";

export class DiscordJsActionGateway implements DiscordActionGateway {
  constructor(
    private readonly client: Client,
    private readonly config: DiscordWorkerConfig,
  ) {}

  async sendChannelMessage(
    content: string,
    requestedChannelId: string | null,
  ): Promise<string> {
    const configuredChannels = [...this.config.allowedChannelIds];
    const channelId = requestedChannelId ?? configuredChannels[0];
    if (!channelId || !this.config.allowedChannelIds.has(channelId)) {
      throw new Error("Public nudge destination is not allowlisted.");
    }
    if (!requestedChannelId && configuredChannels.length !== 1) {
      throw new Error(
        "Public nudge requires an explicit source channel when multiple channels are allowlisted.",
      );
    }
    const channel = await this.client.channels.fetch(channelId);
    if (!channel?.isSendable())
      throw new Error("Configured channel cannot receive messages.");
    const sent = await (channel as SendableChannels).send({
      content,
      allowedMentions: { parse: [] },
    });
    return `Discord public nudge sent with message ${sent.id}.`;
  }

  async sendPrivateReminder(
    targetId: string,
    content: string,
  ): Promise<string> {
    if (!this.config.testServerAuthorized) {
      throw new Error(
        "Private reminders require explicit test-server authorization.",
      );
    }
    const guild = await this.getAllowlistedGuild();
    const member = await guild.members.fetch(targetId);
    const sent = await member.send({
      content,
      allowedMentions: { parse: [] },
    });
    return `Discord private reminder sent with message ${sent.id}.`;
  }

  async notifyModerator(content: string): Promise<string> {
    if (!this.config.moderatorChannelId)
      throw new Error("Moderator channel is not configured.");
    const channel = await this.client.channels.fetch(
      this.config.moderatorChannelId,
    );
    if (!channel?.isSendable())
      throw new Error("Moderator channel cannot receive messages.");
    const sent = await (channel as SendableChannels).send({
      content: `TEND review requested:\n${content}`,
      allowedMentions: { parse: [] },
    });
    return `Discord moderator notification sent with message ${sent.id}.`;
  }

  async timeoutMember(
    targetId: string,
    durationMs: number,
    reason: string,
  ): Promise<string> {
    const guild = await this.getAllowlistedGuild();
    const member = await guild.members.fetch(targetId);
    await member.timeout(
      durationMs,
      `TEND creator-approved: ${reason.slice(0, 400)}`,
    );
    return `Discord timeout executed for ${durationMs}ms after explicit approval.`;
  }

  private async getAllowlistedGuild(): Promise<Guild> {
    if (!this.config.guildId) throw new Error("Guild is not configured.");
    return this.client.guilds.fetch(this.config.guildId);
  }
}
