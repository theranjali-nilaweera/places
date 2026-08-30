import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { Place } from '@/types/place'

import { PlaceInfoPopup } from './PlaceInfoPopup'

const place: Place = {
  id: 'way/42',
  name: 'Sydney Opera House',
  displayName: 'Sydney Opera House, Bennelong Point, Sydney NSW 2000, Australia',
  coordinates: { lat: -33.8568, lon: 151.2153 },
  address: { road: 'Bennelong Point', city: 'Sydney', country: 'Australia' },
  links: { website: 'https://www.sydneyoperahouse.com/' },
}

describe('<PlaceInfoPopup />', () => {
  it('renders the name, a one-line address and the website link', () => {
    render(<PlaceInfoPopup place={place} />)

    expect(screen.getByText('Sydney Opera House')).toBeInTheDocument()
    expect(screen.getByText('Bennelong Point, Sydney, Australia')).toBeInTheDocument()

    const link = screen.getByRole('link', { name: 'https://www.sydneyoperahouse.com/' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('omits the address line when there is no structured address', () => {
    render(<PlaceInfoPopup place={{ ...place, address: undefined }} />)
    expect(screen.queryByText(/Bennelong Point/)).toBeNull()
  })

  it('omits the website link when there is none', () => {
    render(<PlaceInfoPopup place={{ ...place, links: {} }} />)
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('Sydney Opera House')).toBeInTheDocument()
  })
})
