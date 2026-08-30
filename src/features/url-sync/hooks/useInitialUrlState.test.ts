import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { clearSearchParam, useInitialUrlState } from './useInitialUrlState'

function setUrl(search: string) {
  window.history.replaceState(null, '', search)
}

beforeEach(() => {
  setUrl('/')
})

afterEach(() => {
  setUrl('/')
})

describe('useInitialUrlState', () => {
  it('parses ?search= from the address bar on mount', () => {
    setUrl('/?search=Melbourne')
    const { result } = renderHook(() => useInitialUrlState())
    expect(result.current).toEqual({ search: 'Melbourne' })
  })

  it('parses a ?lat=&lon=&z= view on mount', () => {
    setUrl('/?lat=-37.8136&lon=144.9631&z=15')
    const { result } = renderHook(() => useInitialUrlState())
    expect(result.current).toEqual({
      view: { lat: -37.8136, lon: 144.9631, zoom: 15 },
    })
  })

  it('returns a stable reference across re-renders', () => {
    setUrl('/?search=Melbourne')
    const { result, rerender } = renderHook(() => useInitialUrlState())
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })

  it('canonicalises the address bar to ?search=<value> for a usable search', () => {
    setUrl('/?search=Melbourne&junk=1')
    renderHook(() => useInitialUrlState())
    expect(window.location.search).toBe('?search=Melbourne')
  })

  it('collapses junk params to the bare ?search= affordance', () => {
    setUrl('/?foo=bar')
    renderHook(() => useInitialUrlState())
    expect(window.location.search).toBe('?search=')
  })

  it('shows the ?search= affordance even when a coordinate view was loaded', () => {
    setUrl('/?lat=-37.8&lon=144.96&z=15')
    const { result } = renderHook(() => useInitialUrlState())
    expect(window.location.search).toBe('?search=')
    expect(result.current.view).toEqual({ lat: -37.8, lon: 144.96, zoom: 15 })
  })
})

describe('clearSearchParam', () => {
  it('resets the address bar to the empty ?search= affordance', () => {
    setUrl('/?search=Melbourne')
    clearSearchParam()
    expect(window.location.search).toBe('?search=')
  })
})
