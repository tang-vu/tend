const path = require("node:path");

const repositoryRoot = path.resolve(__dirname, "../..");
const dataDirectory = path.join(repositoryRoot, "data");

module.exports = {
  apps: [
    {
      name: "tend-web",
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
      out_file: path.join(dataDirectory, "pm2", "tend-web.out.log"),
      error_file: path.join(dataDirectory, "pm2", "tend-web.err.log"),
      env: {
        NODE_ENV: "production",
        TEND_MODE: "demo",
        MINDS_MODE: "mock",
        MINDS_BUILDER_API_KEY: "",
        MINDS_MIND_ID: "",
        TEND_BASE_URL: "https://tend.tangvu.dev",
        TEND_PUBLIC_ORIGIN: "https://tend.tangvu.dev",
        TEND_CREATOR_ACCESS_KEY: "",
        TEND_SESSION_SECRET: "",
        TEND_DB_PATH: path.join(dataDirectory, "tend-hosted.db"),
        DEMO_ACCELERATION_FACTOR: "1",
        HOSTNAME: "127.0.0.1",
        PORT: "3000",
      },
    },
    {
      name: "tend-tunnel",
      cwd: repositoryRoot,
      script:
        process.env.CLOUDFLARED_PATH ||
        "C:\\Program Files (x86)\\cloudflared\\cloudflared.exe",
      args: `tunnel --no-autoupdate --config "${path.join(dataDirectory, "cloudflared-tend.yml")}" run`,
      interpreter: "none",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      time: true,
      out_file: path.join(dataDirectory, "pm2", "tend-tunnel.out.log"),
      error_file: path.join(dataDirectory, "pm2", "tend-tunnel.err.log"),
    },
  ],
};
