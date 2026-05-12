import { expect, test } from '@playwright/test'

test('Build mode: tap H in the palette → heldZ shows as picked', async ({ page }) => {
  await page.goto('/app')
  // Switch to Build mode
  await page.getByRole('button', { name: 'Build' }).click()
  // Open the bottom drawer — in Build mode the peek button opens the elements palette.
  await page.getByRole('button', { name: /open elements palette/i }).click()
  // Tap the Hydrogen tile inside the drawer — this sets heldZ AND closes
  // the drawer (the palette auto-closes onPick so the user can drop the
  // atom into the scene).
  await page.getByRole('button', { name: /Hydrogen, atomic number 1/i }).click()
  // Re-open the drawer to inspect held state — held atoms persist across
  // drawer open/close, so the H card should now read aria-pressed=true.
  await page.getByRole('button', { name: /open elements palette/i }).click()
  await expect(
    page.getByRole('button', { name: /Hydrogen, atomic number 1/i, pressed: true }),
  ).toBeVisible()
})
