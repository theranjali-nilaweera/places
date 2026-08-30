import { useEffect, useState } from 'react'

/**
 * Returns `value` delayed by `delayMs` of quiet time. Used to hold off the
 * geocode call until the user stops typing (Nominatim discourages per-keystroke
 * autocomplete). A change during the wait resets the timer; unmounting clears it.
 */
export function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
