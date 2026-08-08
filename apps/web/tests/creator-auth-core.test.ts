import { describe, expect, it } from "vitest";
import {
  constantTimeSecretMatches,
  createCreatorSessionToken,
  LoginRateLimiter,
  readCreatorAuthConfig,
  verifyCreatorSessionToken,
} from "../lib/creator-auth-core";

const secret = "session-secret-with-at-least-thirty-two-characters";

describe("creator authentication primitives", () => {
  it("requires both independent high-entropy configuration values", () => {
    expect(readCreatorAuthConfig({})).toBeNull();
    expect(
      readCreatorAuthConfig({
        TEND_CREATOR_ACCESS_KEY: "short",
        TEND_SESSION_SECRET: secret,
      }),
    ).toBeNull();
    expect(
      readCreatorAuthConfig({
        TEND_CREATOR_ACCESS_KEY:
          "creator-key-with-at-least-thirty-two-characters",
        TEND_SESSION_SECRET: secret,
      }),
    ).toEqual({
      accessKey: "creator-key-with-at-least-thirty-two-characters",
      sessionSecret: secret,
    });
    expect(
      readCreatorAuthConfig({
        TEND_CREATOR_ACCESS_KEY: secret,
        TEND_SESSION_SECRET: secret,
      }),
    ).toBeNull();
  });

  it("compares creator credentials without a length-dependent equality path", () => {
    expect(constantTimeSecretMatches("correct", "correct")).toBe(true);
    expect(constantTimeSecretMatches("wrong", "correct")).toBe(false);
    expect(constantTimeSecretMatches("x", "a much longer secret")).toBe(false);
  });

  it("accepts only untampered, unexpired creator sessions", async () => {
    const issuedAt = new Date("2026-08-08T00:00:00.000Z");
    const token = await createCreatorSessionToken(secret, issuedAt);
    await expect(
      verifyCreatorSessionToken(
        token,
        secret,
        new Date("2026-08-08T07:59:59.000Z"),
      ),
    ).resolves.toEqual({ subject: "creator", role: "creator" });
    await expect(
      verifyCreatorSessionToken(
        token,
        secret,
        new Date("2026-08-08T08:00:01.000Z"),
      ),
    ).resolves.toBeNull();
    await expect(
      verifyCreatorSessionToken(token, `${secret}-wrong`, issuedAt),
    ).resolves.toBeNull();
  });

  it("locks a client after five failures and resets after the window", () => {
    const limiter = new LoginRateLimiter(5, 60_000);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      limiter.recordFailure("client", 1_000);
    }
    expect(limiter.retryAfterSeconds("client", 1_001)).toBe(60);
    expect(limiter.retryAfterSeconds("client", 61_001)).toBe(0);
    limiter.recordFailure("client", 70_000);
    limiter.reset("client");
    expect(limiter.retryAfterSeconds("client", 70_001)).toBe(0);
  });
});
