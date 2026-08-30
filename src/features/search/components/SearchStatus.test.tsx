import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { SearchState } from '../hooks/useGeocodeSearch'

import { SearchStatus } from './SearchStatus'

describe('<SearchStatus />', () => {
  it('renders nothing when idle with no query typed', () => {
    const { container } = render(<SearchStatus state={{ status: 'idle' }} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows a "keep typing" hint for a too-short query', () => {
    render(<SearchStatus state={{ status: 'idle' }} query="me" />)
    expect(screen.getByRole('status')).toHaveTextContent(/keep typing/i)
  })

  it('drops the hint once the query is long enough', () => {
    const { container } = render(<SearchStatus state={{ status: 'idle' }} query="mel" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('ignores a whitespace-only query for the hint', () => {
    const { container } = render(<SearchStatus state={{ status: 'idle' }} query="  " />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing on success (map + panel handle it)', () => {
    const state: SearchState = {
      status: 'success',
      query: 'melbourne',
      places: [],
      fellBackToGlobal: false,
    }
    const { container } = render(<SearchStatus state={state} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows a polite loading message', () => {
    render(<SearchStatus state={{ status: 'loading', query: 'melbourne' }} />)
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(/searching for .*melbourne/i)
  })

  it('shows a no-match message with the query', () => {
    render(<SearchStatus state={{ status: 'empty', query: 'zzz' }} />)
    expect(screen.getByRole('status')).toHaveTextContent(/no matches for .*zzz/i)
  })

  it('shows the error message in an alert', () => {
    render(
      <SearchStatus
        state={{
          status: 'error',
          query: 'melbourne',
          message: 'Too many requests — please slow down.',
        }}
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Too many requests — please slow down.',
    )
  })
})
