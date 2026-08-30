import { ExternalLink } from '@/components/ExternalLink'
import type { Place } from '@/types/place'

import { formatAddress } from '../utils/formatAddress'
import { placeLinks } from '../utils/placeLinks'

import './PlaceInfoPanel.css'

export interface PlaceInfoPanelProps {
  /** The selected place, or `null` when nothing is selected (renders nothing). */
  place: Place | null
  onClose: () => void
}

const NO_DETAILS = 'No additional details available.'

/**
 * The full side panel for the selected place: name, classification, a formatted
 * address line, and any curated links. All data comes from the domain `Place`
 * (mapped in Phase 3) — this component does no `extratags` parsing beyond
 * `placeLinks`.
 */
export function PlaceInfoPanel({ place, onClose }: PlaceInfoPanelProps) {
  if (!place) return null

  const address = formatAddress(place.address) || place.displayName
  const links = placeLinks(place.links)
  const classification = [place.category, place.type].filter(Boolean).join(' · ')

  return (
    <section className="place-info" aria-label={`Details for ${place.name}`}>
      <p className="place-info__eyebrow">Details</p>
      <header className="place-info__header">
        <h2 className="place-info__name">{place.name}</h2>
        <button
          type="button"
          className="place-info__close"
          aria-label="Close details"
          onClick={onClose}
        >
          ×
        </button>
      </header>

      {classification && <p className="place-info__type">{classification}</p>}

      <p className="place-info__address">{address}</p>

      {links.length > 0 ? (
        <dl className="place-info__links">
          {links.map((link) => (
            <div key={link.key} className="place-info__link-row">
              <dt className="place-info__link-label">{link.label}</dt>
              <dd className="place-info__link-value">
                {link.href === undefined ? (
                  link.text
                ) : link.external ? (
                  <ExternalLink href={link.href}>{link.text}</ExternalLink>
                ) : (
                  <a href={link.href}>{link.text}</a>
                )}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="place-info__empty">{NO_DETAILS}</p>
      )}
    </section>
  )
}
