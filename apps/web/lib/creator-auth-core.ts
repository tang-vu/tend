import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";

export const CREATOR_SESSION_COOKIE = "tend_creator_session";
export const CREATOR_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
const ISSUER = "tend";
const AUDIENCE = "tend-creator-dashboard";

export type CreatorAuthConfig = {
  accessKey: string;
  sessionSecret: string;
};

export type CreatorSession = {
  subject: "creator";
  role: "creator";
};

export function readCreatorAuthConfig(
  environment: Readonly<Record<string, string | undefined>>,
): CreatorAuthConfig | null {
  const accessKey = environment.TEND_CREATOR_ACCESS_KEY;
  const sessionSecret = environment.TEND_SESSION_SECRET;
  if (!accessKey || !sessionSecret) return null;
  if (
    accessKey.length < 32 ||
    sessionSecret.length < 32 ||
    constantTimeSecretMatches(accessKey, sessionSecret)
  ) {
    return null;
  }
  return { accessKey, sessionSecret };
}

export function constantTimeSecretMatches(
  supplied: string,
  expected: string,
): boolean {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(supplied), digest(expected));
}

function signingKey(secret: string) {
  return new TextEncoder().encode(secret);
}

export async function createCreatorSessionToken(
  secret: string,
  now = new Date(),
): Promise<string> {
  const issuedAt = Math.floor(now.getTime() / 1000);
  return new SignJWT({ role: "creator" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject("creator")
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt(issuedAt)
    .setJti(randomUUID())
    .setExpirationTime(issuedAt + CREATOR_SESSION_MAX_AGE_SECONDS)
    .sign(signingKey(secret));
}

export async function verifyCreatorSessionToken(
  token: string,
  secret: string,
  now = new Date(),
): Promise<CreatorSession | null> {
  try {
    const { payload } = await jwtVerify(token, signingKey(secret), {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
      currentDate: now,
    });
    if (payload.sub !== "creator" || payload.role !== "creator") return null;
    return { subject: "creator", role: "creator" };
  } catch {
    return null;
  }
}

export class LoginRateLimiter {
  private readonly attempts = new Map<
    string,
    { failures: number; resetAt: number }
  >();

  constructor(
    private readonly maximumFailures = 5,
    private readonly windowMs = 15 * 60_000,
  ) {}

  retryAfterSeconds(key: string, now = Date.now()): number {
    const attempt = this.attempts.get(key);
    if (!attempt) return 0;
    if (attempt.resetAt <= now) {
      this.attempts.delete(key);
      return 0;
    }
    return attempt.failures >= this.maximumFailures
      ? Math.max(1, Math.ceil((attempt.resetAt - now) / 1000))
      : 0;
  }

  recordFailure(key: string, now = Date.now()): void {
    const attempt = this.attempts.get(key);
    if (!attempt || attempt.resetAt <= now) {
      if (this.attempts.size >= 10_000) {
        const oldestKey = this.attempts.keys().next().value as
          | string
          | undefined;
        if (oldestKey) this.attempts.delete(oldestKey);
      }
      this.attempts.set(key, { failures: 1, resetAt: now + this.windowMs });
      return;
    }
    attempt.failures += 1;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}
