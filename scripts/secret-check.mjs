import { execFileSync } from "node:child_process";
import fs from "node:fs";

const output = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
);

const patterns = [
  {
    name: "private key",
    regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  },
  { name: "OpenAI-style secret", regex: /\bsk-[A-Za-z0-9_-]{24,}\b/ },
  {
    name: "Discord bot token",
    regex: /\b(?:M|N)[A-Za-z\d]{23,}\.[A-Za-z\d_-]{6,}\.[A-Za-z\d_-]{20,}\b/,
  },
  {
    name: "assigned high-risk credential",
    regex:
      /^(?:MINDS_BUILDER_API_KEY|DISCORD_BOT_TOKEN|TEND_SKILL_API_KEY|TEND_WORKER_API_KEY)[ \t]*=[ \t]*["']?[^\s"'<>]{12,}/m,
  },
];

const findings = [];
for (const file of output.split("\0").filter(Boolean)) {
  if (
    file === "pnpm-lock.yaml" ||
    file.endsWith(".png") ||
    file.endsWith(".zip") ||
    file.startsWith("test-results/")
  ) {
    continue;
  }
  const stats = fs.statSync(file);
  if (stats.size > 2_000_000) continue;
  const content = fs.readFileSync(file, "utf8");
  for (const pattern of patterns) {
    if (pattern.regex.test(content)) findings.push(`${file}: ${pattern.name}`);
  }
}

if (findings.length > 0) {
  process.stderr.write(
    `Potential committed secrets found:\n${findings.join("\n")}\n`,
  );
  process.exit(1);
}

process.stdout.write(
  "Secret check passed: no high-risk credential patterns found.\n",
);
