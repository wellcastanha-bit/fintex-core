"use client";

import { useEffect, useState } from "react";
import { fmtBRL } from "./ui/card_shell";
import CardsTopo, { type DashboardKpis } from "./ui/boxes/cards_topo";
import RankingPagamentos, { type RankingPagamentoRow } from "./ui/boxes/ranking_pagamentos";
import PedidosPorPlataforma, { type PlataformaRow } from "./ui/boxes/pedidos_por_plataforma";
import PedidosPorAtendimento, { type AtendimentoRow } from "./ui/boxes/pedidos_por_atendimento";
import ConferenciaCaixa, { type ConferenciaData } from "./ui/boxes/conferencia_caixa";
import DespesasDetalhadas, { type DespesaRow } from "./ui/boxes/despesas_detalhadas";
import {
  PLATFORM_ACCENTS,
  PLATFORM_ACCENT_CYCLE,
  ATENDIMENTO_ACCENTS,
  ATENDIMENTO_ACCENT_CYCLE,
} from "@/lib/dashboard-calc"
import { normalizePlatform, normalizeServiceType } from "@/lib/normalizers";

type DashboardPayload = {
  isHolding?: boolean
  cards_topo?: {
    pedidos: number
    faturamento: number
    ticket_medio: number
    despesas: number
    despesas_pct: number
    lucro_estimado: number
    margem_pct: number
    fatias_total: number
  }
  ranking_pagamentos?: RankingPagamentoRow[]
  pedidos_por_plataforma?: Array<Omit<PlataformaRow, "accent"> & { accent?: string }>
  pedidos_por_atendimento?: Array<Omit<AtendimentoRow, "accent"> & { accent?: string }>
  conferencia_caixa?: Omit<ConferenciaData, "status"> & { status?: ConferenciaData["status"] }
  despesas_detalhadas?: DespesaRow[]
}

type DashboardData = {
  kpis: DashboardKpis
  ranking_pagamentos: RankingPagamentoRow[]
  pedidos_por_plataforma: PlataformaRow[]
  pedidos_por_atendimento: AtendimentoRow[]
  conferencia_caixa: ConferenciaData
  despesas_detalhadas: DespesaRow[]
}

function normalizeAtendimentoKey(raw: string): string {
  try { return normalizeServiceType(raw) } catch { return raw.trim().toUpperCase() }
}

function normalizePlatformKey(raw: string): string {
  try { return normalizePlatform(raw) } catch { return raw.trim().toUpperCase() }
}

