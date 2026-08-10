import { expect, test, type Page } from "@playwright/test";

const browserErrors = new WeakMap<Page, string[]>();
const sameOriginHeaders = { origin: "http://127.0.0.1:3000" };

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
});

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page) ?? []).toEqual([]);
});

async function expectNoPageOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth);
}

test("landing presents the product and enters the demo", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Moderation shouldn’t reset/ }),
  ).toBeVisible();
  await expect(page.getByText("AutoMod keeps a server clean.")).toBeVisible();
  if (testInfo.project.name === "desktop-chromium") {
    await page.getByRole("link", { name: "Evidence" }).click();
  } else {
    await page.goto("/evidence");
  }
  await expect(
    page.getByRole("heading", {
      name: "Runtime truth, without the hand-waving.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Live Minds", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Partial verification stays partial."),
  ).toBeVisible();
  await expectNoPageOverflow(page);
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath("evidence.png"),
  });
  await page.goto("/");
  const iconHref = await page.locator('link[rel="icon"]').getAttribute("href");
  const ogImage = await page
    .locator('meta[property="og:image"]')
    .getAttribute("content");
  expect(iconHref).toBeTruthy();
  expect(ogImage).toBeTruthy();
  expect((await page.request.get(iconHref!)).status()).toBe(200);
  expect((await page.request.get(ogImage!)).status()).toBe(200);
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath("landing.png"),
  });
  await page.getByRole("link", { name: "Try the three-act demo" }).click();
  await expect(
    page.getByRole("heading", { name: "The continuity demo" }),
  ).toBeVisible();
  await expectNoPageOverflow(page);
});

test("three-act demo persists memory, approval, and autonomous resolution", async ({
  page,
}, testInfo) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: "Reset scenario" }).click();
  await expect(
    page.getByText("Creator instruction", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Teach TEND" }).click();
  await expect(
    page.getByRole("heading", { name: "Four memories, each with a receipt." }),
  ).toBeVisible();
  await expect(
    page.getByText("Kai asked people not to joke about their voice."),
  ).toBeVisible();
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath("demo-learned.png"),
  });

  await page.getByRole("button", { name: "Start Act 2" }).click();
  await expect(
    page.getByRole("heading", {
      name: "The sentence is mild. The history isn’t.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Memory that changed the decision"),
  ).toBeVisible();
  await expect(page.getByText("No ban · No timeout")).toBeVisible();
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath("demo-incident.png"),
  });

  await page
    .getByRole("button", { name: "Approve & schedule follow-up" })
    .click();
  await expect(page.getByText("Persisted due job")).toBeVisible();
  await expect(page.getByText("Local worker is active.")).toBeVisible();
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath("demo-countdown.png"),
  });

  await expect(
    page.getByRole("heading", { name: "Repair held. The loop is closed." }),
  ).toBeVisible({
    timeout: 25_000,
  });
  await expect(
    page.getByText("Incident state").locator("..").getByText("Resolved"),
  ).toBeVisible();
  await expect(
    page.getByText("Repair held. No renewed conflict."),
  ).toBeVisible();
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath("demo-resolved.png"),
  });

  await expectNoPageOverflow(page);

  await page.getByRole("button", { name: "Reset scenario" }).click();
  await expect(page.getByRole("button", { name: "Teach TEND" })).toBeVisible();
});

