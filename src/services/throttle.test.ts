import { describe, expect, it, vi } from 'vitest'

import { NOMINATIM_MIN_INTERVAL_MS, RateLimiter } from './throttle'

/**
 * A controllable clock: `sleep` advances virtual time immediately and records how
 * long each wait was, so we can assert on spacing without real timers.
 */
function fakeClock() {
  let t = 0
  const waits: number[] = []
  return {
    now: () => t,
    sleep: async (ms: number) => {
      waits.push(ms)
      t += ms
    },
    advance: (ms: number) => {
      t += ms
    },
    waits,
  }
}

describe('RateLimiter', () => {
  it('runs the first task immediately', async () => {
    const clock = fakeClock()
    const limiter = new RateLimiter({ minIntervalMs: 1000, ...clock })
    await limiter.schedule(() => Promise.resolve('a'))
    expect(clock.waits).toEqual([])
  })

  it('spaces consecutive tasks by at least minIntervalMs', async () => {
    const clock = fakeClock()
    const limiter = new RateLimiter({
      minIntervalMs: 1000,
      now: clock.now,
      sleep: clock.sleep,
    })

    const order: string[] = []
    const p1 = limiter.schedule(async () => void order.push('a'))
    const p2 = limiter.schedule(async () => void order.push('b'))
    const p3 = limiter.schedule(async () => void order.push('c'))
    await Promise.all([p1, p2, p3])

    expect(order).toEqual(['a', 'b', 'c'])
    // First runs at t=0, then two 1000ms waits.
    expect(clock.waits).toEqual([1000, 1000])
  })

  it('does not wait when enough time already elapsed between calls', async () => {
    const clock = fakeClock()
    const limiter = new RateLimiter({
      minIntervalMs: 1000,
      now: clock.now,
      sleep: clock.sleep,
    })

    await limiter.schedule(() => Promise.resolve())
    clock.advance(1500)
    await limiter.schedule(() => Promise.resolve())

    expect(clock.waits).toEqual([])
  })

  it('keeps limiting after a task rejects', async () => {
    const clock = fakeClock()
    const limiter = new RateLimiter({
      minIntervalMs: 1000,
      now: clock.now,
      sleep: clock.sleep,
    })

    await expect(
      limiter.schedule(() => Promise.reject(new Error('boom'))),
    ).rejects.toThrow('boom')
    const ran = vi.fn()
    await limiter.schedule(async () => ran())

    expect(ran).toHaveBeenCalledOnce()
    expect(clock.waits).toEqual([1000])
  })

  it('propagates the task result', async () => {
    const limiter = new RateLimiter({ ...fakeClock() })
    await expect(limiter.schedule(() => Promise.resolve(42))).resolves.toBe(42)
  })

  it('defaults to the Nominatim 1req/s interval', () => {
    expect(NOMINATIM_MIN_INTERVAL_MS).toBe(1000)
  })
})
