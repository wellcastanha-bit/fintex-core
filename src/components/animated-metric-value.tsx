"use client"

import { useAnimatedMetric } from "@/lib/hooks/use-animated-metric"

type Props = {
  value: number
  type: "currency" | "percent" | "integer"
  duration?: number
  decimals?: number
}

function format(v: number, type: "currency" | "percent" | "integer", decimals?: number): string {
  if (type === "currency") {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  }
  if (type === "percent") {
    return v.toFixed(decimals ?? 1).replace(".", ",") + "%"
  }
  return Math.round(v).toLocaleString("pt-BR")
}

export default function AnimatedMetricValue({ value, type, duration, decimals }: Props) {
  const animated = useAnimatedMetric(value, duration)
  return <>{format(animated, type, decimals)}</>
}
