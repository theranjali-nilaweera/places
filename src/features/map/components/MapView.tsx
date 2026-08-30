import 'leaflet/dist/leaflet.css'

import { MapContainer, TileLayer } from 'react-leaflet'

import { ensureDefaultMarkerIcon } from '../leafletIconFix'
import { mapConfig } from '../map.config'

import './MapView.css'

ensureDefaultMarkerIcon()

/**
 * Full-viewport basemap centred on Australia. Later phases render markers and
 * popups as children; for now it is just the tile layer.
 */
export function MapView() {
  return (
    <MapContainer
      className="map-view"
      center={[mapConfig.center.lat, mapConfig.center.lon]}
      zoom={mapConfig.zoom}
    >
      <TileLayer
        url={mapConfig.tileLayer.url}
        attribution={mapConfig.tileLayer.attribution}
      />
    </MapContainer>
  )
}
