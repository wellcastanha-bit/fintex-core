"use client"

import { createContext, useCallback, useContext, useRef, useState } from "react"

const SHOW_DELAY = 500
const MIN_VISIBLE = 350

type LoadingCtx = {
  visible: boolean
  startLoading: () => void
  stopLoading: () => void
}

const LoadingContext = createContext<LoadingCtx>({
  visible: false,
  startLoading: () => {},
  stopLoading: () => {},
})

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false)
  const countRef = useRef(0)
  const delayTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shownAt = useRef<number | null>(null)

  const startLoading = useCallback(() => {
    countRef.current += 1

    if (hideTimer.current !== null) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
      return
    }

    if (shownAt.current !== null) return

    if (delayTimer.current === null) {
      delayTimer.current = setTimeout(() => {
        delayTimer.current = null
        shownAt.current = Date.now()
        setVisible(true)
      }, SHOW_DELAY)
    }
  }, [])

  const stopLoading = useCallback(() => {
    countRef.current = Math.max(0, countRef.current - 1)
    if (countRef.current > 0) return

    if (delayTimer.current !== null) {
      clearTimeout(delayTimer.current)
      delayTimer.current = null
      return
    }

    if (shownAt.current === null) return

    const elapsed = Date.now() - shownAt.current
    const remaining = Math.max(0, MIN_VISIBLE - elapsed)

    if (hideTimer.current !== null) clearTimeout(hideTimer.current)

    hideTimer.current = setTimeout(() => {
      hideTimer.current = null
      shownAt.current = null
      setVisible(false)
    }, remaining)
  }, [])

  return (
    <LoadingContext.Provider value={{ visible, startLoading, stopLoading }}>
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoadingStore() {
  return useContext(LoadingContext)
}
