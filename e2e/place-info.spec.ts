import { expect, test } from '@playwright/test'

/**
 * Phase 4 flow, against the live Nominatim API and real OSM tiles. Search an
 * unambiguous landmark, open its marker popup, and confirm the place-info panel
 * shows an address. Assertions stay on stable properties (a name, a non-empty
 * address, an outbound link) rather than exact upstream text.
 */
test('selecting a landmark opens a popup and an info panel with its address', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('.leaflet-container')).toBeVisible()

  await page.getByRole('searchbox').fill('Sydney Opera House')
  // Pick the first result from the list.
  const firstResult = page.locator('.search-results__item').first()
  await expect(firstResult).toBeVisible({ timeout: 20_000 })
  await firstResult.click()

  // The side panel shows the place with a non-empty address line.
  const panel = page.locator('.place-info')
  await expect(panel).toBeVisible()
  await expect(panel.locator('.place-info__name')).toContainText(/opera house/i)
  await expect(panel.locator('.place-info__address')).not.toBeEmpty()

  // Opening the marker popup reveals the brief place-info content.
  await page.locator('.leaflet-marker-icon').first().click()
  const popup = page.locator('.leaflet-popup .place-info-popup')
  await expect(popup).toBeVisible({ timeout: 10_000 })
  await expect(popup.locator('.place-info-popup__name')).toContainText(/opera house/i)

  // Any link in the panel is a safe external link.
  const links = panel.locator('a[href^="http"]')
  if (await links.count()) {
    await expect(links.first()).toHaveAttribute('rel', 'noopener noreferrer')
    await expect(links.first()).toHaveAttribute('target', '_blank')
  }
})

test('closing the info panel clears the selection', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('searchbox').fill('Flinders Street Station, Melbourne')
  const firstResult = page.locator('.search-results__item').first()
  await expect(firstResult).toBeVisible({ timeout: 20_000 })
  await firstResult.click()

  const panel = page.locator('.place-info')
  await expect(panel).toBeVisible()

  await panel.getByRole('button', { name: 'Close details' }).click()
  await expect(panel).toHaveCount(0)
  await expect(page.locator('.leaflet-marker-icon')).toHaveCount(0)
})
