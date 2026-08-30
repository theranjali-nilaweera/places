import 'leaflet/dist/leaflet.css'

import { useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer, ZoomControl } from 'react-leaflet'

import { PlaceInfoPopup } from '@/features/place-info/components/PlaceInfoPopup'
import type { Place } from '@/types/place'

import { useMapController } from '../hooks/useMapController'
import { ensureDefaultMarkerIcon } from '../leafletIconFix'
import { mapConfig } from '../map.config'

import './MapView.css'

ensureDefaultMarkerIcon()

export interface MapViewProps {
  /** The current search result to mark and frame. `null` = nothing selected. */
  selectedPlace?: Place | null
}

/**
 * Full-viewport basemap centred on Australia. When a place is selected it drops a
 * marker and recentres via {@link useMapController}. The marker carries a brief
 * {@link PlaceInfoPopup}; the fuller breakdown is in the side panel.
 */
export function MapView({ selectedPlace = null }: MapViewProps) {
  return (
    <MapContainer
      className="map-view"
      center={[mapConfig.center.lat, mapConfig.center.lon]}
      zoom={mapConfig.zoom}
      zoomControl={false}
    >
      <TileLayer
        url={mapConfig.tileLayer.url}
        attribution={mapConfig.tileLayer.attribution}
      />
      <ZoomControl position="bottomright" />
      <SelectedPlaceLayer place={selectedPlace} />
    </MapContainer>
  )
}

/** Renders inside the map context so it can drive the imperative Leaflet API. */
function SelectedPlaceLayer({ place }: { place: Place | null }) {
  const controller = useMapController()

  useEffect(() => {
    if (place) controller.showPlace(place)
  }, [place, controller])

  if (!place) return null
  return (
    <Marker position={[place.coordinates.lat, place.coordinates.lon]}>
      <Popup>
        <PlaceInfoPopup place={place} />
      </Popup>
    </Marker>
  )
}
