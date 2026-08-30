import type { Place } from '@/types/place'

/**
 * Flattens a provider address map (Nominatim `addressdetails`) into a single
 * human-readable line. For each slot it takes the first present key from a small
 * fallback list (locality is `city` ⇄ `town` ⇄ `village` …), keeps the order a
 * reader expects, joins house number to road without a comma, and drops a segment
 * that repeats the one before it. Returns `''` when there is nothing to show.
 */
export function formatAddress(address: Place['address']): string {
  if (!address) return ''

  const pick = (...keys: string[]): string | undefined => {
    const key = keys.find((k) => address[k]?.trim())
    return key ? address[key]!.trim() : undefined
  }

  const houseNumber = pick('house_number')
  const road = pick('road', 'pedestrian', 'footway', 'path')
  const street = [houseNumber, road].filter(Boolean).join(' ')

  const segments = [
    street || pick('house_name'),
    pick('neighbourhood', 'suburb', 'quarter', 'city_district'),
    pick('city', 'town', 'village', 'municipality', 'hamlet'),
    pick('county'),
    pick('state', 'province', 'state_district'),
    pick('postcode'),
    pick('country'),
  ].filter((s): s is string => Boolean(s))

  return segments.filter((s, i) => s !== segments[i - 1]).join(', ')
}
