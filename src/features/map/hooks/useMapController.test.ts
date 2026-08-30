import { describe, expect, it, vi } from 'vitest'

import type { Place } from '@/types/place'

import { POINT_ZOOM, createMapController, toLeafletBounds } from './useMapController'

function fakeMap() {
  return { flyTo: vi.fn(), setView: vi.fn(), fitBounds: vi.fn() }
}

const pointPlace: Place = {
  id: 'node/1',
  name: 'Somewhere',
  displayName: 'Somewhere, Australia',
  coordinates: { lat: -37.81, lon: 144.96 },
  links: {},
}

const boxedPlace: Place = {
  ...pointPlace,
  id: 'way/2',
  boundingBox: [-38, -37, 144, 145],
}

describe('toLeafletBounds', () => {
  it('reorders [south, north, west, east] to [[s, w], [n, e]]', () => {
    expect(toLeafletBounds([-38, -37, 144, 145])).toEqual([
      [-38, 144],
      [-37, 145],
    ])
  })
})

describe('createMapController', () => {
  it('flyTo / setView / fitBounds delegate straight to the map', () => {
    const map = fakeMap()
    const controller = createMapController(map)

    controller.flyTo([1, 2], 5)
    controller.setView([3, 4], 6)
    controller.fitBounds([
      [0, 0],
      [1, 1],
    ])

    expect(map.flyTo).toHaveBeenCalledWith([1, 2], 5, undefined)
    expect(map.setView).toHaveBeenCalledWith([3, 4], 6, undefined)
    expect(map.fitBounds).toHaveBeenCalledWith(
      [
        [0, 0],
        [1, 1],
      ],
      undefined,
    )
  })

  it('showPlace fits the bounding box when the place has one', () => {
    const map = fakeMap()
    createMapController(map).showPlace(boxedPlace)

    expect(map.fitBounds).toHaveBeenCalledWith(
      [
        [-38, 144],
        [-37, 145],
      ],
      { maxZoom: POINT_ZOOM },
    )
    expect(map.flyTo).not.toHaveBeenCalled()
  })

  it('showPlace flies to the point when there is no bounding box', () => {
    const map = fakeMap()
    createMapController(map).showPlace(pointPlace)

    expect(map.flyTo).toHaveBeenCalledWith([-37.81, 144.96], POINT_ZOOM, undefined)
    expect(map.fitBounds).not.toHaveBeenCalled()
  })
})
