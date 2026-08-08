const fs = require("node:fs");
const path = require("node:path");
const { loadEnvFile } = require("node:process");

const repositoryRoot = path.resolve(__dirname, "../..");
const dataDirectory = path.join(repositoryRoot, "data");
const privateEnvironmentPath = path.join(repositoryRoot, ".env");
const privateKeys = [
  "DISCORD_ALLOWED_CHANNEL_IDS",
  "DISCORD_BOT_TOKEN",
  "DISCORD_CLIENT_ID",
  "DISCORD_GUILD_ID",
  "DISCORD_MOD_CHANNEL_ID",
  "DISCORD_TEST_SERVER_AUTHORIZED",
  "MINDS_BUILDER_API_KEY",
  "MINDS_MIND_ID",
  "MINDS_REPLY_TIMEOUT_MS",
  "TEND_CREATOR_ACCESS_KEY",
  "TEND_SESSION_SECRET",
  "TEND_WORKER_API_KEY",
];

if (!fs.existsSync(privateEnvironmentPath)) {
  throw new Error(
    "The ignored root .env is required for live integration processes.",
  );
}
loadEnvFile(privateEnvironmentPath);

const missing = privateKeys.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(
    `Live integration configuration is incomplete: ${missing.join(", ")}.`,
  );
}

const privateEnvironment = Object.fromEntries(
  privateKeys.map((key) => [key, process.env[key]]),
);
const liveDatabasePath = path.join(dataDirectory, "tend-live-test.db");
const tsxCli = require.resolve("tsx/cli");

module.exports = {
  apps: [
    {
      name: "tend-live-web",
      cwd: repositoryRoot,
      script: path.join(
        repositoryRoot,
        "apps",
        "web",
        ".next",
        "standalone",
        "apps",
        "web",
        "server.js",
      ),
      interpreter: process.execPath,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      time: true,
      out_file: path.join(dataDirectory, "pm2", "tend-live-web.out.log"),
      error_file: path.join(dataDirectory, "pm2", "tend-live-web.err.log"),
      env: {
        ...privateEnvironment,
        NODE_ENV: "production",
        TEND_MODE: "live",
        MINDS_MODE: "live",
        TEND_BASE_URL: "http://127.0.0.1:3001",
        TEND_PUBLIC_ORIGIN: "http://127.0.0.1:3001",
        TEND_DB_PATH: liveDatabasePath,
        HOSTNAME: "127.0.0.1",
        PORT: "3001",
      },
    },
    {
      name: "tend-discord-worker",
      cwd: repositoryRoot,
      script: process.execPath,
      args: `"${tsxCli}" "${path.join(repositoryRoot, "apps", "discord-worker", "src", "index.ts")}"`,
      interpreter: "none",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      time: true,
      out_file: path.join(dataDirectory, "pm2", "tend-discord-worker.out.log"),
      error_file: path.join(
        dataDirectory,
        "pm2",
        "tend-discord-worker.err.log",
      ),
      env: {
        ...privateEnvironment,
        NODE_ENV: "production",
        TEND_MODE: "live",
        MINDS_MODE: "live",
        TEND_BASE_URL: "http://127.0.0.1:3001",
        TEND_DB_PATH: liveDatabasePath,
      },
    },
  ],
};
