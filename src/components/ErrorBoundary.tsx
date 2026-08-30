import { Component, type ErrorInfo, type ReactNode } from 'react'

import './ErrorBoundary.css'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Overridable so tests can assert without a full page reload. */
  onReload?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * App-root backstop: catches render/lifecycle throws from anywhere in the tree so
 * an unexpected error shows a recoverable fallback instead of a blank page. It is
 * not error handling for expected failures — those are modelled in state (see the
 * geocoding search states); this only exists for the bugs we didn't foresee.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] uncaught error', error, info.componentStack)
  }

  private handleReload = () => {
    if (this.props.onReload) {
      this.props.onReload()
      return
    }
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="error-boundary" role="alert">
        <h1 className="error-boundary__title">Something went wrong</h1>
        <p className="error-boundary__body">
          The app hit an unexpected error. Reloading usually clears it.
        </p>
        <button
          type="button"
          className="error-boundary__button"
          onClick={this.handleReload}
        >
          Reload the app
        </button>
      </div>
    )
  }
}
