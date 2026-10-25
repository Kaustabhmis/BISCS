import { useSyncExternalStore } from 'react'

const noop = () => () => {}

/** False on the server and during hydration of pre-rendered HTML; true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  )
}
