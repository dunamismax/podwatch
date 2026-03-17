import { expect, test } from "@playwright/test";

test("landing page routes into the login flow", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /vite spa and hono api/i,
    }),
  ).toBeVisible();

  await page.getByRole("link", { name: /open the workspace/i }).click();

  await expect(
    page.getByRole("heading", {
      name: /create an account/i,
    }),
  ).toBeVisible();
});
