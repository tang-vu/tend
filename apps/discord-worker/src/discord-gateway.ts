import { type Client, type Guild, type SendableChannels } from "discord.js";
import type { DiscordWorkerConfig } from "./config";
import type { DiscordActionGateway } from "./executor";

export class DiscordJsActionGateway implements DiscordActionGateway {
  constructor(
    private readonly client: Client,
    private readonly config: DiscordWorkerConfig,
  ) {}

  async sendChannelMessage(content: string): Promise<string> {
    const channelId = [...this.config.allowedChannelIds][0];
    if (!channelId) throw new Error("No allowlisted channel is configured.");
    const channel = await this.client.channels.fetch(channelId);
    if (!channel?.isSendable())
      throw new Error("Configured channel cannot receive messages.");
    const sent = await (channel as SendableChannels).send({ content });
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
    const user = await this.client.users.fetch(targetId);
    const sent = await user.send({ content });
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
