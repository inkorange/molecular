import { expect, test } from '@playwright/test'

test('homepage responds 200 and contains the wordmark', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Molecular/i)
})
