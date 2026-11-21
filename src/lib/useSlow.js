import { useEffect, useState } from 'react'

// True once `active` has stayed true for `ms` milliseconds.
export function useSlow(active, ms) {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    if (!active) return undefined
    const timer = setTimeout(() => setSlow(true), ms)
    return () => {
      clearTimeout(timer)
      setSlow(false)
    }
  }, [active, ms])
  return slow
}
