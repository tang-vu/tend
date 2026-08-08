import "server-only";

import { createHash } from "node:crypto";
import { LoginRateLimiter } from "./creator-auth-core";

const globalRateLimit = globalThis as typeof globalThis & {
  tendCreatorLoginLimiter?: LoginRateLimiter;
};

export const creatorLoginLimiter =
  globalRateLimit.tendCreatorLoginLimiter ?? new LoginRateLimiter();

if (process.env.NODE_ENV !== "production") {
  globalRateLimit.tendCreatorLoginLimiter = creatorLoginLimiter;
}

export function loginClientKey(request: Request): string {
  const cloudflareAddress = request.headers.get("cf-connecting-ip")?.trim();
  const address =
    cloudflareAddress ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unidentified-client";
  return createHash("sha256").update(address).digest("hex");
}
