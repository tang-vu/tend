import "server-only";

import {
  DemoFollowUpProcessor,
  FailClosedFollowUpProcessor,
  openDatabase,
  runDueFollowUp,
  SqliteTendRepository,
  type TendRepository,
} from "@tend/db";
import { selectMindsProvider } from "@tend/core";
import {
  createLiveMindsAdapterFromEnv,
  MockMindsAdapter,
  UnavailableMindsAdapter,
  type MindsAdapter,
} from "@tend/minds";

const globalState = globalThis as typeof globalThis & {
  __tendRepository?: TendRepository;
  __tendMindsAdapter?: MindsAdapter;
  __tendWorkerTimer?: ReturnType<typeof setInterval>;
};

export function getRepository(): TendRepository {
  globalState.__tendRepository ??= new SqliteTendRepository(openDatabase());
  return globalState.__tendRepository;
}

export function getMindsAdapter(): MindsAdapter {
  if (globalState.__tendMindsAdapter) return globalState.__tendMindsAdapter;
  const selected = selectMindsProvider(
    process.env.TEND_MODE,
    process.env.MINDS_MODE,
  );
  if (selected === "mock") {
    globalState.__tendMindsAdapter = new MockMindsAdapter();
    return globalState.__tendMindsAdapter;
  }
  if (selected === "unavailable") {
    globalState.__tendMindsAdapter = new UnavailableMindsAdapter(
      "TEND_MODE and MINDS_MODE must both select demo/mock or live/live. Manual review is required.",
    );
    return globalState.__tendMindsAdapter;
  }
  try {
    globalState.__tendMindsAdapter = createLiveMindsAdapterFromEnv();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Live Minds configuration is unavailable.";
    globalState.__tendMindsAdapter = new UnavailableMindsAdapter(message);
  }
  return globalState.__tendMindsAdapter;
}

export async function runWorkerOnce() {
  const processor =
    process.env.TEND_MODE === "live"
      ? new FailClosedFollowUpProcessor()
      : new DemoFollowUpProcessor();
  return runDueFollowUp(getRepository(), { processor });
}

export function ensureLocalWorker(): void {
  if (
    globalState.__tendWorkerTimer ||
    process.env.NODE_ENV === "test" ||
    process.env.TEND_MODE === "live"
  )
    return;
  globalState.__tendWorkerTimer = setInterval(() => {
    void runWorkerOnce().catch(() => {
      // The repository records bounded worker failures. Secrets and raw messages are never logged.
    });
  }, 750);
  globalState.__tendWorkerTimer.unref();
}

export function readiness() {
  const liveMindsConfigured = Boolean(
    process.env.MINDS_BUILDER_API_KEY && process.env.MINDS_MIND_ID,
  );
  const discordConfigured = Boolean(
    process.env.DISCORD_BOT_TOKEN &&
      process.env.DISCORD_GUILD_ID &&
      process.env.DISCORD_ALLOWED_CHANNEL_IDS,
  );
  return {
    mockMinds: "ready" as const,
    liveMinds: liveMindsConfigured
      ? ("configured_unverified" as const)
      : ("not_configured" as const),
    discord: discordConfigured
      ? ("configured_unverified" as const)
      : ("not_configured" as const),
    customSkill: {
      localSpec: true,
      deployed: process.env.TEND_SKILL_DEPLOYED === "true",
      equipped: process.env.TEND_SKILL_EQUIPPED === "true",
      verified: process.env.TEND_SKILL_VERIFIED === "true",
    },
    activeProvider: getMindsAdapter().mode,
    serverSecretsExposed: false,
  };
}
