import type { Client } from "discord.js";
import type { DiscordWorkerConfig } from "./config";
import type {
  DiscordObservationGateway,
  FreshDiscordMessage,
} from "./followup";

export class DiscordJsObservationGateway implements DiscordObservationGateway {
  constructor(
    private readonly client: Client,
    private readonly config: DiscordWorkerConfig,
  ) {}

  async fetchAfter(
    channelId: string,
    afterMessageId: string,
  ): Promise<FreshDiscordMessage[]> {
    if (!this.config.allowedChannelIds.has(channelId)) {
      throw new Error("Follow-up observation channel is not allowlisted.");
    }
    const channel = await this.client.channels.fetch(channelId);
    if (
      !channel?.isTextBased() ||
      !("messages" in channel) ||
      !("guildId" in channel) ||
      channel.guildId !== this.config.guildId
    ) {
      throw new Error(
        "Follow-up observation requires an allowlisted guild text channel.",
      );
    }

    const messages = await channel.messages.fetch({
      after: afterMessageId,
      limit: 50,
    });
    return [...messages.values()]
      .filter((message) => !message.author.bot && message.content.trim())
      .sort((left, right) => left.createdTimestamp - right.createdTimestamp)
      .map((message) => ({
        id: message.id,
        author: message.author.displayName.slice(0, 128),
        content: message.content.slice(0, 4_000),
        createdAt: message.createdAt.toISOString(),
      }));
  }
}
