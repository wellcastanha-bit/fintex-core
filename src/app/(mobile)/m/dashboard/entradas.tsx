"use client";

import React, { type ReactNode } from "react";
import type { ApiDashboard, ApiRow as ApiRowType } from "./page";
import AnimatedMetricValue from "@/components/animated-metric-value";

const CARD_BG =
  "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))";
const CARD_INNER = "rgba(2,11,24,0.42)";
const AQUA_LINE = "rgba(255,255,255,0.08)";

type Accent = "aqua" | "green" | "yellow" | "red" | "purple" | "pink";

type ApiRow = { label: string; pedidos: number; valor: number; pct: number; accent?: Accent };

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
  const r = Math.round(n * 10) / 10;
  return `${r.toFixed(1)}%`;
}

function accentRGB(accent: Accent) {
  switch (accent) {
    case "green":
      return {
        line: "rgba(80,255,160,0.35)",
        glow: "rgba(80,255,160,0.14)",
        dot: "rgba(80,255,160,0.95)",
        bar: "linear-gradient(90deg, rgba(80,255,160,0.28) 0%, rgba(80,255,160,0.90) 55%, rgba(255,255,255,0.22) 100%)",
      };
    case "yellow":
      return {
        line: "rgba(255,200,80,0.35)",
        glow: "rgba(255,200,80,0.14)",
        dot: "rgba(255,200,80,0.95)",
        bar: "linear-gradient(90deg, rgba(255,200,80,0.28) 0%, rgba(255,200,80,0.90) 55%, rgba(255,255,255,0.22) 100%)",
      };
    case "red":
      return {
        line: "rgba(255,100,120,0.35)",
        glow: "rgba(255,100,120,0.14)",
        dot: "rgba(255,100,120,0.95)",
        bar: "linear-gradient(90deg, rgba(255,100,120,0.28) 0%, rgba(255,100,120,0.90) 55%, rgba(255,255,255,0.22) 100%)",
      };
    case "purple":
      return {
        line: "rgba(160,120,255,0.35)",
        glow: "rgba(160,120,255,0.14)",
        dot: "rgba(160,120,255,0.95)",
        bar: "linear-gradient(90deg, rgba(160,120,255,0.28) 0%, rgba(160,120,255,0.90) 55%, rgba(255,255,255,0.22) 100%)",
      };
    case "pink":
      return {
        line: "rgba(255,100,180,0.35)",
        glow: "rgba(255,100,180,0.14)",
        dot: "rgba(255,100,180,0.95)",
        bar: "linear-gradient(90deg, rgba(255,100,180,0.28) 0%, rgba(255,100,180,0.90) 55%, rgba(255,255,255,0.22) 100%)",
      };
    default:
      return {
        line: "rgba(45,207,190,0.35)",
        glow: "rgba(45,207,190,0.14)",
        dot: "rgba(45,207,190,0.95)",
        bar: "linear-gradient(90deg, rgba(45,207,190,0.30) 0%, #2DCFBE 55%, rgba(255,255,255,0.25) 100%)",
      };
  }
}

function Shell({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        borderRadius: 22,
        padding: 14,
        background: CARD_BG,
        border: `1px solid ${AQUA_LINE}`,
        boxShadow: "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 14, fontWeight: 1000, opacity: 0.9 }}>
      {children}
    </div>
  );
}

