import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter-tight/index.css'
import './admin.css'
import App from './App'

createRoot(document.getElementById('admin-root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
