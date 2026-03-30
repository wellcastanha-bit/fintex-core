import React from "react";
import type { Metadata } from "next";
import Shell from "./components/shell";
import { requireContext } from "@/lib/require-context";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { nome, isHolding } = await requireContext()
    if (isHolding) {
      const nomeSemPrefixo = (nome ?? '').replace(/^holding\s+/i, '')
      return { title: `Holding ${nomeSemPrefixo} - Fintex` }
    }
    return { title: `${nome} - Fintex` }
  } catch {
    return { title: "Fintex" }
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { nome, isHolding } = await requireContext()
  return <Shell nomeEmpresa={nome} isHolding={isHolding}>{children}</Shell>
}
