"use client";

import type { ApiDashboard } from "./page";

const CARD_BG = "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))";
const AQUA_LINE = "rgba(255,255,255,0.08)";
const CARD_INNER = "rgba(2,11,24,0.42)";

function fmtBRL(v: number) {
  const n = Number(v) || 0;
  try {
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  } catch {
    return `R$ ${n.toFixed(2)}`;
  }
}
function pct(v: number) {
  const n = Number(v) || 0;
  return `${(Math.round(n * 10) / 10).toFixed(1)}%`;
}

function BarRow({
  label,
  pedidos,
  pctValue,
  valor,
}: {
  label: string;
  pedidos: number;
  pctValue: number;
  valor: number;
}) {
  const w = Math.max(0, Math.min(100, pctValue));
  const pedidoLabel = `${pedidos} Pedido${pedidos === 1 ? "" : "s"}`;

  return (
    <div
      style={{
        padding: "14px 14px",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.10)",
        background: CARD_INNER,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: "#2DCFBE", fontWeight: 950, fontSize: 15, letterSpacing: "0.02em" }}>
            {label.toUpperCase()}
          </div>
          <div style={{ marginTop: 5, color: "rgba(255,255,255,0.92)", fontWeight: 800, fontSize: 15 }}>
            {pedidoLabel} <span style={{ opacity: 0.7 }}>·</span> {pct(pctValue)}
          </div>
        </div>
        <div
          style={{
            color: "#2DCFBE",
            fontWeight: 950,
            fontSize: 17,
            lineHeight: "18px",
            whiteSpace: "nowrap",
            marginTop: 1,
            flexShrink: 0,
          }}
        >
          {fmtBRL(valor)}
        </div>
      </div>

      <div
        style={{
          marginTop: 8,
          height: 8,
          borderRadius: 999,
          background: "rgba(255,255,255,0.08)",
          overflow: "hidden",
          border: "1px solid rgba(45,207,190,0.10)",
        }}
      >
        <div
          style={{
            width: `${w}%`,
            height: "100%",
            background: "linear-gradient(90deg, rgba(45,207,190,0.30) 0%, #2DCFBE 55%, rgba(255,255,255,0.25) 100%)",
            boxShadow: "0 0 20px rgba(45,207,190,0.18)",
          }}
        />
      </div>
    </div>
  );
}

export default function RankingPagamentos({ api }: { api: ApiDashboard | null }) {
  const rows = api?.ranking_pagamentos;
  if (!rows || rows.length === 0) return null;

  return (
    <div
      style={{
        borderRadius: 22,
        padding: 14,
        background: CARD_BG,
        border: `1px solid ${AQUA_LINE}`,
        boxShadow: "none",
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 1000, opacity: 0.9, marginBottom: 12 }}>
        Ranking de Pagamentos
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((r) => (
          <BarRow
            key={r.key}
            label={r.key}
            pedidos={r.pedidos}
            pctValue={r.pct}
            valor={r.valor}
          />
        ))}
      </div>
    </div>
  );
}
