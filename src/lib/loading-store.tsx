"use client"

import { createContext, useCallback, useContext, useRef, useState } from "react"

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

  const startLoading = useCallback(() => {
    countRef.current += 1
    setVisible(true)
  }, [])

  const stopLoading = useCallback(() => {
    countRef.current = Math.max(0, countRef.current - 1)
    if (countRef.current === 0) setVisible(false)
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
