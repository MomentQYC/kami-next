import { useEffect, useRef } from 'react'

type CleanupFn = () => void | undefined

export const useSyncEffectOnce = (effect: (() => CleanupFn) | (() => void)) => {
  const ref = useRef(false)

  useEffect(() => {
    if (ref.current) return
    ref.current = true
    const cleanup = effect()
    return cleanup || undefined
  }, [])
}
