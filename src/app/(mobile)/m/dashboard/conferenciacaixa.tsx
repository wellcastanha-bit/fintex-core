"use client";

import React from "react";

const CARD_BG =
  "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))";
const CARD_INNER = "rgba(2,11,24,0.42)";
const AQUA_LINE = "rgba(45,207,190,0.18)";

type ConferenciaConf = {
  caixaInicial: number;
  entradasDinheiro: number;
  saidas: number;
  provaReal: number;
  caixaFinal: number;
  quebra: number;
  status?: "OK" | "ATENÇÃO";
};

function fmtBRL(v: number) {
  const n = Number(v) || 0;
  try {
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  } catch {
    return `R$ ${n.toFixed(2)}`;
  }
}

type LineColor = "aqua" | "green" | "red";

function lineRGB(color: LineColor) {
  switch (color) {
    case "green":
      return {
        line: "rgba(80,255,160,0.35)",
        glow: "rgba(80,255,160,0.14)",
      };
    case "red":
      return {
        line: "rgba(255,100,120,0.35)",
        glow: "rgba(255,100,120,0.14)",
      };
    default:
      return {
        line: "rgba(45,207,190,0.35)",
        glow: "rgba(45,207,190,0.14)",
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
        boxShadow:
          "0 0 0 1px rgba(45,207,190,0.06) inset, 0 26px 70px rgba(0,0,0,0.42)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function GlowCard({
  color = "aqua",
  title,
  value,
}: {
  color?: LineColor;
  title: string;
  value: string;
}) {
  const c = lineRGB(color);

  return (
    <div
      style={{
        borderRadius: 18,
        padding: 14,
        background: CARD_INNER,
        border: `1px solid ${c.line}`,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.02) inset, 0 0 26px ${c.glow}`,
        minHeight: 80,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 1000,
          opacity: 1,
          color: "rgba(255,255,255,0.98)",
        }}
      >
        {title.toUpperCase()}
      </div>

      <div style={{ marginTop: 10, fontSize: 20, fontWeight: 1000 }}>
        {value}
      </div>
    </div>
  );
}

export default function CardCaixa({
  conf,
}: {
  conf: ConferenciaConf | null;
}) {
  const ci = Number(conf?.caixaInicial) || 0;
  const ent = Number(conf?.entradasDinheiro) || 0;
  const sai = Number(conf?.saidas) || 0;
  const pr = Number(conf?.provaReal) || 0;
  const cf = Number(conf?.caixaFinal) || 0;
  const qb = Number(conf?.quebra) || 0;

  const quebraAbs = Math.abs(qb);
  const dangerQuebra = quebraAbs > 5;

  const statusPalette = dangerQuebra
    ? {
        bd: "rgba(255,107,107,0.32)",
        bg: "rgba(255,107,107,0.14)",
        dot: "rgba(255,107,107,0.95)",
        glow: "rgba(255,107,107,0.24)",
        label: "QUEBRA",
      }
    : conf?.status === "OK" || (!conf?.status && qb === 0)
    ? {
        bd: "rgba(67,208,121,0.30)",
        bg: "rgba(67,208,121,0.12)",
        dot: "rgba(67,208,121,0.95)",
        glow: "rgba(67,208,121,0.14)",
        label: "OK",
      }
    : {
        bd: "rgba(255,184,77,0.30)",
        bg: "rgba(255,184,77,0.12)",
        dot: "rgba(255,184,77,0.95)",
        glow: "rgba(255,184,77,0.12)",
        label: "ATENÇÃO",
      };

  const quebraColor: LineColor = quebraAbs <= 5 ? "green" : "red";

  return (
    <Shell>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 1000, opacity: 0.9 }}>
          Conferência de Caixa
        </div>

        <div
          style={{
            height: 24,
            padding: "0 10px",
            borderRadius: 999,
            border: `1px solid ${statusPalette.bd}`,
            background: statusPalette.bg,
            color: "rgba(255,255,255,0.92)",
            fontWeight: 950,
            fontSize: 13,
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            boxShadow: `0 0 16px ${statusPalette.glow}`,
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              background: statusPalette.dot,
              boxShadow: `0 0 10px ${statusPalette.glow}`,
              display: "inline-block",
              flex: "0 0 auto",
            }}
          />
          Status: {statusPalette.label}
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {/* Row 1: Caixa inicial + Entradas */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <GlowCard title="Caixa inicial" value={fmtBRL(ci)} color="aqua" />
          <GlowCard title="Entradas (dinheiro)" value={fmtBRL(ent)} color="green" />
        </div>

        {/* Row 2: Saídas + Prova real */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <GlowCard title="Saídas (dinheiro)" value={fmtBRL(sai)} color="red" />
          <GlowCard title="Prova real" value={fmtBRL(pr)} color="aqua" />
        </div>

        {/* Row 3: Caixa final + Quebra de caixa */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <GlowCard title="Caixa final" value={fmtBRL(cf)} color="aqua" />
          <GlowCard title="Quebra de caixa" value={fmtBRL(qb)} color={quebraColor} />
        </div>
      </div>
    </Shell>
  );
}
