import * as L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

/**
 * Leaflet's default marker icon resolves its PNGs relative to the document URL,
 * which produces 404s under a bundler. Point the default icon at the asset URLs
 * the bundler emits instead. Idempotent — safe to call from every map mount.
 */
let applied = false

export function ensureDefaultMarkerIcon(): void {
  if (applied) return
  applied = true

  // The prototype caches a resolved URL getter that has to go before mergeOptions takes effect.
  delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
  })
}
