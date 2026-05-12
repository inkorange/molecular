import { expect, test } from '@playwright/test'

test('open library drawer, search glucose, spawn it, verify in inspector', async ({ page }) => {
  await page.goto('/app')
  await page.getByText('Library ↑').click()
  await page.getByPlaceholder('Search molecules…').fill('glucose')
  await page.getByRole('button', { name: /^Glucose/i }).click()
  await page.getByRole('button', { name: /info/i }).click()
  await expect(page.getByRole('heading', { name: 'Glucose' })).toBeVisible()
})
