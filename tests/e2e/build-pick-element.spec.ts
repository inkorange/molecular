import { expect, test } from '@playwright/test'

test('Build mode: tap H in the palette → heldZ shows as picked', async ({ page }) => {
  await page.goto('/app')
  // Switch to Build mode
  await page.getByRole('button', { name: 'Build' }).click()
  // Open the bottom drawer — in Build mode the peek button opens the elements palette.
  await page.getByRole('button', { name: /open elements palette/i }).click()
  // Tap the Hydrogen tile inside the drawer
  await page.getByRole('button', { name: /Hydrogen, atomic number 1/i }).click()
  // The card flips to aria-pressed=true when held
  await expect(
    page.getByRole('button', { name: /Hydrogen, atomic number 1/i, pressed: true }),
  ).toBeVisible()
})
