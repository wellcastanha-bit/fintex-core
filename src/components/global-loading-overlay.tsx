"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { useLoadingStore } from "@/lib/loading-store"

function NavigationWatcher() {
  const pathname = usePathname()
  const { startLoading, stopLoading } = useLoadingStore()
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return }
    stopLoading()
  }, [pathname]) // eslint-disable-line

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest("a[href]")
      if (!a) return
      const href = a.getAttribute("href") ?? ""
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return
      startLoading()
    }
    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, []) // eslint-disable-line

  return null
}

// Phases:
// "idle"       → bar not rendered
// "pre"        → bar at 0%, no transition (first paint before growing)
// "growing"    → bar crawling to 75% (slow, simulates waiting)
// "completing" → bar snapping to 100% (fast, data arrived)
// "hiding"     → bar fading out
type Phase = "idle" | "pre" | "growing" | "completing" | "hiding"

export default function TopProgressBar() {
  const { visible } = useLoadingStore()
  const [phase, setPhase] = useState<Phase>("idle")
  const [width, setWidth] = useState(0)
  const rafRef = useRef<number | null>(null)
  const t1Ref = useRef<ReturnType<typeof setTimeout> | null>(null)
  const t2Ref = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    if (t1Ref.current) { clearTimeout(t1Ref.current); t1Ref.current = null }
    if (t2Ref.current) { clearTimeout(t2Ref.current); t2Ref.current = null }

    if (visible) {
      // Render bar at 0% (no transition), then grow on next paint
      setPhase("pre")
      setWidth(0)
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => {
          setPhase("growing")
          setWidth(75)
        })
      })
    } else {
      if (phase === "idle") return
      // Snap to 100%, then fade and reset
      setPhase("completing")
      setWidth(100)
      t1Ref.current = setTimeout(() => {
        setPhase("hiding")
        t2Ref.current = setTimeout(() => {
          setPhase("idle")
          setWidth(0)
        }, 320)
      }, 140)
    }
  }, [visible]) // eslint-disable-line

  const watcher = <Suspense><NavigationWatcher /></Suspense>

  if (phase === "idle") return watcher

  const barStyle: React.CSSProperties = {
    height: "100%",
    width: `${width}%`,
    background: "linear-gradient(90deg, #2DCFBE 0%, #a8f0ff 55%, #2DCFBE 100%)",
    boxShadow: "0 0 10px rgba(45,207,190,0.55), 0 0 3px rgba(45,207,190,0.35)",
    opacity: phase === "hiding" ? 0 : 1,
    transition:
      phase === "pre"        ? "none" :
      phase === "growing"    ? "width 2200ms cubic-bezier(0.05, 0, 0.04, 1)" :
      phase === "completing" ? "width 140ms ease-out" :
                               "opacity 300ms ease",
  }

  return (
    <>
      {watcher}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          zIndex: 2147483647,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <div style={barStyle} />
      </div>
    </>
  )
}
