import { z } from 'zod'

/**
 * The user-facing rules for the search box. The search hook validates against
 * this before dispatching a geocode; `SearchStatus` turns a failure into a
 * message. Kept in the feature layer (the logic layer has its own minimal guard).
 */

/** Nominatim autocomplete guidance: don't fire on 1–2 characters. */
export const MIN_QUERY_LENGTH = 3
/** A sane upper bound — nothing legitimate is this long, and it bounds the URL. */
export const MAX_QUERY_LENGTH = 200

export const searchInputSchema = z
  .string()
  .transform((value) => value.trim())
  .pipe(
    z
      .string()
      .min(MIN_QUERY_LENGTH, `Enter at least ${MIN_QUERY_LENGTH} characters.`)
      .max(MAX_QUERY_LENGTH, `Search is limited to ${MAX_QUERY_LENGTH} characters.`),
  )

export type SearchInput = z.infer<typeof searchInputSchema>

export interface SearchInputValidation {
  ok: boolean
  /** The trimmed, valid query — present only when `ok`. */
  value?: SearchInput
  /** The first human-readable problem — present only when not `ok`. */
  error?: string
}

/** Non-throwing helper for the UI. */
export function validateSearchInput(raw: string): SearchInputValidation {
  const result = searchInputSchema.safeParse(raw)
  if (result.success) return { ok: true, value: result.data }
  return { ok: false, error: result.error.issues[0]?.message ?? 'Invalid search.' }
}
