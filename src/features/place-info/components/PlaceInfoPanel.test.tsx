import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { Place } from '@/types/place'

import { PlaceInfoPanel } from './PlaceInfoPanel'

const basePlace: Place = {
  id: 'way/42',
  name: 'Sydney Opera House',
  displayName: 'Sydney Opera House, Bennelong Point, Sydney NSW 2000, Australia',
  coordinates: { lat: -33.8568, lon: 151.2153 },
  category: 'tourism',
  type: 'attraction',
  address: {
    tourism: 'Sydney Opera House',
    road: 'Bennelong Point',
    city: 'Sydney',
    state: 'New South Wales',
    postcode: '2000',
    country: 'Australia',
  },
  links: {
    website: 'https://www.sydneyoperahouse.com/',
    phone: '+61 2 9250 7111',
    openingHours: 'Mo-Su 09:00-20:30',
    wikidata: 'Q45178',
  },
}

describe('<PlaceInfoPanel />', () => {
  it('renders nothing when place is null', () => {
    const { container } = render(<PlaceInfoPanel place={null} onClose={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows the name, classification and formatted address', () => {
    render(<PlaceInfoPanel place={basePlace} onClose={vi.fn()} />)

    expect(
      screen.getByRole('heading', { name: 'Sydney Opera House' }),
    ).toBeInTheDocument()
    expect(screen.getByText('tourism · attraction')).toBeInTheDocument()
    expect(
      screen.getByText('Bennelong Point, Sydney, New South Wales, 2000, Australia'),
    ).toBeInTheDocument()
  })

  it('renders the website and wikidata as external links and the phone as tel:', () => {
    render(<PlaceInfoPanel place={basePlace} onClose={vi.fn()} />)

    const website = screen.getByRole('link', {
      name: 'https://www.sydneyoperahouse.com/',
    })
    expect(website).toHaveAttribute('target', '_blank')
    expect(website).toHaveAttribute('rel', 'noopener noreferrer')

    expect(screen.getByRole('link', { name: 'Q45178' })).toHaveAttribute(
      'href',
      'https://www.wikidata.org/wiki/Q45178',
    )

    expect(screen.getByRole('link', { name: '+61 2 9250 7111' })).toHaveAttribute(
      'href',
      'tel:+61292507111',
    )
  })

  it('shows opening hours as plain text, not a link', () => {
    render(<PlaceInfoPanel place={basePlace} onClose={vi.fn()} />)
    const value = screen.getByText('Mo-Su 09:00-20:30')
    expect(value.querySelector('a')).toBeNull()
  })

  it('falls back to displayName when there is no structured address', () => {
    render(
      <PlaceInfoPanel place={{ ...basePlace, address: undefined }} onClose={vi.fn()} />,
    )
    expect(screen.getByText(basePlace.displayName)).toBeInTheDocument()
  })

  it('shows the no-details fallback when there are no links', () => {
    render(<PlaceInfoPanel place={{ ...basePlace, links: {} }} onClose={vi.fn()} />)
    expect(screen.getByText('No additional details available.')).toBeInTheDocument()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('omits the classification line when category and type are absent', () => {
    render(
      <PlaceInfoPanel
        place={{ ...basePlace, category: undefined, type: undefined }}
        onClose={vi.fn()}
      />,
    )
    expect(screen.queryByText('tourism · attraction')).toBeNull()
  })

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<PlaceInfoPanel place={basePlace} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: 'Close details' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
