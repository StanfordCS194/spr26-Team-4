import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import favicon from '../images/favicon.svg'
import './index.css'
import App from './App.tsx'

const faviconLink =
  document.getElementById('app-favicon') ??
  document.head.appendChild(document.createElement('link'))

faviconLink.setAttribute('rel', 'icon')
faviconLink.setAttribute('type', 'image/svg+xml')
faviconLink.setAttribute('href', favicon)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