function GlowCard({
  accent = "aqua",
  children,
  style,
}: {
  accent?: Accent;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const a = accentRGB(accent);
  return (
    <div
      style={{
        borderRadius: 18,
        padding: 14,
        background: CARD_INNER,
        border: `1px solid ${a.line}`,
        boxShadow: "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function TopCard({
  title,
  value,
  sub1,
  accent = "aqua",
}: {
  title: string;
  value: ReactNode;
  sub1?: string;
  accent?: Accent;
}) {
  return (
    <GlowCard accent={accent} style={{ minHeight: 84 }}>
      <div style={{ fontSize: 13, fontWeight: 1000, opacity: 0.8 }}>
        {title.toUpperCase()}
      </div>
      <div style={{ marginTop: 10, fontSize: 20, fontWeight: 1000 }}>
        {value}
      </div>
      {sub1 ? (
        <div
          style={{
            marginTop: 8,
            fontSize: 13,
            opacity: 0.78,
            fontWeight: 900,
          }}
        >
          {sub1}
        </div>
      ) : null}
    </GlowCard>
  );
}

function MiniMetricCard({
  title,
  value,
  sub,
  accent = "aqua",
  badge,
}: {
  title: string;
  value: string;
  sub: string;
  accent?: Accent;
  badge?: string;
}) {
  const a = accentRGB(accent);
  return (
    <GlowCard accent={accent} style={{ minHeight: 92, position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 12,
          fontSize: 14,
          fontWeight: 1000,
          opacity: 0.9,
          color: a.dot,
        }}
      >
        {badge ?? "0"}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: a.dot,
            boxShadow: `0 0 12px ${a.dot}`,
            display: "inline-block",
          }}
        />
        <div style={{ fontSize: 13, fontWeight: 1000, opacity: 0.85 }}>
          {title}
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 20, fontWeight: 1000 }}>
        {value}
      </div>
      <div style={{ marginTop: 8, fontSize: 13, opacity: 0.78, fontWeight: 900 }}>
        {sub}
      </div>
    </GlowCard>
  );
}

