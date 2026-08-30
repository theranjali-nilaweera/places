import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-leaflet', () => ({
  MapContainer: ({
    children,
    center,
    zoom,
  }: {
    children?: React.ReactNode
    center?: [number, number]
    zoom?: number
  }) => (
    <div
      data-testid="map-container"
      data-center={JSON.stringify(center)}
      data-zoom={zoom}
    >
      {children}
    </div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  ZoomControl: () => <div data-testid="zoom-control" />,
  Marker: ({
    position,
    children,
  }: {
    position: [number, number]
    children?: React.ReactNode
  }) => (
    <div data-testid="marker" data-position={JSON.stringify(position)}>
      {children}
    </div>
  ),
  Popup: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
  useMap: () => ({ flyTo: vi.fn(), setView: vi.fn(), fitBounds: vi.fn() }),
}))

import App from './App'
import { AppProviders } from './config/providers'
import type { GeocodingService } from './services/geocoding/geocodingService.types'
import type { Place } from './types/place'

const place: Place = {
  id: 'way/42',
  name: 'Melbourne Town Hall',
  displayName: 'Melbourne Town Hall, Melbourne, VIC, Australia',
  coordinates: { lat: -37.8142, lon: 144.9632 },
  links: {},
}

const place2: Place = {
  id: 'way/43',
  name: 'Flinders Street Station',
  displayName: 'Flinders Street Station, Melbourne, VIC, Australia',
  coordinates: { lat: -37.8183, lon: 144.9671 },
  links: {},
}

function renderApp(service: GeocodingService) {
  return render(
    <AppProviders service={service}>
      <App />
    </AppProviders>,
  )
}

afterEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('<App />', () => {
  it('renders the map and the search box without crashing', () => {
    renderApp({
      search: vi.fn().mockResolvedValue({ places: [], fellBackToGlobal: false }),
    })
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
  })

  it('does not hit the geocoding service until at least three characters are typed', async () => {
    const user = userEvent.setup()
    const searchFn = vi.fn().mockResolvedValue({ places: [], fellBackToGlobal: false })
    renderApp({ search: searchFn })

    await user.type(screen.getByRole('searchbox'), 'Sy')

    // Well past the debounce window.
    await new Promise((resolve) => setTimeout(resolve, 600))
    expect(searchFn).not.toHaveBeenCalled()

    await user.type(screen.getByRole('searchbox'), 'd')
    await vi.waitFor(() =>
      expect(searchFn).toHaveBeenCalledWith(expect.objectContaining({ text: 'Syd' })),
    )
  })

  it('does not move the map until the user picks a result', async () => {
    const user = userEvent.setup()
    renderApp({
      search: vi.fn().mockResolvedValue({ places: [place], fellBackToGlobal: false }),
    })

    await user.type(screen.getByRole('searchbox'), 'Melbourne Town Hall')

    expect(await screen.findByText(place.displayName)).toBeInTheDocument()
    expect(screen.queryByTestId('marker')).not.toBeInTheDocument()
  })

  it('frames a result on the map once the user selects it', async () => {
    const user = userEvent.setup()
    renderApp({
      search: vi.fn().mockResolvedValue({ places: [place], fellBackToGlobal: false }),
    })

    await user.type(screen.getByRole('searchbox'), 'Melbourne Town Hall')

    await user.click(await screen.findByText(place.displayName))

    expect(await screen.findByTestId('marker')).toHaveAttribute(
      'data-position',
      JSON.stringify([place.coordinates.lat, place.coordinates.lon]),
    )
  })

  it('shows the no-result message for an empty search', async () => {
    const user = userEvent.setup()
    renderApp({
      search: vi.fn().mockResolvedValue({ places: [], fellBackToGlobal: false }),
    })

    await user.type(screen.getByRole('searchbox'), 'nowhere at all')

    expect(await screen.findByRole('status')).toHaveTextContent(/no matches/i)
  })

  it('displays the results panel after a successful search', async () => {
    const user = userEvent.setup()
    renderApp({
      search: vi
        .fn()
        .mockResolvedValue({ places: [place, place2], fellBackToGlobal: false }),
    })

    await user.type(screen.getByRole('searchbox'), 'Melbourne')

    expect(await screen.findByText(place.displayName)).toBeInTheDocument()
    expect(screen.getByText(place2.displayName)).toBeInTheDocument()
  })

  it('selects a non-first result and frames it on the map without closing the panel', async () => {
    const user = userEvent.setup()
    renderApp({
      search: vi
        .fn()
        .mockResolvedValue({ places: [place, place2], fellBackToGlobal: false }),
    })

    await user.type(screen.getByRole('searchbox'), 'Melbourne')

    await user.click(await screen.findByText(place2.displayName))

    expect(screen.getByTestId('marker')).toHaveAttribute(
      'data-position',
      JSON.stringify([place2.coordinates.lat, place2.coordinates.lon]),
    )
    // The list stays open (its item plus the new place-info panel both show it).
    expect(screen.getAllByText(place2.displayName).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /Close results/i })).toBeInTheDocument()
  })

  it('hides the results panel when the close button is clicked', async () => {
    const user = userEvent.setup()
    renderApp({
      search: vi.fn().mockResolvedValue({ places: [place], fellBackToGlobal: false }),
    })

    await user.type(screen.getByRole('searchbox'), 'Melbourne')

    expect(await screen.findByText(place.displayName)).toBeInTheDocument()

    const closeButton = screen.getByRole('button', { name: /Close results/i })
    await user.click(closeButton)

    expect(screen.queryByText(place.displayName)).not.toBeInTheDocument()
  })

  describe('URL as an input channel', () => {
    it('runs the search from ?search= on load without moving the map', async () => {
      window.history.replaceState(null, '', '/?search=Melbourne')
      const searchFn = vi
        .fn()
        .mockResolvedValue({ places: [place], fellBackToGlobal: false })
      renderApp({ search: searchFn })

      await vi.waitFor(() =>
        expect(searchFn).toHaveBeenCalledWith(
          expect.objectContaining({ text: 'Melbourne' }),
        ),
      )
      expect(await screen.findByText(place.displayName)).toBeInTheDocument()
      expect(screen.queryByTestId('marker')).not.toBeInTheDocument()
      expect(window.location.search).toBe('?search=Melbourne')
    })

    it('opens the map at ?lat=&lon=&z= and runs no search', async () => {
      window.history.replaceState(null, '', '/?lat=-37.8136&lon=144.9631&z=15')
      const searchFn = vi.fn().mockResolvedValue({ places: [], fellBackToGlobal: false })
      renderApp({ search: searchFn })

      const container = screen.getByTestId('map-container')
      expect(container.dataset.center).toBe(JSON.stringify([-37.8136, 144.9631]))
      expect(container.dataset.zoom).toBe('15')

      await new Promise((resolve) => setTimeout(resolve, 600))
      expect(searchFn).not.toHaveBeenCalled()
      expect(window.location.search).toBe('?search=')
    })

    it('clears the stale ?search= value on the first edit of the box', async () => {
      window.history.replaceState(null, '', '/?search=Melbourne')
      const user = userEvent.setup()
      renderApp({
        search: vi.fn().mockResolvedValue({ places: [place], fellBackToGlobal: false }),
      })

      expect(await screen.findByText(place.displayName)).toBeInTheDocument()

      await user.type(screen.getByRole('searchbox'), 'x')
      expect(window.location.search).toBe('?search=')
    })
  })

  it('reopens the results panel when a new search is performed after closing', async () => {
    const user = userEvent.setup()
    const searchFn = vi
      .fn()
      .mockResolvedValue({ places: [place], fellBackToGlobal: false })
    renderApp({
      search: searchFn,
    })

    await user.type(screen.getByRole('searchbox'), 'Melbourne')
    expect(await screen.findByText(place.displayName)).toBeInTheDocument()

    const closeButton = screen.getByRole('button', { name: /Close results/i })
    await user.click(closeButton)
    expect(screen.queryByText(place.displayName)).not.toBeInTheDocument()

    searchFn.mockResolvedValue({ places: [place2], fellBackToGlobal: false })
    await user.clear(screen.getByRole('searchbox'))
    await user.type(screen.getByRole('searchbox'), 'Flinders')

    expect(await screen.findByText(place2.displayName)).toBeInTheDocument()
  })
})
