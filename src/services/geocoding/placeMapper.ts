import { z } from 'zod'

import { boundingBoxSchema, type BoundingBox } from '@/types/geo'
import { placeSchema, type Place, type PlaceLinks } from '@/types/place'

import type { NominatimResult } from '../api/nominatim/nominatimResponse.schema'

/**
 * Maps a raw Nominatim DTO to the domain {@link Place}. This is the only place
 * that knows the provider's field names — everything downstream sees `Place`.
 * Missing `extratags` / `address` / `boundingbox` are all tolerated.
 */

/** Nominatim's `[southLat, northLat, westLon, eastLon]` strings → typed tuple. */
function toBoundingBox(raw: NominatimResult['boundingbox']): BoundingBox | undefined {
  if (!raw) return undefined
  const nums = raw.map(Number) as [number, number, number, number]
  const parsed = boundingBoxSchema.safeParse(nums)
  return parsed.success ? parsed.data : undefined
}

function toLinks(extratags: NominatimResult['extratags']): PlaceLinks {
  if (!extratags) return {}
  const links: PlaceLinks = {}
  const website = extratags.website ?? extratags.url ?? extratags['contact:website']
  const validWebsite = z.url().safeParse(website)
  if (validWebsite.success) links.website = validWebsite.data
  const phone = extratags.phone ?? extratags['contact:phone']
  if (phone) links.phone = phone
  if (extratags.opening_hours) links.openingHours = extratags.opening_hours
  if (extratags.wikidata) links.wikidata = extratags.wikidata
  return links
}

/** A stable id even when `osm_type`/`osm_id` are absent. */
function toId(result: NominatimResult): string {
  if (result.osm_type && result.osm_id !== undefined) {
    return `${result.osm_type}/${result.osm_id}`
  }
  if (result.place_id !== undefined) return `place/${result.place_id}`
  return `coord/${result.lat},${result.lon}`
}

/** Short label for the marker: the explicit `name`, else the first address segment. */
function toName(result: NominatimResult): string {
  if (result.name && result.name.trim()) return result.name
  const [first] = result.display_name.split(',')
  return first?.trim() || result.display_name
}

/** Assemble the domain shape without validating — the two entry points below decide
 *  whether a bad shape should throw or be dropped. */
function buildPlace(result: NominatimResult): unknown {
  return {
    id: toId(result),
    name: toName(result),
    displayName: result.display_name,
    coordinates: { lat: Number(result.lat), lon: Number(result.lon) },
    category: result.category,
    type: result.type,
    boundingBox: toBoundingBox(result.boundingbox),
    address: result.address,
    links: toLinks(result.extratags),
  }
}

/**
 * Map a single result, throwing on an invalid shape. Use this when the caller
 * controls the input and a failure means a mapping bug worth surfacing loudly.
 */
export function mapNominatimResult(result: NominatimResult): Place {
  // Re-validate so a mapping bug surfaces here, not deep in the UI.
  return placeSchema.parse(buildPlace(result))
}

/**
 * Map a whole Nominatim response, tolerating rows the provider sends that don't
 * satisfy our contract (out-of-range coord, non-string address value, …). Bad
 * rows are dropped and logged so one odd result can't sink the other good ones.
 */
export function mapNominatimResults(results: NominatimResult[]): Place[] {
  const places: Place[] = []
  for (const result of results) {
    const parsed = placeSchema.safeParse(buildPlace(result))
    if (parsed.success) places.push(parsed.data)
  }
  const dropped = results.length - places.length
  if (dropped > 0) {
    console.warn(
      `[geocoding] dropped ${dropped} of ${results.length} Nominatim results that failed validation`,
    )
  }
  return places
}
