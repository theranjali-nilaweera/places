/**
 * App-wide defaults. One-file swap point for the region bias: change
 * `defaultCountryCodes` to move the Australia-first behaviour elsewhere. URL
 * params may override the map view (Phase 5) but not the geocoding bias.
 */
export const appConfig = {
  /** ISO 3166-1 alpha-2 codes Nominatim biases toward. `[]` = global. */
  defaultCountryCodes: ['au'] as string[],
  /** Max results requested per search. */
  searchResultLimit: 10,
  /** Debounce before a search fires, in ms (Nominatim autocomplete guidance). */
  searchDebounceMs: 400,
} as const

export type AppConfig = typeof appConfig
