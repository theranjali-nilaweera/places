import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Place } from '@/types/place'

import { mapConfig } from '../map.config'

const mapInstance = { flyTo: vi.fn(), setView: vi.fn(), fitBounds: vi.fn() }

vi.mock('react-leaflet', () => ({
  MapContainer: ({
    children,
    center,
    zoom,
    className,
    zoomControl,
  }: {
    children?: React.ReactNode
    center: [number, number]
    zoom: number
    className?: string
    zoomControl?: boolean
  }) => (
    <div
      data-testid="map-container"
      data-center={JSON.stringify(center)}
      data-zoom={zoom}
      data-zoom-control={zoomControl}
      className={className}
    >
      {children}
    </div>
  ),
  TileLayer: ({ url, attribution }: { url: string; attribution: string }) => (
    <div data-testid="tile-layer" data-url={url} data-attribution={attribution} />
  ),
  ZoomControl: ({ position }: { position: string }) => (
    <div data-testid="zoom-control" data-position={position} />
  ),
  Marker: ({ position }: { position: [number, number] }) => (
    <div data-testid="marker" data-position={JSON.stringify(position)} />
  ),
  useMap: () => mapInstance,
}))

import { MapView } from './MapView'

const place: Place = {
  id: 'way/42',
  name: 'Melbourne Town Hall',
  displayName: 'Melbourne Town Hall, Melbourne, VIC, Australia',
  coordinates: { lat: -37.8142, lon: 144.9632 },
  boundingBox: [-37.815, -37.813, 144.962, 144.964],
  links: {},
}

describe('<MapView />', () => {
  beforeEach(() => {
    mapInstance.flyTo.mockClear()
    mapInstance.fitBounds.mockClear()
  })

  it('renders a full-viewport map container', () => {
    render(<MapView />)
    const container = screen.getByTestId('map-container')
    expect(container).toBeInTheDocument()
    expect(container).toHaveClass('map-view')
  })

  it('centres the initial view on the configured Australia coordinates and zoom', () => {
    render(<MapView />)
    const container = screen.getByTestId('map-container')
    expect(container.dataset.center).toBe(
      JSON.stringify([mapConfig.center.lat, mapConfig.center.lon]),
    )
    expect(container.dataset.zoom).toBe(String(mapConfig.zoom))
  })

  it('mounts the tile layer with the configured URL and attribution', () => {
    render(<MapView />)
    const tileLayer = screen.getByTestId('tile-layer')
    expect(tileLayer.dataset.url).toBe(mapConfig.tileLayer.url)
    expect(tileLayer.dataset.attribution).toBe(mapConfig.tileLayer.attribution)
  })

  it('disables the default zoom control and renders zoom control at bottom-right', () => {
    render(<MapView />)
    const container = screen.getByTestId('map-container')
    expect(container.dataset.zoomControl).toBe('false')
    const zoomControl = screen.getByTestId('zoom-control')
    expect(zoomControl.dataset.position).toBe('bottomright')
  })

  it('renders no marker when nothing is selected', () => {
    render(<MapView selectedPlace={null} />)
    expect(screen.queryByTestId('marker')).not.toBeInTheDocument()
  })

  it('drops a marker at the selected place and frames its bounding box', () => {
    render(<MapView selectedPlace={place} />)
    expect(screen.getByTestId('marker').dataset.position).toBe(
      JSON.stringify([place.coordinates.lat, place.coordinates.lon]),
    )
    expect(mapInstance.fitBounds).toHaveBeenCalledWith(
      [
        [-37.815, 144.962],
        [-37.813, 144.964],
      ],
      { maxZoom: 16 },
    )
  })

  it('flies to a place that has no bounding box', () => {
    const { boundingBox: _drop, ...pointPlace } = place
    render(<MapView selectedPlace={pointPlace} />)
    expect(mapInstance.flyTo).toHaveBeenCalledWith([-37.8142, 144.9632], 16, undefined)
  })
})
