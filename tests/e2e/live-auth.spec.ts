import { expect, test } from "@playwright/test";

const origin = "http://127.0.0.1:3001";
const accessKey = "e2e-creator-access-key-with-32-characters";

test("live dashboard fails closed, creates a secure session, and signs out", async ({
  page,
  request,
}) => {
  const snapshotWithoutSession = await request.get("/api/demo/state");
  expect(snapshotWithoutSession.status()).toBe(401);

  const crossOriginLogin = await request.post("/api/auth/login", {
    headers: { origin: "https://attacker.invalid" },
    data: { accessKey },
  });
  expect(crossOriginLogin.status()).toBe(403);

  await page.goto("/community");
  await expect(
    page.getByRole("heading", { name: "Creator access needs authentication." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Creator sign in" }).click();
  await expect(
    page.getByRole("heading", { name: "Return to your community." }),
  ).toBeVisible();

  await page.getByLabel("Creator access key").fill("wrong-key");
  await page.getByRole("button", { name: "Open creator dashboard" }).click();
  await expect(page.locator(".auth-error")).toHaveText(
    "Invalid creator credentials.",
  );

  await page.getByLabel("Creator access key").fill(accessKey);
  await page.getByRole("button", { name: "Open creator dashboard" }).click();
  await expect(
    page.getByRole("heading", { name: "Good evening, creator." }),
  ).toBeVisible();
  await expect(page.getByText("Live mode", { exact: true })).toBeVisible();
  await expect(page.getByText("Demo mode", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Demo controller", exact: true }),
  ).toHaveCount(0);

  const sessionCookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === "tend_creator_session",
  );
  expect(sessionCookie).toMatchObject({ httpOnly: true, sameSite: "Strict" });
  expect(sessionCookie?.value).not.toContain(accessKey);

  const authenticatedSnapshot = await page.request.get("/api/demo/state");
  expect(authenticatedSnapshot.status()).toBe(200);

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(
    page.getByRole("heading", { name: "Return to your community." }),
  ).toBeVisible();
  expect(
    (await page.context().cookies()).some(
      (cookie) => cookie.name === "tend_creator_session",
    ),
  ).toBe(false);

  const sameOriginUnauthenticatedMutation = await request.post(
    "/api/actions/unknown/reject",
    { headers: { origin } },
  );
  expect(sameOriginUnauthenticatedMutation.status()).toBe(401);

  const throttledHeaders = {
    origin,
    "x-forwarded-for": "192.0.2.44",
  };
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const failure = await request.post("/api/auth/login", {
      headers: throttledHeaders,
      data: { accessKey: "invalid-rate-limit-key" },
    });
    expect(failure.status()).toBe(401);
  }
  const locked = await request.post("/api/auth/login", {
    headers: throttledHeaders,
    data: { accessKey },
  });
  expect(locked.status()).toBe(429);
  expect(Number(locked.headers()["retry-after"])).toBeGreaterThan(0);
});
