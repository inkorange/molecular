import { expect, test } from '@playwright/test'

test('/app renders a 3D scene canvas', async ({ page }) => {
  await page.goto('/app')
  // R3F renders a <canvas> element; just check it exists and has size.
  const canvas = page.locator('canvas')
  await expect(canvas).toBeVisible()
  const box = await canvas.boundingBox()
  expect(box?.width ?? 0).toBeGreaterThan(100)
  expect(box?.height ?? 0).toBeGreaterThan(100)
})
