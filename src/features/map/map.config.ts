import type { Coordinates } from '@/types/geo'

/**
 * Basemap configuration. This is a one-file swap point (see the plan): change the
 * constants here to move the initial view or switch tile providers, and nothing
 * else in the app needs to know.
 */

/** Approximate geographic centre of the Australian mainland. */
export const AUSTRALIA_CENTER: Coordinates = { lat: -25.27, lon: 133.77 }

/** Initial zoom — frames the whole continent. */
export const INITIAL_ZOOM = 4

/** OpenStreetMap standard raster tiles. `{s}` `{z}` `{x}` `{y}` are Leaflet placeholders. */
export const TILE_LAYER_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

/** Attribution required by the OSM tile usage policy; rendered in the map corner. */
export const TILE_LAYER_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

export const mapConfig = {
  center: AUSTRALIA_CENTER,
  zoom: INITIAL_ZOOM,
  tileLayer: {
    url: TILE_LAYER_URL,
    attribution: TILE_LAYER_ATTRIBUTION,
  },
} as const
