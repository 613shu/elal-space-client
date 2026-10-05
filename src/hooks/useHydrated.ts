import { useSyncExternalStore } from 'react'

const noop = () => () => {}

/** false בשרת ובהידרציה הראשונה, true אחרי כן */
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false)
}
