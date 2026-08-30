import { ApiError, TimeoutError, errorForStatus } from './errors'

/**
 * A thin `fetch` wrapper: fixed base URL and headers, a request timeout, caller
 * cancellation, and non-ok statuses turned into the typed errors from `errors.ts`.
 * It has no knowledge of any specific API — Nominatim lives one layer up.
 */

export interface HttpClientOptions {
  baseUrl: string
  /** Sent on every request. Nominatim's policy requires a descriptive User-Agent. */
  headers?: Record<string, string>
  /** Per-request timeout in milliseconds. Default 10s. */
  timeoutMs?: number
  /** Injectable for tests. Defaults to the global `fetch`. */
  fetchFn?: typeof fetch
}

export interface RequestOptions {
  /** Query parameters, appended to the path. `undefined` values are dropped. */
  params?: Record<string, string | number | undefined>
  /** Caller cancellation. Aborting supersedes the request. */
  signal?: AbortSignal
}

const DEFAULT_TIMEOUT_MS = 10_000

export class HttpClient {
  private readonly baseUrl: string
  private readonly headers: Record<string, string>
  private readonly timeoutMs: number
  private readonly fetchFn: typeof fetch

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '')
    this.headers = options.headers ?? {}
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    this.fetchFn = options.fetchFn ?? globalThis.fetch.bind(globalThis)
  }

  buildUrl(path: string, params?: RequestOptions['params']): string {
    const url = new URL(`${this.baseUrl}/${path.replace(/^\//, '')}`)
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value))
    }
    return url.toString()
  }

  /** GET `path`, parse JSON, return it untyped. Validation is the caller's job. */
  async getJson<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path, options.params)
    const timeout = new AbortController()
    const timer = setTimeout(() => timeout.abort(), this.timeoutMs)
    const signal = options.signal
      ? anySignal([options.signal, timeout.signal])
      : timeout.signal

    let response: Response
    try {
      response = await this.fetchFn(url, { headers: this.headers, signal })
    } catch (cause) {
      if (isAbortError(cause)) {
        // A caller-initiated abort propagates unchanged; a timeout is our own.
        if (options.signal?.aborted) throw cause
        throw new TimeoutError()
      }
      throw new ApiError('Network request failed', { cause })
    } finally {
      clearTimeout(timer)
    }

    if (!response.ok) throw errorForStatus(response.status, response.statusText)

    try {
      return (await response.json()) as T
    } catch (cause) {
      throw new ApiError('Response was not valid JSON', {
        status: response.status,
        cause,
      })
    }
  }
}

function isAbortError(value: unknown): boolean {
  return value instanceof DOMException && value.name === 'AbortError'
}

/** Abort as soon as any of the given signals aborts. */
function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController()
  const onAbort = () => {
    controller.abort()
    for (const s of signals) s.removeEventListener('abort', onAbort)
  }
  for (const s of signals) {
    if (s.aborted) {
      controller.abort()
      break
    }
    s.addEventListener('abort', onAbort)
  }
  return controller.signal
}
