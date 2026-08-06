import type { DiscordWorkerConfig } from "./config";

export interface DiscordMessageEnvelope {
  id: string;
  guildId: string | null;
  channelId: string;
  content: string;
  author: {
    id: string;
    displayName: string;
    bot: boolean;
  };
}

export type MessageFilterResult =
  | { accepted: true }
  | {
      accepted: false;
      reason:
        | "demo_mode"
        | "bot_message"
        | "self_message"
        | "wrong_guild"
        | "channel_not_allowed"
        | "empty";
    };

export function filterDiscordMessage(
  message: DiscordMessageEnvelope,
  config: DiscordWorkerConfig,
  botUserId: string | null,
): MessageFilterResult {
  if (config.mode !== "live") return { accepted: false, reason: "demo_mode" };
  if (message.author.bot) return { accepted: false, reason: "bot_message" };
  if (botUserId && message.author.id === botUserId)
    return { accepted: false, reason: "self_message" };
  if (!message.guildId || message.guildId !== config.guildId) {
    return { accepted: false, reason: "wrong_guild" };
  }
  if (!config.allowedChannelIds.has(message.channelId)) {
    return { accepted: false, reason: "channel_not_allowed" };
  }
  if (!message.content.trim()) return { accepted: false, reason: "empty" };
  return { accepted: true };
}
