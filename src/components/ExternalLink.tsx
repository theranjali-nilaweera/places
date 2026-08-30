import type { AnchorHTMLAttributes, ReactNode } from 'react'

/**
 * Shared wrapper for outbound links (see CLAUDE.md conventions). Opens in a new
 * tab and pins `rel="noopener noreferrer"` so the linked page can't reach
 * `window.opener` or leak our referrer; `target` and `rel` can't be overridden.
 */
export type ExternalLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'target' | 'rel'
> & {
  href: string
  children: ReactNode
}

export function ExternalLink({ children, ...props }: ExternalLinkProps) {
  return (
    <a {...props} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}
