import { ExternalLink } from '@/components/ExternalLink'
import type { Place } from '@/types/place'

import { formatAddress } from '../utils/formatAddress'
import { placeLinks } from '../utils/placeLinks'

import './PlaceInfoPopup.css'

export interface PlaceInfoPopupProps {
  place: Place
}

/**
 * The brief content shown in the marker popup: name, a one-line address, and the
 * website link if there is one. The fuller breakdown lives in
 * {@link PlaceInfoPanel}.
 */
export function PlaceInfoPopup({ place }: PlaceInfoPopupProps) {
  const address = formatAddress(place.address)
  const website = placeLinks(place.links).find((link) => link.key === 'website')

  return (
    <div className="place-info-popup">
      <strong className="place-info-popup__name">{place.name}</strong>
      {address && <span className="place-info-popup__address">{address}</span>}
      {website && (
        <ExternalLink className="place-info-popup__link" href={website.href!}>
          {website.text}
        </ExternalLink>
      )}
    </div>
  )
}
