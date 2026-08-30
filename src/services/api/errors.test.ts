import { describe, expect, it } from 'vitest'

import {
  ApiError,
  ForbiddenError,
  RateLimitError,
  TimeoutError,
  errorForStatus,
} from './errors'

describe('error classes', () => {
  it('RateLimitError carries status 429 and is an ApiError', () => {
    const err = new RateLimitError()
    expect(err).toBeInstanceOf(ApiError)
    expect(err.name).toBe('RateLimitError')
    expect(err.status).toBe(429)
  })

  it('ForbiddenError carries status 403', () => {
    expect(new ForbiddenError().status).toBe(403)
  })

  it('TimeoutError has no status', () => {
    const err = new TimeoutError()
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBeUndefined()
  })

  it('ApiError preserves an explicit cause', () => {
    const cause = new Error('socket hang up')
    const err = new ApiError('wrapped', { cause })
    expect(err.cause).toBe(cause)
  })
})

describe('errorForStatus', () => {
  it('maps 429 to RateLimitError', () => {
    expect(errorForStatus(429)).toBeInstanceOf(RateLimitError)
  })

  it('maps 403 to ForbiddenError', () => {
    expect(errorForStatus(403)).toBeInstanceOf(ForbiddenError)
  })

  it.each([500, 502, 404, 400])(
    'maps %p to a generic ApiError with the status',
    (status) => {
      const err = errorForStatus(status, 'Server Error')
      expect(err).toBeInstanceOf(ApiError)
      expect(err).not.toBeInstanceOf(RateLimitError)
      expect(err.status).toBe(status)
      expect(err.message).toContain(String(status))
    },
  )
})
