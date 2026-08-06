import { config as loadDotenv } from "dotenv";
import path from "node:path";
import { z } from "zod";

loadDotenv({
  path: path.resolve(process.cwd(), "../../.env.local"),
  quiet: true,
});
loadDotenv({ path: path.resolve(process.cwd(), "../../.env"), quiet: true });

const rawSchema = z.object({
  TEND_MODE: z.enum(["demo", "live"]).default("demo"),
  TEND_BASE_URL: z.url().default("http://localhost:3000"),
  TEND_WORKER_API_KEY: z.string().optional(),
  DISCORD_BOT_TOKEN: z.string().optional(),
  DISCORD_CLIENT_ID: z.string().optional(),
  DISCORD_GUILD_ID: z.string().optional(),
  DISCORD_ALLOWED_CHANNEL_IDS: z.string().optional(),
  DISCORD_MOD_CHANNEL_ID: z.string().optional(),
  DISCORD_TEST_SERVER_AUTHORIZED: z.enum(["true", "false"]).default("false"),
});

export interface DiscordWorkerConfig {
  mode: "demo" | "live";
  baseUrl: string;
  workerApiKey: string | null;
  botToken: string | null;
  clientId: string | null;
  guildId: string | null;
  allowedChannelIds: Set<string>;
  moderatorChannelId: string | null;
  testServerAuthorized: boolean;
}

export function readWorkerConfig(
  environment: Record<string, string | undefined> = process.env,
): DiscordWorkerConfig {
  const raw = rawSchema.parse(environment);
  const config: DiscordWorkerConfig = {
    mode: raw.TEND_MODE,
    baseUrl: raw.TEND_BASE_URL.replace(/\/$/, ""),
    workerApiKey: raw.TEND_WORKER_API_KEY ?? null,
    botToken: raw.DISCORD_BOT_TOKEN ?? null,
    clientId: raw.DISCORD_CLIENT_ID ?? null,
    guildId: raw.DISCORD_GUILD_ID ?? null,
    allowedChannelIds: new Set(
      (raw.DISCORD_ALLOWED_CHANNEL_IDS ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
    moderatorChannelId: raw.DISCORD_MOD_CHANNEL_ID ?? null,
    testServerAuthorized: raw.DISCORD_TEST_SERVER_AUTHORIZED === "true",
  };

  if (config.mode === "live") {
    const missing = [
      !config.workerApiKey && "TEND_WORKER_API_KEY",
      !config.botToken && "DISCORD_BOT_TOKEN",
      !config.guildId && "DISCORD_GUILD_ID",
      config.allowedChannelIds.size === 0 && "DISCORD_ALLOWED_CHANNEL_IDS",
      !config.testServerAuthorized && "DISCORD_TEST_SERVER_AUTHORIZED=true",
    ].filter(Boolean);
    if (missing.length > 0) {
      throw new Error(
        `Live Discord worker configuration is incomplete: ${missing.join(", ")}.`,
      );
    }
  }
  return config;
}
