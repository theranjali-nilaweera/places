import type {
  FitBoundsOptions,
  LatLngBoundsExpression,
  LatLngExpression,
  Map as LeafletMap,
  ZoomPanOptions,
} from 'leaflet'
import { useMemo } from 'react'
import { useMap } from 'react-leaflet'

import type { BoundingBox } from '@/types/geo'
import type { Place } from '@/types/place'

/**
 * A small, testable wrapper over the imperative Leaflet map API. Components call
 * `showPlace(place)` and never touch `flyTo` / `fitBounds` directly; tests mock
 * the map and assert these methods are called with the expected arguments.
 */

/** Zoom used when flying to a point that has no bounding box. */
export const POINT_ZOOM = 16

/** `[south, north, west, east]` → Leaflet's `[[south, west], [north, east]]`. */
export function toLeafletBounds(box: BoundingBox): LatLngBoundsExpression {
  const [south, north, west, east] = box
  return [
    [south, west],
    [north, east],
  ]
}

export interface MapController {
  flyTo: (center: LatLngExpression, zoom?: number, options?: ZoomPanOptions) => void
  setView: (center: LatLngExpression, zoom?: number, options?: ZoomPanOptions) => void
  fitBounds: (bounds: LatLngBoundsExpression, options?: FitBoundsOptions) => void
  /** Frame a result: its bounding box if present, otherwise fly to the point. */
  showPlace: (place: Place) => void
}

export function createMapController(
  map: Pick<LeafletMap, 'flyTo' | 'setView' | 'fitBounds'>,
): MapController {
  const flyTo: MapController['flyTo'] = (center, zoom, options) => {
    map.flyTo(center, zoom, options)
  }
  const setView: MapController['setView'] = (center, zoom, options) => {
    map.setView(center, zoom, options)
  }
  const fitBounds: MapController['fitBounds'] = (bounds, options) => {
    map.fitBounds(bounds, options)
  }
  const showPlace: MapController['showPlace'] = (place) => {
    if (place.boundingBox) {
      fitBounds(toLeafletBounds(place.boundingBox), { maxZoom: POINT_ZOOM })
      return
    }
    flyTo([place.coordinates.lat, place.coordinates.lon], POINT_ZOOM)
  }
  return { flyTo, setView, fitBounds, showPlace }
}

/** Hook form, bound to the nearest `<MapContainer>` map. */
export function useMapController(): MapController {
  const map = useMap()
  return useMemo(() => createMapController(map), [map])
}
