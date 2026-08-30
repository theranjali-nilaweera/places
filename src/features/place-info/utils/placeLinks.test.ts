import { describe, expect, it } from 'vitest'

import { placeLinks } from './placeLinks'

describe('placeLinks', () => {
  it('returns an empty list when links is empty', () => {
    expect(placeLinks({})).toEqual([])
  })

  it('exposes a valid website as an external link', () => {
    const [link, ...rest] = placeLinks({ website: 'https://opera.org.au' })
    expect(rest).toHaveLength(0)
    expect(link).toMatchObject({ key: 'website', label: 'Website', external: true })
    expect(link!.href).toBe('https://opera.org.au/')
    expect(link!.href).toBe(link!.text)
  })

  it('drops a website that is not an http(s) URL', () => {
    expect(placeLinks({ website: 'not a url' })).toEqual([])
    expect(placeLinks({ website: 'ftp://files.example.com' })).toEqual([])
    expect(placeLinks({ website: 'javascript:alert(1)' })).toEqual([])
  })

  it('renders a phone as a tel: link, stripping formatting from the href only', () => {
    const [link] = placeLinks({ phone: '+61 2 9250 7111' })
    expect(link).toMatchObject({
      key: 'phone',
      text: '+61 2 9250 7111',
      href: 'tel:+61292507111',
      external: false,
    })
  })

  it('ignores a blank phone string', () => {
    expect(placeLinks({ phone: '   ' })).toEqual([])
  })

  it('renders opening hours as plain text with no href', () => {
    const [link] = placeLinks({ openingHours: 'Mo-Fr 09:00-17:00' })
    expect(link).toMatchObject({
      key: 'openingHours',
      label: 'Opening hours',
      text: 'Mo-Fr 09:00-17:00',
      external: false,
    })
    expect(link!.href).toBeUndefined()
  })

  it('builds a wikidata.org URL from a Q-id', () => {
    const [link] = placeLinks({ wikidata: 'Q45178' })
    expect(link).toMatchObject({
      key: 'wikidata',
      href: 'https://www.wikidata.org/wiki/Q45178',
      external: true,
    })
  })

  it('drops a malformed wikidata value', () => {
    expect(placeLinks({ wikidata: '45178' })).toEqual([])
    expect(placeLinks({ wikidata: 'Q' })).toEqual([])
    expect(placeLinks({ wikidata: 'P31' })).toEqual([])
  })

  it('preserves a stable order: website, phone, opening hours, wikidata', () => {
    const keys = placeLinks({
      wikidata: 'Q45178',
      openingHours: '24/7',
      phone: '000',
      website: 'https://example.com',
    }).map((l) => l.key)
    expect(keys).toEqual(['website', 'phone', 'openingHours', 'wikidata'])
  })
})
