import { describe, expect, it } from 'vitest'

import { appConfig } from './app.config'

describe('appConfig', () => {
  it('biases toward Australia by default', () => {
    expect(appConfig.defaultCountryCodes).toEqual(['au'])
  })

  it('requests a small, sane number of results', () => {
    expect(appConfig.searchResultLimit).toBeGreaterThan(0)
    expect(appConfig.searchResultLimit).toBeLessThanOrEqual(10)
  })

  it('uses a debounce long enough to respect Nominatim guidance', () => {
    expect(appConfig.searchDebounceMs).toBeGreaterThanOrEqual(300)
  })
})
