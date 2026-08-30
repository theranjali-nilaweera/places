import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ErrorBoundary } from './ErrorBoundary'

function Boom(): never {
  throw new Error('kaboom')
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('<ErrorBoundary />', () => {
  it('renders its children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>all good</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText('all good')).toBeInTheDocument()
  })

  it('renders an accessible fallback when a child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(/something went wrong/i)
    expect(screen.getByRole('button', { name: /reload the app/i })).toBeInTheDocument()
  })

  it('logs the error via componentDidCatch', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )

    expect(error).toHaveBeenCalledWith(
      '[ErrorBoundary] uncaught error',
      expect.any(Error),
      expect.any(String),
    )
  })

  it('invokes onReload from the reload button instead of reloading the page', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const onReload = vi.fn()
    const user = userEvent.setup()

    render(
      <ErrorBoundary onReload={onReload}>
        <Boom />
      </ErrorBoundary>,
    )

    await user.click(screen.getByRole('button', { name: /reload the app/i }))
    expect(onReload).toHaveBeenCalledOnce()
  })
})
