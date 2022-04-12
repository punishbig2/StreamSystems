import { Page } from "@playwright/test";

const { test, expect } = require("@playwright/test");

const createPod = async (page: Page, userId: string) => {
  await page.goto(`http://localhost:3000/?user=${userId}`);

  const newWorkspaceButton = page.locator("text=NEW WORKSPACE");
  expect(newWorkspaceButton).not.toBeNull();
  await newWorkspaceButton.click();

  const emptyWorkspaceButton = page.locator("text=Empty");
  expect(emptyWorkspaceButton).not.toBeNull();
  await emptyWorkspaceButton.click();

  const addPodButton = page.locator("text=ADD POD");
  expect(addPodButton).not.toBeNull();
  await addPodButton.click();

  const podWindow = page.locator("cib-window");
  expect(podWindow).not.toBeNull();

  return podWindow;
};

const setPodCombination = async (
  page: Page,
  pod: any,
  currency: string,
  strategy: string
): Promise<void> => {
  const currencyDropdown = pod.locator('[data-testid="currency-selector"]');
  expect(currencyDropdown).not.toBeNull();
  await currencyDropdown.click();

  const currencyButton = page.locator(`span:has-text("${currency}")`);
  expect(currencyButton).not.toBeNull();
  await currencyButton.click();

  const strategyDropdown = pod.locator('[data-testid="strategy-selector"]');
  expect(strategyDropdown).not.toBeNull();
  await strategyDropdown.click();

  const strategyButton = page.locator(`span:has-text("${strategy}")`);
  expect(strategyButton).not.toBeNull();
  await strategyButton.click();

  const runButton = page.locator('button:has-text("RUN")');
  expect(runButton).not.toBeNull();
  await runButton.isEnabled();
};

test("Basic Test", async ({ page }: { page: Page }) => {
  const podWindow = await createPod(page, "00u165bdnmpj8AsVb0h8");
  await setPodCombination(page, podWindow, "USDMXN", "ATMF");

  await page.screenshot({ path: "/home/iharob/screenshot.png" });
});
