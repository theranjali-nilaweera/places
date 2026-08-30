import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { Place } from '@/types/place'

import { SearchResults } from './SearchResults'

const places: Place[] = [
  {
    id: 'way/1',
    name: 'Melbourne Town Hall',
    displayName: 'Melbourne Town Hall, Melbourne, VIC, Australia',
    coordinates: { lat: -37.8142, lon: 144.9632 },
    links: {},
  },
  {
    id: 'way/2',
    name: 'Flinders Street Station',
    displayName: 'Flinders Street Station, Melbourne, VIC, Australia',
    coordinates: { lat: -37.8183, lon: 144.9671 },
    links: {},
  },
  {
    id: 'way/3',
    name: 'Federation Square',
    displayName: 'Federation Square, Melbourne, VIC, Australia',
    coordinates: { lat: -37.8155, lon: 144.9701 },
    links: {},
  },
]

describe('<SearchResults />', () => {
  it('renders nothing when places is empty', () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()

    const { container } = render(
      <SearchResults places={[]} onSelect={onSelect} onClose={onClose} />,
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders exactly one item for a single place', () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()

    render(<SearchResults places={[places[0]!]} onSelect={onSelect} onClose={onClose} />)

    const items = screen.getAllByRole('button', { name: /Melbourne Town Hall/i })
    expect(items).toHaveLength(1)
  })

  it('renders exactly 10 items when given 10 places', () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    const tenPlaces = Array.from({ length: 10 }, (_, i) => ({
      id: `way/${i}`,
      name: `Place ${i}`,
      displayName: `Place ${i}, Melbourne, VIC, Australia`,
      coordinates: { lat: -37.8 + i * 0.001, lon: 144.96 + i * 0.001 },
      links: {},
    }))

    render(<SearchResults places={tenPlaces} onSelect={onSelect} onClose={onClose} />)

    const listItems = screen.getAllByRole('listitem')
    expect(listItems).toHaveLength(10)
  })

  it('calls onSelect with the selected place when an item is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onClose = vi.fn()

    render(<SearchResults places={places} onSelect={onSelect} onClose={onClose} />)

    const flindersButton = screen.getByRole('button', {
      name: /Flinders Street Station/i,
    })
    await user.click(flindersButton)

    expect(onSelect).toHaveBeenCalledWith(places[1])
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onClose = vi.fn()

    render(<SearchResults places={places} onSelect={onSelect} onClose={onClose} />)

    const closeButton = screen.getByRole('button', { name: /Close results/i })
    await user.click(closeButton)

    expect(onClose).toHaveBeenCalledOnce()
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('marks the selected place with the --selected class', () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()

    render(
      <SearchResults
        places={places}
        selectedPlace={places[1]}
        onSelect={onSelect}
        onClose={onClose}
      />,
    )

    const items = screen.getAllByRole('button', {
      name: /^(Melbourne Town Hall|Flinders Street Station|Federation Square)/,
    })
    expect(items[0]).not.toHaveClass('search-results__item--selected')
    expect(items[1]).toHaveClass('search-results__item--selected')
    expect(items[2]).not.toHaveClass('search-results__item--selected')
  })

  it('does not mark any item when selectedPlace is null', () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()

    render(
      <SearchResults
        places={places}
        selectedPlace={null}
        onSelect={onSelect}
        onClose={onClose}
      />,
    )

    const allItems = screen
      .getAllByRole('button')
      .filter((btn) => btn.className.includes('search-results__item'))
    allItems.forEach((item) => {
      expect(item).not.toHaveClass('search-results__item--selected')
    })
  })
})