function transformPayload(p: DashboardPayload): DashboardData {
  const ct = p.cards_topo
  if (!ct) return EMPTY

  const isHolding = p.isHolding ?? false
  const lucro_estimado = isHolding ? ct.lucro_estimado : ct.faturamento * 0.30
  const margem = isHolding ? ct.margem_pct : 30

  const pedidos_por_plataforma: PlataformaRow[] = (() => {
    const raw = p.pedidos_por_plataforma ?? []
    const map = new Map<string, { pedidos: number; valor: number }>()
    for (const r of raw) {
      const key = normalizePlatformKey(r.key)
      const entry = map.get(key) ?? { pedidos: 0, valor: 0 }
      entry.pedidos += r.pedidos
      entry.valor += r.valor
      map.set(key, entry)
    }
    const total = Array.from(map.values()).reduce((s, v) => s + v.valor, 0)
    return Array.from(map.entries())
      .map(([key, v]) => ({
        key,
        pedidos: v.pedidos,
        valor: v.valor,
        pct: total > 0 ? (v.valor / total) * 100 : 0,
      }))
      .sort((a, b) => b.valor - a.valor)
      .map((r, i) => ({
        ...r,
        accent: (PLATFORM_ACCENTS[r.key] ?? PLATFORM_ACCENT_CYCLE[i % PLATFORM_ACCENT_CYCLE.length]) as PlataformaRow["accent"],
      }))
  })()

  const pedidos_por_atendimento: AtendimentoRow[] = (() => {
    const raw = p.pedidos_por_atendimento ?? []
    const map = new Map<string, { pedidos: number; valor: number }>()
    for (const r of raw) {
      const key = normalizeAtendimentoKey(r.key)
      const entry = map.get(key) ?? { pedidos: 0, valor: 0 }
      entry.pedidos += r.pedidos
      entry.valor += r.valor
      map.set(key, entry)
    }
    const total = Array.from(map.values()).reduce((s, v) => s + v.valor, 0)
    return Array.from(map.entries())
      .map(([key, v]) => ({
        key,
        pedidos: v.pedidos,
        valor: v.valor,
        pct: total > 0 ? (v.valor / total) * 100 : 0,
      }))
      .sort((a, b) => b.valor - a.valor)
      .map((r, i) => ({
        ...r,
        accent: (ATENDIMENTO_ACCENTS[r.key] ?? ATENDIMENTO_ACCENT_CYCLE[i % ATENDIMENTO_ACCENT_CYCLE.length]) as AtendimentoRow["accent"],
      }))
  })()

  const confRaw = p.conferencia_caixa ?? EMPTY.conferencia_caixa
  const conferencia_caixa: ConferenciaData = {
    ...confRaw,
    provaReal: confRaw.provaReal ?? 0,
    status: confRaw.status ?? ((confRaw.quebra ?? 0) === 0 ? "OK" : "ATENÇÃO"),
  }

  return {
    kpis: {
      pedidos: ct.pedidos,
      faturamento: ct.faturamento,
      ticket_medio: ct.ticket_medio,
      margem,
      lucro_estimado,
      despesas: ct.despesas,
      despesas_pct: ct.despesas_pct,
      fatias_total: ct.fatias_total,
    },
    ranking_pagamentos: p.ranking_pagamentos ?? [],
    pedidos_por_plataforma,
    pedidos_por_atendimento,
    conferencia_caixa,
    despesas_detalhadas: p.despesas_detalhadas ?? [],
  }
}

const EMPTY: DashboardData = {
  kpis: {
    pedidos: 0,
    faturamento: 0,
    ticket_medio: 0,
    margem: 30,
    lucro_estimado: 0,
    despesas: 0,
    despesas_pct: 0,
    fatias_total: 0,
  },
  ranking_pagamentos: [],
  pedidos_por_plataforma: [],
  pedidos_por_atendimento: [],
  conferencia_caixa: {
    status: "OK",
    caixaInicial: 0,
    entradasDinheiro: 0,
    saidas: 0,
    provaReal: 0,
    caixaFinal: 0,
    quebra: 0,
  },
  despesas_detalhadas: [],
}

export default function DashboardView({ qs = "period=hoje", isFatias = false }: { qs?: string; isFatias?: boolean }) {
  const [data, setData] = useState<DashboardData>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    setLoading(true)
    setFetchError(false)

    fetch(`/api/dashboard?${qs}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`dashboard ${r.status}`)
        return r.json()
      })
      .then((json) => {
        if (cancelled) return
        if (json?.ok) setData(transformPayload(json as DashboardPayload))
        else throw new Error('resposta inválida')
      })
      .catch((err) => {
        if (cancelled || (err instanceof DOMException && err.name === 'AbortError')) return
        setFetchError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [qs]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        width: "100%",
        background: "transparent",
        opacity: loading ? 0.6 : 1,
        transition: "opacity 180ms ease",
      }}
    >
      {fetchError && (
        <div style={{ margin: "0 18px 12px", padding: "10px 14px", background: "rgba(231,76,60,0.12)", border: "1px solid rgba(231,76,60,0.4)", borderRadius: 8, color: "#e74c3c", fontWeight: 700, fontSize: 13 }}>
          Erro ao carregar dados do dashboard. Verifique a conexão e recarregue a página.
        </div>
      )}
      <CardsTopo kpis={data.kpis} fmtBRL={fmtBRL} isFatias={isFatias} />

      <div style={{ padding: 18, paddingTop: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <RankingPagamentos rows={data.ranking_pagamentos} />
            <ConferenciaCaixa data={data.conferencia_caixa} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <PedidosPorPlataforma rows={data.pedidos_por_plataforma} />
            <PedidosPorAtendimento rows={data.pedidos_por_atendimento} />
            <DespesasDetalhadas rows={data.despesas_detalhadas} />
          </div>
        </div>
      </div>
    </div>
  )
}
