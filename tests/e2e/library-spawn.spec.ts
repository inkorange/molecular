import { expect, test } from '@playwright/test'

test('open library drawer, search glucose, spawn it, verify in inspector', async ({ page }) => {
  await page.goto('/app')
  // Default Explore mode → bottom peek button opens the molecule library.
  await page.getByRole('button', { name: /open molecule library/i }).click()
  await page.getByPlaceholder('Search molecules…').fill('glucose')
  await page.getByRole('button', { name: /^Glucose/i }).click()
  // Spawn closes the drawer; open the Info dialog (top-right button) to see
  // the Inspector card for the freshly-spawned molecule.
  await page.getByRole('button', { name: /^Info$/i }).click()
  await expect(page.getByRole('heading', { name: 'Glucose' })).toBeVisible()
})
