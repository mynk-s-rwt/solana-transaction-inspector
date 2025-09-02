import { Buffer } from 'buffer'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Polyfill Buffer for browser compatibility
window.Buffer = Buffer
window.global = window.global ?? window

createRoot(document.getElementById('root')!).render(
  <App />
)
