import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SearchBar } from './SearchBar'

describe('<SearchBar />', () => {
  it('renders a labelled search input and a submit button', () => {
    render(<SearchBar onSearch={vi.fn()} />)
    expect(
      screen.getByRole('searchbox', { name: /place, address or landmark/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument()
  })

  it('calls onSearch with the typed value on submit', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    render(<SearchBar onSearch={onSearch} />)

    await user.type(screen.getByRole('searchbox'), 'Melbourne Town Hall')
    await user.click(screen.getByRole('button', { name: 'Go' }))

    expect(onSearch).toHaveBeenCalledExactlyOnceWith('Melbourne Town Hall')
  })

  it('submits on Enter as well', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    render(<SearchBar onSearch={onSearch} />)

    await user.type(screen.getByRole('searchbox'), 'Sydney{Enter}')

    expect(onSearch).toHaveBeenCalledWith('Sydney')
  })

  it('prefills from defaultValue', () => {
    render(<SearchBar onSearch={vi.fn()} defaultValue="Perth" />)
    expect(screen.getByRole('searchbox')).toHaveValue('Perth')
  })

  it('disables the button and relabels it while pending', () => {
    render(<SearchBar onSearch={vi.fn()} pending />)
    expect(screen.getByRole('button', { name: '…' })).toBeDisabled()
  })
})
