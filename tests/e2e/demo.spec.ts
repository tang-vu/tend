import { expect, test } from "@playwright/test";

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
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth);
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

  await page
    .getByRole("button", { name: "Approve & schedule follow-up" })
    .click();
  await expect(page.getByText("Persisted due job")).toBeVisible();
  await expect(page.getByText("Local worker is active.")).toBeVisible();

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

  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth);

  await page.getByRole("button", { name: "Reset scenario" }).click();
  await expect(page.getByRole("button", { name: "Teach TEND" })).toBeVisible();
});
