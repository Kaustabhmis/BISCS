import { useSyncExternalStore } from 'react'
import { BrowserRouter } from 'react-router'
import { AppRoutes } from './AppRoutes'
import { contentVersion, subscribeContent } from './lib/liveContent'

export default function App() {
  // Re-render everything when live content from the Google Sheet arrives.
  // (Loading starts in Layout, once the pre-rendered page has fully hydrated.)
  useSyncExternalStore(subscribeContent, contentVersion, () => 0)

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
