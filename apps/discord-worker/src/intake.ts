import type { DiscordMessageEnvelope } from "./filter";

export interface ContextMessage {
  author: string;
  content: string;
  offset: string;
}

export interface TendIncidentIntake {
  submit(
    message: DiscordMessageEnvelope,
    conversationContext: ContextMessage[],
  ): Promise<{ duplicate: boolean; incidentId?: string }>;
}

export class HttpTendIncidentIntake implements TendIncidentIntake {
  constructor(
    private readonly baseUrl: string,
    private readonly workerApiKey: string,
  ) {}

  async submit(
    message: DiscordMessageEnvelope,
    conversationContext: ContextMessage[],
  ) {
    const response = await fetch(
      `${this.baseUrl}/api/internal/discord/messages`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.workerApiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          externalMessageId: message.id,
          guildId: message.guildId,
          channelId: message.channelId,
          actorId: message.author.id,
          actorDisplayName: message.author.displayName,
          message: message.content,
          conversationContext,
        }),
        signal: AbortSignal.timeout(190_000),
      },
    );
    const payload = (await response.json()) as {
      ok?: boolean;
      duplicate?: boolean;
      incidentId?: string;
      error?: string;
    };
    if (!response.ok || !payload.ok) {
      throw new Error(
        payload.error ?? `TEND intake returned HTTP ${response.status}.`,
      );
    }
    return {
      duplicate: payload.duplicate ?? false,
      ...(payload.incidentId ? { incidentId: payload.incidentId } : {}),
    };
  }
}
