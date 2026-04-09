"use client"

import { useLoadingStore } from "@/lib/loading-store"

export function useDelayedLoading() {
  const { startLoading, stopLoading } = useLoadingStore()
  return { startLoading, stopLoading }
}
