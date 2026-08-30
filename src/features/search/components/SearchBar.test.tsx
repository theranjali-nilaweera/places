import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SearchBar } from './SearchBar'

describe('<SearchBar />', () => {
  it('renders a labelled search input and no submit button', () => {
    render(<SearchBar onQueryChange={vi.fn()} />)
    expect(screen.getByRole('searchbox', { name: /Search the map/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Go' })).not.toBeInTheDocument()
  })

  it('reports the text to onQueryChange on every keystroke', async () => {
    const user = userEvent.setup()
    const onQueryChange = vi.fn()
    render(<SearchBar onQueryChange={onQueryChange} />)

    await user.type(screen.getByRole('searchbox'), 'Syd')

    expect(onQueryChange).toHaveBeenCalledTimes(3)
    expect(onQueryChange).toHaveBeenLastCalledWith('Syd')
  })

  it('prefills from defaultValue', () => {
    render(<SearchBar onQueryChange={vi.fn()} defaultValue="Perth" />)
    expect(screen.getByRole('searchbox')).toHaveValue('Perth')
  })

  it('shows the clear button only once there is text', async () => {
    const user = userEvent.setup()
    render(<SearchBar onQueryChange={vi.fn()} />)

    expect(
      screen.queryByRole('button', { name: /clear search/i }),
    ).not.toBeInTheDocument()

    await user.type(screen.getByRole('searchbox'), 'Perth')

    expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument()
  })

  it('clears the input and calls onClear when the clear button is clicked', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()
    render(<SearchBar onQueryChange={vi.fn()} onClear={onClear} defaultValue="Perth" />)

    await user.click(screen.getByRole('button', { name: /clear search/i }))

    expect(screen.getByRole('searchbox')).toHaveValue('')
    expect(onClear).toHaveBeenCalledOnce()
    expect(
      screen.queryByRole('button', { name: /clear search/i }),
    ).not.toBeInTheDocument()
  })

  it('does not throw when clearing without an onClear handler', async () => {
    const user = userEvent.setup()
    render(<SearchBar onQueryChange={vi.fn()} defaultValue="Perth" />)

    await user.click(screen.getByRole('button', { name: /clear search/i }))

    expect(screen.getByRole('searchbox')).toHaveValue('')
  })
})
