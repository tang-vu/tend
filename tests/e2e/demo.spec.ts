import { expect, test, type Page } from "@playwright/test";

const browserErrors = new WeakMap<Page, string[]>();

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
  await page.request.post("/api/demo/reset");
  await page.request.post("/api/demo/learn");
  await page.request.post("/api/demo/incident");

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
  await expect(page.getByText("Not configured").first()).toBeVisible();
  await expectNoPageOverflow(page);

  await page.goto("/onboarding");
  await expect(
    page.getByRole("heading", { name: /Give TEND the shape/ }),
  ).toBeVisible();
  await expect(page.getByLabel("Community name")).toHaveValue("The Green Room");
  await page.getByRole("button", { name: /Complete setup/ }).click();
  await expect(
    page.getByRole("heading", { name: "The Green Room is ready to tend." }),
  ).toBeVisible();
  await expect(
    page.getByText("No Discord account was connected"),
  ).toBeVisible();
  await expectNoPageOverflow(page);
});
