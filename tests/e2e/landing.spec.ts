import { expect, test } from '@playwright/test'

test('landing page shows hero + reel canvas, "Open the Lab" navigates', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /build the periodic table in 3D/i })).toBeVisible()
  // Reel renders a canvas (R3F). The first canvas on the page is the reel.
  await expect(page.locator('canvas').first()).toBeVisible()
  await page.getByRole('link', { name: /open the lab/i }).click()
  await page.waitForURL(/\/app/)
})
