"use client"

import { useEffect, useRef, useState } from "react"

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function calcDuration(diff: number): number {
  if (diff <= 0) return 0
  const log = Math.log10(Math.max(1, diff))
  return Math.round(800 + Math.min(500, log * 100))
}

export function useAnimatedMetric(target: number, duration?: number): number {
  const [current, setCurrent] = useState(0)
  const fromRef = useRef(0)
  const rafRef = useRef(0)

  useEffect(() => {
    const from = fromRef.current
    const to = target

    cancelAnimationFrame(rafRef.current)

    if (to === from) return

    const dur = duration ?? calcDuration(Math.abs(to - from))

    if (dur <= 0) {
      fromRef.current = to
      setCurrent(to)
      return
    }

    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur)
      const eased = easeOutExpo(t)
      const val = from + (to - from) * eased
      fromRef.current = val
      setCurrent(val)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = to
        setCurrent(to)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target]) // eslint-disable-line react-hooks/exhaustive-deps

  return current
}
