import {
  ActivityType,
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  Partials,
  type Message,
} from "discord.js";
import {
  DemoFollowUpProcessor,
  openDatabase,
  runDueFollowUp,
  SqliteTendRepository,
} from "@tend/db";
import { createLiveMindsAdapterFromEnv } from "@tend/minds";
import { readWorkerConfig } from "./config";
import { DiscordJsActionGateway } from "./discord-gateway";
import { DiscordJsObservationGateway } from "./discord-observation";
import { executeApprovedDiscordAction } from "./executor";
import { filterDiscordMessage, type DiscordMessageEnvelope } from "./filter";
import { DiscordMindsFollowUpProcessor } from "./followup";
import { HttpTendIncidentIntake, type ContextMessage } from "./intake";

const config = readWorkerConfig();
const repository = new SqliteTendRepository(openDatabase());

async function runPersistedWork(): Promise<void> {
  if (config.mode === "demo") {
    await runDueFollowUp(repository, {
      processor: new DemoFollowUpProcessor(),
    });
    return;
  }
  if (!client.isReady() || !liveFollowUpProcessor) return;
  const action = repository.claimNextApprovedAction();
  if (action) {
    try {
      const outcome = await executeApprovedDiscordAction(
        action,
        new DiscordJsActionGateway(client, config),
      );
      if (outcome.executed)
        repository.markActionExecuted(action.id, outcome.result);
      else repository.markActionFailed(action.id, outcome.result);
    } catch (error) {
      repository.markActionFailed(
        action.id,
        error instanceof Error
          ? error.message
          : "Unknown Discord execution error.",
      );
    }
  }
  await runDueFollowUp(repository, { processor: liveFollowUpProcessor });
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

const liveFollowUpProcessor =
  config.mode === "live"
    ? new DiscordMindsFollowUpProcessor(
        repository,
        new DiscordJsObservationGateway(client, config),
        createLiveMindsAdapterFromEnv(),
      )
    : null;

async function nearbyContext(message: Message): Promise<ContextMessage[]> {
  if (
    message.channel.type === ChannelType.DM ||
    !("messages" in message.channel)
  ) {
    return [
      {
        author: message.author.displayName,
        content: message.content,
        offset: "now",
      },
    ];
  }
  const earlier = await message.channel.messages.fetch({
    before: message.id,
    limit: 8,
  });
  const rows = [...earlier.values()]
    .reverse()
    .filter((item) => !item.author.bot)
    .map((item, index, list) => ({
      author: item.author.displayName,
      content: item.content.slice(0, 4_000),
      offset: `−${list.length - index}m`,
    }));
  rows.push({
    author: message.author.displayName,
    content: message.content,
    offset: "now",
  });
  return rows;
}

client.on(Events.MessageCreate, async (message) => {
  const envelope: DiscordMessageEnvelope = {
    id: message.id,
    guildId: message.guildId,
    channelId: message.channelId,
    content: message.content,
    author: {
      id: message.author.id,
      displayName: message.author.displayName,
      bot: message.author.bot,
    },
  };
  const filtered = filterDiscordMessage(
    envelope,
    config,
    client.user?.id ?? null,
  );
  if (!filtered.accepted) return;
  if (!config.workerApiKey) return;
  process.stdout.write(
    `${JSON.stringify({
      event: "discord_message_accepted",
      externalMessageId: message.id,
      guildMatched: message.guildId === config.guildId,
      channelMatched: config.allowedChannelIds.has(message.channelId),
      rawMessagePrinted: false,
    })}\n`,
  );
  try {
    const intake = new HttpTendIncidentIntake(
      config.baseUrl,
      config.workerApiKey,
    );
    const result = await intake.submit(envelope, await nearbyContext(message));
    process.stdout.write(
      `${JSON.stringify({
        event: "discord_intake_succeeded",
        externalMessageId: message.id,
        duplicate: result.duplicate,
        incidentIdPresent: Boolean(result.incidentId),
        rawMessagePrinted: false,
      })}\n`,
    );
  } catch (error) {
    process.stderr.write(
      `${JSON.stringify({
        event: "discord_intake_failed",
        externalMessageId: message.id,
        error: error instanceof Error ? error.name : "UnknownError",
        secretPrinted: false,
        rawMessagePrinted: false,
      })}\n`,
    );
  }
});

client.once(Events.ClientReady, (readyClient) => {
  readyClient.user.setPresence({
    status: "online",
    activities: [
      { name: "community repair loops", type: ActivityType.Watching },
    ],
  });
  process.stdout.write(
    `${JSON.stringify({
      event: "discord_worker_ready",
      botUserId: readyClient.user.id,
      guildAllowlistCount: config.guildId ? 1 : 0,
      channelAllowlistCount: config.allowedChannelIds.size,
      secretPrinted: false,
    })}\n`,
  );
});

let persistedWorkRunning = false;
const timer = setInterval(() => {
  if (persistedWorkRunning) return;
  persistedWorkRunning = true;
  void runPersistedWork()
    .catch((error) => {
      process.stderr.write(
        `${JSON.stringify({
          event: "persisted_work_failed",
          error: error instanceof Error ? error.name : "UnknownError",
          secretPrinted: false,
          rawMessagePrinted: false,
        })}\n`,
      );
    })
    .finally(() => {
      persistedWorkRunning = false;
    });
}, 1_000);

async function shutdown() {
  clearInterval(timer);
  client.destroy();
  repository.getSnapshot();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

if (config.mode === "live" && config.botToken) {
  await client.login(config.botToken);
} else {
  process.stdout.write(
    `${JSON.stringify({
      event: "discord_gateway_skipped",
      reason: "TEND_MODE is demo or live credentials are absent",
      followUpWorkerRunning: true,
      secretPrinted: false,
    })}\n`,
  );
}
