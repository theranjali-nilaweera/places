import { describe, expect, it } from 'vitest'

import { formatAddress } from './formatAddress'

describe('formatAddress', () => {
  it('returns an empty string when address is undefined', () => {
    expect(formatAddress(undefined)).toBe('')
  })

  it('returns an empty string for an empty address object', () => {
    expect(formatAddress({})).toBe('')
  })

  it('returns an empty string when every value is blank whitespace', () => {
    expect(formatAddress({ road: '   ', city: '\t' })).toBe('')
  })

  it('joins house number to road without a comma', () => {
    expect(
      formatAddress({
        house_number: '90-120',
        road: 'Swanston Street',
        city: 'Melbourne',
        state: 'Victoria',
        postcode: '3000',
        country: 'Australia',
      }),
    ).toBe('90-120 Swanston Street, Melbourne, Victoria, 3000, Australia')
  })

  it('omits the street slot entirely when road is missing', () => {
    expect(
      formatAddress({ city: 'Melbourne', state: 'Victoria', country: 'Australia' }),
    ).toBe('Melbourne, Victoria, Australia')
  })

  it('keeps a bare house number when there is no road', () => {
    expect(formatAddress({ house_number: '42', country: 'Australia' })).toBe(
      '42, Australia',
    )
  })

  it('falls back through locality keys (town when city is absent)', () => {
    expect(formatAddress({ town: 'Castlemaine', state: 'Victoria' })).toBe(
      'Castlemaine, Victoria',
    )
  })

  it('prefers city over the other locality keys when several are present', () => {
    expect(
      formatAddress({ city: 'Melbourne', town: 'Ignored', village: 'Ignored' }),
    ).toBe('Melbourne')
  })

  it('uses pedestrian/footway as a road fallback', () => {
    expect(formatAddress({ house_number: '1', pedestrian: 'City Square' })).toBe(
      '1 City Square',
    )
  })

  it('drops a segment that duplicates the segment before it', () => {
    expect(
      formatAddress({ city: 'Singapore', state: 'Singapore', country: 'Singapore' }),
    ).toBe('Singapore')
  })

  it('handles a sparse non-AU address (country only)', () => {
    expect(formatAddress({ country: 'Japan' })).toBe('Japan')
  })

  it('renders a full international address in reader order', () => {
    expect(
      formatAddress({
        house_number: '10',
        road: 'Downing Street',
        neighbourhood: 'Westminster',
        city: 'London',
        state: 'England',
        postcode: 'SW1A 2AA',
        country: 'United Kingdom',
      }),
    ).toBe('10 Downing Street, Westminster, London, England, SW1A 2AA, United Kingdom')
  })

  it('trims surrounding whitespace on individual values', () => {
    expect(formatAddress({ road: '  King St  ', city: '  Sydney  ' })).toBe(
      'King St, Sydney',
    )
  })
})
