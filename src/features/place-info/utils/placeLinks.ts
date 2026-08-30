import type { Place, PlaceLinks } from '@/types/place'

/** A render-ready entry for the place-info panel. */
export interface PlaceLink {
  key: keyof PlaceLinks
  label: string
  /** Display text. */
  text: string
  /** Present when the value should render as an anchor; absent = plain text. */
  href?: string
  /** True for `href`s that leave the app (need `ExternalLink`); false for `tel:`. */
  external: boolean
}

const WIKIDATA_ID = /^Q[1-9]\d*$/

/**
 * Turns the domain `Place.links` bag (already extracted from `extratags` by the
 * geocoding mapper) into an ordered, render-ready list. Adds an `href` where one
 * is meaningful — `tel:` for phone, a wikidata.org URL for a `Q…` id — and drops
 * values that don't hold up (non-http website, non-`Q` wikidata). Returns `[]`
 * when nothing is presentable, which the panel renders as its fallback text.
 */
export function placeLinks(links: Place['links']): PlaceLink[] {
  const out: PlaceLink[] = []

  const website = links.website && httpUrl(links.website)
  if (website) {
    out.push({
      key: 'website',
      label: 'Website',
      text: website,
      href: website,
      external: true,
    })
  }

  const phone = links.phone?.trim()
  if (phone) {
    out.push({
      key: 'phone',
      label: 'Phone',
      text: phone,
      href: `tel:${phone.replace(/[^\d+]/g, '')}`,
      external: false,
    })
  }

  const openingHours = links.openingHours?.trim()
  if (openingHours) {
    out.push({
      key: 'openingHours',
      label: 'Opening hours',
      text: openingHours,
      external: false,
    })
  }

  const wikidata = links.wikidata?.trim()
  if (wikidata && WIKIDATA_ID.test(wikidata)) {
    out.push({
      key: 'wikidata',
      label: 'Wikidata',
      text: wikidata,
      href: `https://www.wikidata.org/wiki/${wikidata}`,
      external: true,
    })
  }

  return out
}

function httpUrl(value: string): string | undefined {
  try {
    const url = new URL(value.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.toString()
      : undefined
  } catch {
    return undefined
  }
}
