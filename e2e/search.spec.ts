import { expect, test } from '@playwright/test'

/**
 * First feature flow, against the live Nominatim API and real OSM tiles. Uses one
 * unambiguous landmark and asserts on stable outcomes (a marker exists and sits
 * inside the map viewport) rather than exact coordinates, which drift with the
 * upstream data.
 */
test('searching a landmark drops a marker and recentres the map', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.leaflet-container')).toBeVisible()

  await page.getByRole('searchbox').fill('Sydney Opera House')
  await page.getByRole('button', { name: 'Go' }).click()

  // No error surfaced.
  await expect(page.getByRole('alert')).toHaveCount(0)

  // A marker appears once the geocode resolves.
  const marker = page.locator('.leaflet-marker-icon').first()
  await expect(marker).toBeVisible({ timeout: 20_000 })

  // The map recentred on the result: the marker is within the map viewport.
  const mapBox = await page.locator('.leaflet-container').boundingBox()
  const markerBox = await marker.boundingBox()
  expect(mapBox).not.toBeNull()
  expect(markerBox).not.toBeNull()
  expect(markerBox!.x).toBeGreaterThanOrEqual(mapBox!.x)
  expect(markerBox!.x).toBeLessThanOrEqual(mapBox!.x + mapBox!.width)
  expect(markerBox!.y).toBeGreaterThanOrEqual(mapBox!.y)
  expect(markerBox!.y).toBeLessThanOrEqual(mapBox!.y + mapBox!.height)
})

test('a nonsense query shows a clean no-result message', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('searchbox').fill('zzzzzz not a real place qqqqq')
  await page.getByRole('button', { name: 'Go' }).click()

  await expect(page.getByRole('status')).toContainText(/no matches/i, { timeout: 20_000 })
  await expect(page.locator('.leaflet-marker-icon')).toHaveCount(0)
})
