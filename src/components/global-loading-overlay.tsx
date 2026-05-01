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

export default function TopProgressBar() {
  const { visible } = useLoadingStore()
  const [show, setShow] = useState(false)
  const [hiding, setHiding] = useState(false)
  const t1Ref = useRef<ReturnType<typeof setTimeout> | null>(null)
  const t2Ref = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (t1Ref.current) clearTimeout(t1Ref.current)
    if (t2Ref.current) clearTimeout(t2Ref.current)

    if (visible) {
      setHiding(false)
      setShow(true)
    } else {
      if (!show) return
      setHiding(true)
      t1Ref.current = setTimeout(() => {
        setShow(false)
        setHiding(false)
      }, 280)
    }
  }, [visible]) // eslint-disable-line

  const watcher = <Suspense><NavigationWatcher /></Suspense>

  if (!show) return watcher

  return (
    <>
      {watcher}

      {/* Top bar */}
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
          opacity: hiding ? 0 : 1,
          transition: hiding ? "opacity 280ms ease" : "none",
        }}
      >
        <div
          style={{
            height: "100%",
            width: "100%",
            background: "linear-gradient(90deg, #041328 0%, #2DCFBE 30%, #a8f0ff 60%, #2DCFBE 100%)",
            backgroundSize: "200% 100%",
            animation: "fintex-bar-slide 1.4s linear infinite",
            boxShadow: "0 0 8px rgba(45,207,190,0.7)",
          }}
        />
      </div>

      {/* Centered floating spinner */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2147483646,
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: hiding ? 0 : 1,
          transition: hiding ? "opacity 280ms ease" : "opacity 120ms ease",
        }}
      >
        <div
          style={{
            background: "rgba(4, 19, 40, 0.88)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(45,207,190,0.25)",
            borderRadius: 16,
            padding: "22px 32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            boxShadow: "0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(45,207,190,0.1)",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "3px solid rgba(45,207,190,0.2)",
              borderTopColor: "#2DCFBE",
              animation: "fintex-spin 0.75s linear infinite",
            }}
          />
          <span
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "0.03em",
              fontFamily: "inherit",
            }}
          >
            Carregando...
          </span>
        </div>
      </div>

      <style>{`
        @keyframes fintex-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fintex-bar-slide {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  )
}
