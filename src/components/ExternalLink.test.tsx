import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ExternalLink } from './ExternalLink'

describe('<ExternalLink />', () => {
  it('always sets rel="noopener noreferrer" and target="_blank"', () => {
    render(<ExternalLink href="https://example.com">Example</ExternalLink>)

    const link = screen.getByRole('link', { name: 'Example' })
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('forwards arbitrary anchor props such as className', () => {
    render(
      <ExternalLink href="https://example.com" className="foo" data-testid="x">
        Example
      </ExternalLink>,
    )

    const link = screen.getByTestId('x')
    expect(link).toHaveClass('foo')
  })

  it('cannot have target or rel overridden by a caller', () => {
    render(
      // @ts-expect-error target/rel are intentionally omitted from the prop type
      <ExternalLink href="https://example.com" target="_self" rel="opener">
        Example
      </ExternalLink>,
    )

    const link = screen.getByRole('link', { name: 'Example' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