function BarRow({
  label,
  right,
  pctValue,
  subtitle,
  accent = "aqua",
}: {
  label: string;
  right: string;
  pctValue: number;
  subtitle?: string;
  accent?: Accent;
}) {
  const w = Math.max(0, Math.min(100, Number(pctValue) || 0));
  const a = accentRGB(accent);

  return (
    <GlowCard accent={accent} style={{ padding: 12, display: "grid", gap: 10 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, minWidth: 0 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              background: a.dot,
              boxShadow: `0 0 12px ${a.dot}`,
              display: "inline-block",
              flexShrink: 0,
              marginTop: 4,
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
            <div style={{ fontWeight: 1000, fontSize: 14 }}>{label}</div>
            {subtitle ? (
              <div style={{ fontSize: 13, opacity: 0.72, fontWeight: 900 }}>
                {subtitle}
              </div>
            ) : null}
          </div>
        </div>

        <div style={{ fontSize: 14, fontWeight: 1000, opacity: 0.9, flexShrink: 0, paddingTop: 1 }}>
          {right}
        </div>
      </div>

      <div
        style={{
          height: 10,
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.04)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${w}%`,
            background: a.bar,
            boxShadow: `0 0 18px ${a.glow}`,
          }}
        />
      </div>
    </GlowCard>
  );
}

const FIX_PAY = [
  "DINHEIRO",
  "PIX",
  "PAGAMENTO ONLINE",
  "CARTÃO DE CRÉDITO",
  "CARTÃO DE DÉBITO",
];
const FIX_PLAT = ["AIQFOME", "BALCÃO", "WHATSAPP", "DELIVERY MUCH", "IFOOD"];
const FIX_ATT = ["ENTREGA", "RETIRADA", "MESAS"];

function mapAccentFromLabel(label: string, kind: "pay" | "plat" | "att"): Accent {
  const L = (label || "").toUpperCase();

  if (kind === "plat") {
    if (L.includes("AMO")) return "pink";
    if (L.includes("AIQ")) return "purple";
    if (L.includes("WHATS")) return "green";
    if (L.includes("DELIVERY")) return "yellow";
    if (L.includes("IFOOD")) return "red";
    return "aqua";
  }
  if (kind === "att") {
    if (L.includes("MES")) return "yellow";
    return "aqua";
  }
  return "aqua";
}

function apiRowsToLocal(
  rows: ApiRowType[] | undefined,
  fixed: string[],
  kind: "pay" | "plat" | "att"
): ApiRow[] {
  if (rows && rows.length > 0) {
    return rows.map((r) => ({
      label: r.key,
      pedidos: r.pedidos,
      valor: r.valor,
      pct: r.pct,
      accent: (r.accent as Accent | undefined) ?? mapAccentFromLabel(r.key, kind),
    }));
  }
  return fixed.map((label) => ({
    label,
    pedidos: 0,
    valor: 0,
    pct: 0,
    accent: mapAccentFromLabel(label, kind),
  }));
}

export default function Entradas({ api, isFatias = false }: { api: ApiDashboard | null; isFatias?: boolean }) {
  const ct = api?.cards_topo;
  const pagamentos = apiRowsToLocal(api?.ranking_pagamentos, FIX_PAY, "pay");
  const plataformas = apiRowsToLocal(api?.pedidos_por_plataforma, FIX_PLAT, "plat");
  const atendimento = apiRowsToLocal(api?.pedidos_por_atendimento, FIX_ATT, "att");

  const isHolding = api?.isHolding ?? false;
  const faturamento = ct?.faturamento ?? 0;
  const lucro = isHolding ? (ct?.lucro_estimado ?? 0) : faturamento * 0.30;
  const margemPct = isHolding ? (ct?.margem_pct ?? 0) : 30;
  const fatiasTotal = ct?.fatias_total ?? 0;

  return (
    <>
      <Shell>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          <TopCard
            title="Pedidos"
            value={<AnimatedMetricValue value={ct?.pedidos ?? 0} type="integer" />}
            sub1={`Ticket médio: ${fmtBRL(ct?.ticket_medio ?? 0)}`}
            accent="aqua"
          />
          <TopCard
            title="Faturamento"
            value={<AnimatedMetricValue value={faturamento} type="currency" />}
            sub1="Receita Total:"
            accent="aqua"
          />
          <TopCard
            title="Lucro Estimado"
            value={<AnimatedMetricValue value={lucro} type="currency" />}
            sub1={`Margem: ${pct(margemPct)}`}
            accent="green"
          />
          {isFatias ? (
            <TopCard
              title="Fatias Vendidas"
              value={<AnimatedMetricValue value={fatiasTotal} type="integer" />}
              sub1={`Total: ${fmtBRL(fatiasTotal * 5)}`}
              accent="green"
            />
          ) : (
            <TopCard
              title="Despesas"
              value={<AnimatedMetricValue value={ct?.despesas ?? 0} type="currency" />}
              sub1="Despesa Total:"
              accent="red"
            />
          )}
        </div>
      </Shell>

      <Shell>
        <SectionLabel>Ranking de Pagamentos</SectionLabel>
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {pagamentos.map((r) => (
            <BarRow
              key={r.label}
              label={r.label}
              subtitle={`${r.pedidos} pedidos • ${pct(r.pct)}`}
              right={fmtBRL(r.valor)}
              pctValue={r.pct}
              accent={r.accent ?? "aqua"}
            />
          ))}
        </div>
      </Shell>

      <Shell>
        <SectionLabel>Pedidos por Plataforma</SectionLabel>
        <div
          style={{
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          {plataformas.map((r) => (
            <MiniMetricCard
              key={r.label}
              title={r.label}
              value={fmtBRL(r.valor)}
              sub={`${r.pedidos} pedidos • ${pct(r.pct)}`}
              accent={r.accent ?? "aqua"}
              badge={String(r.pedidos)}
            />
          ))}
        </div>
      </Shell>

      <Shell>
        <SectionLabel>Pedidos por Atendimento</SectionLabel>
        <div
          style={{
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          {atendimento.map((r) => (
            <MiniMetricCard
              key={r.label}
              title={r.label}
              value={fmtBRL(r.valor)}
              sub={`${r.pedidos} pedidos • ${pct(r.pct)}`}
              accent={r.accent ?? "aqua"}
              badge={String(r.pedidos)}
            />
          ))}
        </div>
      </Shell>
    </>
  );
}
