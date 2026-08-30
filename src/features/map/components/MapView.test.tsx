import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { mapConfig } from '../map.config'

vi.mock('react-leaflet', () => ({
  MapContainer: ({
    children,
    center,
    zoom,
    className,
  }: {
    children?: React.ReactNode
    center: [number, number]
    zoom: number
    className?: string
  }) => (
    <div
      data-testid="map-container"
      data-center={JSON.stringify(center)}
      data-zoom={zoom}
      className={className}
    >
      {children}
    </div>
  ),
  TileLayer: ({ url, attribution }: { url: string; attribution: string }) => (
    <div data-testid="tile-layer" data-url={url} data-attribution={attribution} />
  ),
}))

import { MapView } from './MapView'

describe('<MapView />', () => {
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
})
