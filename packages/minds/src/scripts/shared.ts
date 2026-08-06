import "dotenv/config";
import { createMindsClient } from "@animocabrands/minds-client-lib";

export function requireMindsEnvironment() {
  const builderApiKey = process.env.MINDS_BUILDER_API_KEY;
  const mindId = process.env.MINDS_MIND_ID;
  if (!builderApiKey || !mindId) {
    throw new Error(
      "Missing server-side MINDS_BUILDER_API_KEY or MINDS_MIND_ID. Put them in ignored .env storage; never paste them into chat.",
    );
  }
  return {
    mindId,
    client: createMindsClient({ builderApiKey }),
  };
}

export function printSafeError(error: unknown): never {
  const raw = error instanceof Error ? error.message : "Unknown error";
  const secrets = [
    process.env.MINDS_BUILDER_API_KEY,
    process.env.TEND_SKILL_API_KEY,
    process.env.TEND_WORKER_API_KEY,
  ].filter((value): value is string => Boolean(value));
  const message = secrets.reduce(
    (safe, secret) => safe.replaceAll(secret, "[REDACTED]"),
    raw,
  );
  process.stderr.write(`${JSON.stringify({ ok: false, error: message })}\n`);
  process.exit(1);
}
