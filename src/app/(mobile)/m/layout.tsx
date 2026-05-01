import React from "react";
import { cache } from "react";
import type { Metadata } from "next";
import { getContext } from "@/lib/context";
import { createAdminClient } from "@/lib/supabase/server";
import MobileShell from "./mobile-shell";

const resolveNome = cache(async (): Promise<{ nome: string | undefined; isHolding: boolean }> => {
  const ctx = await getContext()
  if (!ctx) return { nome: undefined, isHolding: false }

  const admin = createAdminClient()

  if (ctx.tipo === 'empresa') {
    const res = await admin.from('empresas').select('nome').eq('id', ctx.id).single()
    const row = res.data as { nome: string | null } | null
    return { nome: row?.nome ?? undefined, isHolding: false }
  }

  const res = await (admin as any).from('holdings').select('nome').eq('id', ctx.id).single()
  const row = res.data as { nome: string | null } | null
  return { nome: row?.nome ?? undefined, isHolding: true }
})

export async function generateMetadata(): Promise<Metadata> {
  const { nome, isHolding } = await resolveNome()
  if (!nome) return { title: "Fintex" }
  if (isHolding) {
    const nomeSemPrefixo = nome.replace(/^holding\s+/i, '').trim()
    return { title: `Holding ${nomeSemPrefixo} - Fintex` }
  }
  return { title: `${nome} - Fintex` }
}

export default async function MobileLayout({ children }: { children: React.ReactNode }) {
  const { nome } = await resolveNome()
  return <MobileShell nomeEmpresa={nome}>{children}</MobileShell>
}
