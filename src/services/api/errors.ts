/**
 * Typed errors for the API layer. Callers (the geocoding service, the UI) branch
 * on these classes rather than inspecting status codes, so the mapping from a wire
 * failure to a user-facing message lives in exactly one place.
 */

/** Base class for every failure originating in `services/api`. */
export class ApiError extends Error {
  /** HTTP status, when the failure came from a response. */
  readonly status?: number

  constructor(message: string, options?: { status?: number; cause?: unknown }) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined)
    this.name = 'ApiError'
    this.status = options?.status
  }
}

/** The provider asked us to slow down (HTTP 429). */
export class RateLimitError extends ApiError {
  constructor(message = 'Too many requests — please slow down.') {
    super(message, { status: 429 })
    this.name = 'RateLimitError'
  }
}

/** The provider rejected the request (HTTP 403), typically a missing User-Agent. */
export class ForbiddenError extends ApiError {
  constructor(message = 'The geocoding service refused the request.') {
    super(message, { status: 403 })
    this.name = 'ForbiddenError'
  }
}

/** The request did not complete within the configured timeout. */
export class TimeoutError extends ApiError {
  constructor(message = 'The request timed out.') {
    super(message)
    this.name = 'TimeoutError'
  }
}

/**
 * Translate an HTTP status into the matching typed error. Non-ok statuses that
 * have no dedicated class fall back to a generic {@link ApiError}.
 */
export function errorForStatus(status: number, statusText = ''): ApiError {
  switch (status) {
    case 429:
      return new RateLimitError()
    case 403:
      return new ForbiddenError()
    default:
      return new ApiError(
        `Request failed with status ${status}${statusText ? ` ${statusText}` : ''}`,
        { status },
      )
  }
}
