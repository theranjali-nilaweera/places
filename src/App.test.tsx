import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
}))

import App from './App'

describe('<App />', () => {
  it('renders the map without crashing', () => {
    render(<App />)
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })
})
