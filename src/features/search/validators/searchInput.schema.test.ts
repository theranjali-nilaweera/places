import { describe, expect, it } from 'vitest'

import {
  MAX_QUERY_LENGTH,
  MIN_QUERY_LENGTH,
  searchInputSchema,
  validateSearchInput,
} from './searchInput.schema'

describe('searchInputSchema', () => {
  it('accepts and trims a normal query', () => {
    expect(searchInputSchema.parse('  Melbourne Town Hall  ')).toBe('Melbourne Town Hall')
  })

  it('accepts a query at the minimum length', () => {
    expect(searchInputSchema.parse('abc')).toBe('abc')
  })

  it('accepts unicode / accented input', () => {
    expect(searchInputSchema.parse('K灣仔 Café Größe')).toBe('K灣仔 Café Größe')
  })

  it('accepts a query at the maximum length', () => {
    const q = 'a'.repeat(MAX_QUERY_LENGTH)
    expect(searchInputSchema.parse(q)).toBe(q)
  })

  it.each([
    ['empty', ''],
    ['whitespace only', '   '],
    ['tab/newline only', '\n\t '],
    ['one char', 'a'],
    ['two chars after trim', '  ab  '],
  ])('rejects %s', (_label, value) => {
    expect(searchInputSchema.safeParse(value).success).toBe(false)
  })

  it('rejects a query past the maximum length', () => {
    expect(searchInputSchema.safeParse('a'.repeat(MAX_QUERY_LENGTH + 1)).success).toBe(
      false,
    )
  })
})

describe('validateSearchInput', () => {
  it('returns the trimmed value when valid', () => {
    expect(validateSearchInput('  sydney  ')).toEqual({ ok: true, value: 'sydney' })
  })

  it('returns a message mentioning the minimum when too short', () => {
    const result = validateSearchInput('hi')
    expect(result.ok).toBe(false)
    expect(result.error).toContain(String(MIN_QUERY_LENGTH))
  })

  it('returns a message when too long', () => {
    const result = validateSearchInput('a'.repeat(MAX_QUERY_LENGTH + 1))
    expect(result.ok).toBe(false)
    expect(result.error).toContain(String(MAX_QUERY_LENGTH))
  })
})
