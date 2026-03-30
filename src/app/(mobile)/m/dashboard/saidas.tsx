"use client";

import React, { useState } from "react";
import type { ApiDashboard } from "./page";

const CARD_BG =
  "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))";
const CARD_INNER = "rgba(2,11,24,0.42)";
const AQUA_LINE = "rgba(79,220,255,0.18)";

type Accent = "aqua" | "green" | "yellow" | "red" | "purple";

function fmtBRL(v: number) {
  const n = Number(v) || 0;
  try {
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  } catch {
    return `R$ ${n.toFixed(2)}`;
  }
}

function accentRGB(accent: Accent) {
  switch (accent) {
    case "green":
      return {
        line: "rgba(80,255,160,0.35)",
        glow: "rgba(80,255,160,0.14)",
        dot: "rgba(80,255,160,0.95)",
      };
    case "yellow":
      return {
        line: "rgba(255,200,80,0.35)",
        glow: "rgba(255,200,80,0.14)",
        dot: "rgba(255,200,80,0.95)",
      };
    case "red":
      return {
        line: "rgba(255,100,120,0.35)",
        glow: "rgba(255,100,120,0.14)",
        dot: "rgba(255,100,120,0.95)",
      };
    case "purple":
      return {
        line: "rgba(160,120,255,0.35)",
        glow: "rgba(160,120,255,0.14)",
        dot: "rgba(160,120,255,0.95)",
      };
    default:
      return {
        line: "rgba(79,220,255,0.35)",
        glow: "rgba(79,220,255,0.14)",
        dot: "rgba(79,220,255,0.95)",
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
          "0 0 0 1px rgba(79,220,255,0.06) inset, 0 26px 70px rgba(0,0,0,0.42)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 1000, opacity: 0.9 }}>
      {children}
    </div>
  );
}

function RowCard({
  title,
  right,
  accent = "aqua",
  open,
  onToggle,
  children,
}: {
  title: string;
  right: string;
  accent?: Accent;
  open: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  const a = accentRGB(accent);

  return (
    <div
      style={{
        borderRadius: 18,
        background: CARD_INNER,
        border: `1px solid ${a.line}`,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.02) inset, 0 0 26px ${a.glow}`,
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%",
          cursor: "pointer",
          padding: 12,
          background: "transparent",
          border: "none",
          color: "inherit",
          textAlign: "left",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                background: a.dot,
                boxShadow: `0 0 12px ${a.dot}`,
                display: "inline-block",
                flex: "0 0 auto",
              }}
            />

            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 1000,
                  fontSize: 13,
                  color: "rgba(255,255,255,0.96)",
                  whiteSpace: "nowrap",
                  flex: "0 0 auto",
                }}
              >
                {title.toUpperCase()}
              </div>

              <div
                style={{
                  fontSize: 14,
                  fontWeight: 1000,
                  opacity: 0.9,
                  transform: open ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 160ms ease",
                  lineHeight: 1,
                  marginTop: 1,
                }}
                aria-hidden
              >
                ▾
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: 12,
              fontWeight: 1000,
              opacity: 0.92,
              whiteSpace: "nowrap",
              flex: "0 0 auto",
            }}
          >
            {right}
          </div>
        </div>
      </button>

      {open ? (
        <div
          style={{
            padding: "10px 12px 12px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0))",
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export default function Saidas({ api }: { api: ApiDashboard | null }) {
  const items = api?.despesas_detalhadas ?? [];
  const total = items.reduce((s, i) => s + i.valor, 0);
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <Shell>
      <SectionLabel>Saídas por Categoria</SectionLabel>

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        {items.length === 0 ? (
          <div
            style={{
              padding: "10px 10px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(0,0,0,0.14)",
              fontSize: 12,
              fontWeight: 900,
              opacity: 0.75,
            }}
          >
            Nenhuma despesa no período.
          </div>
        ) : (
          items.map((item) => (
            <RowCard
              key={item.key}
              title={item.key}
              right={fmtBRL(item.valor)}
              accent="aqua"
              open={openKey === item.key}
              onToggle={() => setOpenKey((prev) => (prev === item.key ? null : item.key))}
            >
              <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.75 }}>
                {item.pct.toFixed(1)}% das despesas totais
              </div>
            </RowCard>
          ))
        )}

        <div
          style={{
            marginTop: 6,
            paddingTop: 10,
            borderTop: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 12,
              padding: "0 6px",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 1000,
                letterSpacing: 0.4,
                opacity: 0.78,
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              Despesas totais
            </div>

            <div
              style={{
                fontSize: 13,
                fontWeight: 1100 as any,
                opacity: 0.96,
                whiteSpace: "nowrap",
              }}
            >
              {fmtBRL(total)}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
