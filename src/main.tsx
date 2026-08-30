import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { AppProviders } from './config/providers.tsx'

import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProviders>
        <App />
      </AppProviders>
    </ErrorBoundary>
  </StrictMode>,
)
