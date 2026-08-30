import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDebouncedValue } from './useDebouncedValue'

describe('useDebouncedValue', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('a', 400))
    expect(result.current).toBe('a')
  })

  it('updates only after the delay has fully elapsed', () => {
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 400), {
      initialProps: { v: 'a' },
    })

    rerender({ v: 'b' })
    act(() => void vi.advanceTimersByTime(399))
    expect(result.current).toBe('a')

    act(() => void vi.advanceTimersByTime(1))
    expect(result.current).toBe('b')
  })

  it('fires once after a burst of changes (timer resets each change)', () => {
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 400), {
      initialProps: { v: 'a' },
    })

    rerender({ v: 'ab' })
    act(() => void vi.advanceTimersByTime(200))
    rerender({ v: 'abc' })
    act(() => void vi.advanceTimersByTime(200))
    rerender({ v: 'abcd' })
    act(() => void vi.advanceTimersByTime(399))
    expect(result.current).toBe('a')

    act(() => void vi.advanceTimersByTime(1))
    expect(result.current).toBe('abcd')
  })

  it('does not update after unmount', () => {
    const { result, rerender, unmount } = renderHook(
      ({ v }) => useDebouncedValue(v, 400),
      {
        initialProps: { v: 'a' },
      },
    )
    rerender({ v: 'b' })
    unmount()
    act(() => void vi.advanceTimersByTime(1000))
    expect(result.current).toBe('a')
  })

  it('respects a changed delay', () => {
    const { result, rerender } = renderHook(({ v, d }) => useDebouncedValue(v, d), {
      initialProps: { v: 'a', d: 400 },
    })
    rerender({ v: 'b', d: 1000 })
    act(() => void vi.advanceTimersByTime(400))
    expect(result.current).toBe('a')
    act(() => void vi.advanceTimersByTime(600))
    expect(result.current).toBe('b')
  })
})
