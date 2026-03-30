"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { useLoadingStore } from "@/lib/loading-store"

function NavigationWatcher() {
  const pathname = usePathname()
  const { startLoading, stopLoading } = useLoadingStore()
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    stopLoading()
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onLinkClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest("a[href]")
      if (!anchor) return
      const href = anchor.getAttribute("href") ?? ""
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return
      startLoading()
    }
    document.addEventListener("click", onLinkClick, true)
    return () => document.removeEventListener("click", onLinkClick, true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

export default function GlobalLoadingOverlay() {
  const { visible } = useLoadingStore()
  const [rendered, setRendered] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (visible) {
      setFading(false)
      setRendered(true)
    } else {
      setFading(true)
      const t = setTimeout(() => {
        setRendered(false)
        setFading(false)
      }, 320)
      return () => clearTimeout(t)
    }
  }, [visible])

  useEffect(() => {
    if (!rendered) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [rendered])

  return (
    <>
      <Suspense>
        <NavigationWatcher />
      </Suspense>

      {rendered && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100%",
            height: "100%",
            zIndex: 2147483647,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(4,19,40,0.82) 0%, rgba(2,11,24,0.78) 100%)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            opacity: fading ? 0 : 1,
            pointerEvents: "all",
            touchAction: "none",
            overscrollBehavior: "none",
            transition: "opacity 280ms cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 22,
              width: 240,
              maxWidth: "calc(100vw - 48px)",
              padding: "32px 28px",
              borderRadius: 22,
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              border: "1px solid rgba(79,220,255,0.13)",
              boxShadow:
                "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03), 0 0 40px rgba(79,220,255,0.06)",
              transform: fading ? "scale(0.96)" : "scale(1)",
              transition: "transform 280ms cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            <ArcLoader />

            <span
              style={{
                color: "rgba(255,255,255,0.88)",
                fontSize: 13,
                fontWeight: 450,
                letterSpacing: "0.03em",
                lineHeight: 1,
              }}
            >
              Carregando dados
            </span>
          </div>
        </div>
      )}
    </>
  )
}

function ArcLoader() {
  return (
    <>
      <style>{`
        @keyframes fintex-arc {
          0%   { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -251; }
        }
        @keyframes fintex-track-pulse {
          0%, 100% { opacity: 0.08; }
          50%       { opacity: 0.14; }
        }
      `}</style>
      <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        fill="none"
        aria-hidden="true"
        style={{ overflow: "visible" }}
      >
        <circle
          cx="22"
          cy="22"
          r="18"
          stroke="rgba(79,220,255,1)"
          strokeWidth="1.5"
          style={{ animation: "fintex-track-pulse 2.4s ease-in-out infinite" }}
        />
        <circle
          cx="22"
          cy="22"
          r="18"
          stroke="url(#fintex-grad)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="56 195"
          strokeDashoffset="0"
          style={{
            animation: "fintex-arc 1.1s cubic-bezier(0.4,0,0.6,1) infinite",
            transformOrigin: "22px 22px",
            filter: "drop-shadow(0 0 4px rgba(79,220,255,0.35))",
          }}
        />
        <defs>
          <linearGradient id="fintex-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4fdcff" stopOpacity="0" />
            <stop offset="60%" stopColor="#4fdcff" stopOpacity="1" />
            <stop offset="100%" stopColor="#a8f0ff" stopOpacity="1" />
          </linearGradient>
        </defs>
      </svg>
    </>
  )
}
