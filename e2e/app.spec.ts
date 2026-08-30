import { expect, test } from '@playwright/test'

test('the app boots and the basemap loads', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('.leaflet-container')).toBeVisible()
  // At least one OSM tile actually fetched and rendered.
  await expect(page.locator('.leaflet-tile-loaded').first()).toBeVisible()
})
