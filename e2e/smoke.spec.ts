import { test, expect } from "@playwright/test";

test("landingspagina toont de propositie", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("sociale huurwoningen");
  await expect(page.getByText("WoningWaker begrijpt")).toBeVisible();
});

test("prijzenpagina toont drie pakketten", async ({ page }) => {
  await page.goto("/prijzen");
  await expect(page.getByText("Gratis")).toBeVisible();
  await expect(page.getByText("Waker", { exact: false })).toBeVisible();
  await expect(page.getByText("€6,99")).toBeVisible();
});

test("statuspagina is bereikbaar", async ({ page }) => {
  await page.goto("/status");
  await expect(page.getByRole("heading", { name: "Platformstatus" })).toBeVisible();
});

test("beschermde route leidt naar login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
