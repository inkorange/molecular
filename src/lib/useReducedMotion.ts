'use client'

import { useEffect, useState } from 'react'

/**
 * Subscribes to the OS-level `prefers-reduced-motion` media query and
 * returns the live boolean. Components that drive ambient or decorative
 * animation (electron orbits, attach-point pulses, autonomous reel
 * advancement) read this to skip work when the user has asked to
 * reduce motion.
 *
 * SSR-safe: starts at `false`, hydrates to the real value in effect.
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mql.matches)
    const onChange = () => setReduced(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return reduced
}
