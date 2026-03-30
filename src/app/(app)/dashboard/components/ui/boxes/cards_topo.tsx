"use client";

import { useMemo, useState } from "react";

function accentMap(accent: "aqua" | "green" | "red" | "gray") {
  const map = {
    aqua: {
      bd: "rgba(79,220,255,0.34)",
      bdHover: "rgba(79,220,255,0.60)",
      glow: "rgba(79,220,255,0.18)",
      innerTop: "rgba(255,255,255,0.08)",
      innerBot: "rgba(0,0,0,0.22)",
      tag: "rgba(79, 220, 255, 0.96)",
    },
    green: {
      bd: "rgba(67,208,121,0.34)",
      bdHover: "rgba(67,208,121,0.60)",
      glow: "rgba(67,208,121,0.16)",
      innerTop: "rgba(255,255,255,0.08)",
      innerBot: "rgba(0,0,0,0.22)",
      tag: "rgba(67, 208, 121, 0.95)",
    },
    red: {
      bd: "rgba(255,107,107,0.34)",
      bdHover: "rgba(255,107,107,0.62)",
      glow: "rgba(255,107,107,0.16)",
      innerTop: "rgba(255,255,255,0.08)",
      innerBot: "rgba(0,0,0,0.22)",
      tag: "rgba(255, 107, 107, 0.95)",
    },
    gray: {
      bd: "rgba(255,255,255,0.26)",
      bdHover: "rgba(255,255,255,0.40)",
      glow: "rgba(255,255,255,0.10)",
      innerTop: "rgba(255,255,255,0.08)",
      innerBot: "rgba(0,0,0,0.22)",
      tag: "rgb(255, 255, 255)",
    },
  } as const;

  return map[accent];
}

function MetricCard({
  title,
  value,
  sub,
  accent = "aqua",
}: {
  title: string;
  value: string;
  sub: string;
  accent?: "aqua" | "green" | "red" | "gray";
}) {
  const [hover, setHover] = useState(false);
  const m = useMemo(() => accentMap(accent), [accent]);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderRadius: 18,
        border: `1px solid ${hover ? m.bdHover : m.bd}`,
        background: hover
          ? `linear-gradient(180deg, rgba(255,255,255,0.10), rgba(0,0,0,0.24))`
          : `linear-gradient(180deg, ${m.innerTop}, ${m.innerBot})`,
        boxShadow: hover
          ? `0 0 0 1px rgba(255,255,255,0.06),
             0 0 34px ${m.glow},
             0 18px 55px rgba(0,0,0,0.58)`
          : `0 0 18px ${m.glow}`,
        padding: 16,
        minHeight: 108,
        backdropFilter: "none",
        WebkitBackdropFilter: "none",
        transition:
          "border-color 180ms ease, box-shadow 180ms ease, background 180ms ease, transform 180ms ease, filter 180ms ease",
        transform: hover ? "translateY(-1px)" : "translateY(0px)",
        filter: hover ? "brightness(1.06)" : "brightness(1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div
          style={{
            color: m.tag,
            fontWeight: 950,
            fontSize: 15,
            letterSpacing: 0.6,
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>

        <div style={{ color: m.tag, fontWeight: 950, fontSize: 15, letterSpacing: 0.2 }} />
      </div>

      <div
        style={{
          marginTop: 12,
          color: "rgba(255,255,255,0.96)",
          fontWeight: 990,
          fontSize: 25,
          letterSpacing: -0.2,
        }}
      >
        {value}
      </div>

      <div style={{ marginTop: 8, color: "rgb(248, 246, 246)", fontWeight: 850, fontSize: 15 }}>{sub}</div>
    </div>
  );
}

export type DashboardKpis = {
  pedidos: number;
  faturamento: number;
  ticket_medio: number;
  margem: number;
  lucro_estimado: number;
  despesas: number;
  despesas_pct: number;
  fatias_total: number;
};

export default function CardsTopo({
  kpis,
  fmtBRL,
  isFatias = false,
}: {
  kpis: DashboardKpis;
  fmtBRL: (v: number) => string;
  isFatias?: boolean;
}) {
  const p = kpis.pedidos;
  const fat = kpis.faturamento;
  const tm = kpis.ticket_medio;
  const luc = kpis.lucro_estimado;
  const margemPctUI = kpis.margem;
  const desp = kpis.despesas;
  const despPctNum = kpis.despesas_pct;
  const subDesp = `${despPctNum.toFixed(1).replace(".", ",")}% do faturamento`;

  const fatiasTotal = kpis.fatias_total;

  return (
    <div style={{ padding: 18, paddingTop: 0 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
        <MetricCard title="PEDIDOS" value={String(p)} sub={`Ticket médio: ${fmtBRL(tm)}`} accent="gray" />
        <MetricCard title="FATURAMENTO" value={fmtBRL(fat)} sub="Receita Total:" accent="aqua" />
        <MetricCard
          title="LUCRO ESTIMADO"
          value={fmtBRL(luc)}
          sub={`Margem: ${margemPctUI.toFixed(1).replace(".", ",")}%`}
          accent="green"
        />
        {isFatias ? (
          <MetricCard
            title="FATIAS VENDIDAS"
            value={String(fatiasTotal)}
            sub={`Total: ${fmtBRL(fatiasTotal * 5)}`}
            accent="green"
          />
        ) : (
          <MetricCard title="DESPESAS" value={fmtBRL(desp)} sub={subDesp} accent="red" />
        )}
      </div>
    </div>
  );
}