test("required product screens expose safe, responsive states", async ({
  page,
}) => {
  await page.request.post("/api/demo/reset", { headers: sameOriginHeaders });
  await page.request.post("/api/demo/learn", { headers: sameOriginHeaders });
  await page.request.post("/api/demo/incident", { headers: sameOriginHeaders });

  await page.goto("/community");
  await expect(
    page.getByRole("heading", { name: "Good evening, creator." }),
  ).toBeVisible();
  await expect(page.getByText("Community pulse")).toBeVisible();
  await expect(page.getByText("Demo mode", { exact: true })).toBeVisible();
  await expectNoPageOverflow(page);

  await page.goto("/incidents/incident-demo-voice-boundary");
  await expect(
    page.getByRole("heading", { name: "Why this decision?" }),
  ).toBeVisible();
  await expect(page.getByText("Untrusted Discord data")).toBeVisible();
  await expect(page.getByText("Memories used")).toBeVisible();
  await expectNoPageOverflow(page);

  await page.goto("/memories");
  await expect(
    page.getByRole("heading", { name: /What TEND has been asked to remember/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Memory receipts" }),
  ).toBeVisible();
  await expect(page.getByText("active", { exact: true }).first()).toBeVisible();
  await expectNoPageOverflow(page);

  await page.goto("/settings");
  await expect(
    page.getByRole("heading", { name: "Safety is a setting you can inspect." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Autonomy policy" }),
  ).toBeVisible();
  await expect(page.getByText("Local spec only")).toBeVisible();
  await expect(
    page.getByText("Not enabled in this runtime").first(),
  ).toBeVisible();
  await expectNoPageOverflow(page);

  await page.goto("/onboarding");
  await expect(
    page.getByRole("heading", { name: /Give TEND the shape/ }),
  ).toBeVisible();
  await expect(page.getByLabel("Community name")).toHaveValue("The Green Room");
  await page.getByRole("button", { name: /Complete setup/ }).click();
  await expect(
    page.getByRole("heading", {
      name: "The Green Room is ready for the walkthrough.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("No Discord account was connected"),
  ).toBeVisible();
  await expectNoPageOverflow(page);
});

test("credential-gated service APIs reject missing authorization", async ({
  request,
}) => {
  const skillRequests = [
    request.get("/api/skill/community-context"),
    request.get("/api/skill/incidents"),
    request.post("/api/skill/actions/propose"),
    request.post("/api/skill/followups"),
    request.get("/api/skill/followups/unknown"),
    request.post("/api/skill/incidents/unknown/outcome"),
  ];

  for (const response of await Promise.all(skillRequests)) {
    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "Unauthorized.",
    });
  }

  const workerResponse = await request.post("/api/internal/discord/messages");
  expect(workerResponse.status()).toBe(401);
  await expect(workerResponse.json()).resolves.toMatchObject({
    ok: false,
    error: "Unauthorized.",
  });
});

test("authorized Skill tools preserve policy and retry idempotency", async ({
  request,
}) => {
  const headers = {
    authorization: "Bearer e2e-skill-key-not-a-production-secret",
  };
  await request.post("/api/demo/reset", { headers: sameOriginHeaders });
  await request.post("/api/demo/learn", { headers: sameOriginHeaders });
  await request.post("/api/demo/incident", { headers: sameOriginHeaders });

  const context = await request.get("/api/skill/community-context", {
    headers,
  });
  expect(context.status()).toBe(200);
  expect((await context.json()).activeMemoryReceipts).toHaveLength(4);

  const incidents = await request.get("/api/skill/incidents", { headers });
  expect(incidents.status()).toBe(200);
  expect((await incidents.json()).incidents).toHaveLength(1);

  const actionInput = {
    incidentId: "incident-demo-voice-boundary",
    type: "private_reminder",
    targetId: "member-jules",
    content: "Please respect Kai's member-stated boundary.",
    idempotencyKey: "e2e-action-retry-1",
  };
  const firstAction = await request.post("/api/skill/actions/propose", {
    headers,
    data: actionInput,
  });
  const retriedAction = await request.post("/api/skill/actions/propose", {
    headers,
    data: actionInput,
  });
  expect(firstAction.status()).toBe(200);
  const firstActionBody = await firstAction.json();
  const retriedActionBody = await retriedAction.json();
  expect(retriedActionBody.proposal.id).toBe(firstActionBody.proposal.id);
  expect(firstActionBody).toMatchObject({
    executionOccurred: false,
    proposal: { requiresApproval: true, status: "proposed" },
  });

  const dueAt = new Date(Date.now() + 60_000).toISOString();
  const followUpInput = {
    incidentId: "incident-demo-voice-boundary",
    dueAt,
    purpose: "Check whether the approved repair held.",
    idempotencyKey: "e2e-followup-retry-1",
  };
  const firstFollowUp = await request.post("/api/skill/followups", {
    headers,
    data: followUpInput,
  });
  const retriedFollowUp = await request.post("/api/skill/followups", {
    headers,
    data: followUpInput,
  });
  expect(firstFollowUp.status()).toBe(200);
  const firstFollowUpBody = await firstFollowUp.json();
  expect((await retriedFollowUp.json()).followUp.id).toBe(
    firstFollowUpBody.followUp.id,
  );

  const status = await request.get(
    `/api/skill/followups/${firstFollowUpBody.followUp.id}`,
    { headers },
  );
  expect(status.status()).toBe(200);
  expect((await status.json()).followUp.status).toBe("scheduled");

  const outcome = await request.post(
    "/api/skill/incidents/incident-demo-voice-boundary/outcome",
    {
      headers,
      data: {
        outcome: "manual_review",
        summary: "A moderator will verify the outcome.",
      },
    },
  );
  expect(outcome.status()).toBe(200);
  expect(await outcome.json()).toMatchObject({
    destructiveActionOccurred: false,
    incident: { status: "manual_review" },
  });
});

test("deployment health checks persistence without exposing state", async ({
  request,
}) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe("no-store");
  await expect(response.json()).resolves.toEqual({
    ok: true,
    service: "tend-web",
    mode: "demo",
    persistence: "ready",
  });
});

test("keyboard users can skip navigation and inspect the current demo step", async ({
  page,
}) => {
  await page.goto("/demo");
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).toBeFocused();
  await skipLink.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  await expect(page.locator('[aria-current="step"]')).toHaveCount(1);
});
