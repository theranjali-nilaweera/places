/**
 * A minimum-interval rate limiter. Nominatim's usage policy caps clients at one
 * request per second; every call routed through {@link RateLimiter.schedule} is
 * spaced at least `minIntervalMs` after the previous one started.
 *
 * Ordering is preserved: tasks run in the order they were scheduled. The clock and
 * the delay primitive are injectable so tests need no real time.
 */

export interface RateLimiterOptions {
  minIntervalMs?: number
  now?: () => number
  /** Resolve after roughly `ms`. Defaults to `setTimeout`. */
  sleep?: (ms: number) => Promise<void>
}

/** Public Nominatim allows at most 1 request per second. */
export const NOMINATIM_MIN_INTERVAL_MS = 1000

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export class RateLimiter {
  private readonly minIntervalMs: number
  private readonly now: () => number
  private readonly sleep: (ms: number) => Promise<void>
  /** Tail of the promise chain — each task waits for it before checking the clock. */
  private queue: Promise<unknown> = Promise.resolve()
  private lastStart = Number.NEGATIVE_INFINITY

  constructor(options: RateLimiterOptions = {}) {
    this.minIntervalMs = options.minIntervalMs ?? NOMINATIM_MIN_INTERVAL_MS
    this.now = options.now ?? Date.now
    this.sleep = options.sleep ?? defaultSleep
  }

  /** Run `task` once enough time has passed since the previous scheduled task. */
  schedule<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const wait = this.lastStart + this.minIntervalMs - this.now()
      if (wait > 0) await this.sleep(wait)
      this.lastStart = this.now()
      return task()
    })
    // Keep the chain alive even if this task rejects.
    this.queue = run.catch(() => undefined)
    return run
  }
}
