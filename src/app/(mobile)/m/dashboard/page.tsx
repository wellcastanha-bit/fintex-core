"use client";

import React, { useEffect, useMemo, useState } from "react";
import Entradas from "./entradas";
import Saidas from "./saidas";
import CardCaixa from "./conferenciacaixa";
import { resolveTodayBRT } from "@/lib/period";
import { useEmpresa } from "@/lib/empresa-context";
import { useLoadingStore } from "@/lib/loading-store";

const BG_PAGE =
  "radial-gradient(1200px 700px at 20% 0%, rgba(45,207,190,0.12), transparent 55%), radial-gradient(900px 520px at 80% 10%, rgba(45,207,190,0.10), transparent 60%), linear-gradient(180deg, rgba(4,19,40,1), rgba(2,11,24,1) 58%, rgba(2,9,20,1))";

const CARD_BG =
  "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))";
const AQUA_LINE = "rgba(45,207,190,0.18)";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function addDaysISO(iso: string, deltaDays: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  return toISODate(dt);
}
function clampISO(iso: string) {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
}
function isoToBR(iso: string) {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
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

function TitleRow({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 1000, letterSpacing: 0.2 }}>{title}</div>
        {subtitle ? (
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75, fontWeight: 900 }}>{subtitle}</div>
        ) : null}
      </div>
      {right ? <div style={{ flex: "0 0 auto" }}>{right}</div> : null}
    </div>
  );
}

type PeriodKey =
  | "hoje"
  | "ontem"
  | "7d"
  | "30d"
  | "mes_anterior"
  | "este_mes"
  | "esse_ano"
  | "uma_data"
  | "um_periodo";

const PERIOD_LABEL: Record<PeriodKey, string> = {
  hoje: "hoje",
  ontem: "ontem",
  "7d": "últimos 7 dias",
  "30d": "últimos 30 dias",
  mes_anterior: "mês anterior",
  este_mes: "esse mês",
  esse_ano: "esse ano",
  uma_data: "uma data",
  um_periodo: "um período",
};

function PeriodSelect({ value, onChange }: { value: PeriodKey; onChange: (v: PeriodKey) => void }) {
  return (
    <div style={{ display: "grid", gap: 8, minWidth: 160 }}>
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as PeriodKey)}
          style={{
            width: "100%",
            height: 40,
            borderRadius: 14,
            border: "1px solid rgba(45,207,190,0.20)",
            background: "rgba(2,11,24,0.55)",
            color: "rgba(255,255,255,0.92)",
            fontWeight: 950,
            outline: "none",
            padding: "0 12px",
            appearance: "none",
          }}
        >
          {(["hoje", "ontem", "7d", "30d", "mes_anterior", "este_mes", "esse_ano", "uma_data", "um_periodo"] as PeriodKey[]).map(
            (k) => (
              <option key={k} value={k}>
                {PERIOD_LABEL[k]}
              </option>
            )
          )}
        </select>
        <div
          style={{
            position: "absolute",
            right: 12,
            top: 0,
            height: 40,
            display: "grid",
            placeItems: "center",
            pointerEvents: "none",
            opacity: 0.85,
            fontWeight: 1000,
          }}
        >
          ▾
        </div>
      </div>
    </div>
  );
}

const DATE_INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  height: 42,
  borderRadius: 14,
  border: "1px solid rgba(45,207,190,0.20)",
  background: "rgba(2,11,24,0.55)",
  color: "rgba(255,255,255,0.92)",
  fontWeight: 1000,
  fontSize: 13,
  outline: "none",
  padding: "0 12px",
  boxSizing: "border-box",
  appearance: "none",
  WebkitAppearance: "none",
};

function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      className="fintex-date"
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={DATE_INPUT_STYLE}
    />
  );
}

export type ApiRow = { key: string; pedidos: number; valor: number; pct: number; accent?: string };

export type ApiDashboard = {
  ok: boolean;
  isHolding?: boolean;
  cards_topo?: {
    pedidos: number;
    faturamento: number;
    ticket_medio: number;
    despesas: number;
    despesas_pct: number;
    lucro_estimado: number;
    margem_pct: number;
    fatias_total: number;
  };
  ranking_pagamentos?: ApiRow[];
  pedidos_por_plataforma?: ApiRow[];
  pedidos_por_atendimento?: ApiRow[];
  conferencia_caixa?: {
    caixaInicial: number;
    entradasDinheiro: number;
    saidas: number;
    provaReal: number;
    caixaFinal: number;
    quebra: number;
    status?: "OK" | "ATENÇÃO";
  };
  despesas_detalhadas?: Array<{
    key: string;
    valor: number;
    pct: number;
    itens: Array<{ id: string; descricao: string; valor: number; data: string }>;
  }>;
  error?: string;
};

export default function MobileDashboardPage() {
  const opToday = useMemo(() => resolveTodayBRT(), []);
  const { isFatias } = useEmpresa();

  const [period, setPeriod] = useState<PeriodKey>("hoje");
  const [singleDate, setSingleDate] = useState<string>(opToday);
  const [rangeFrom, setRangeFrom] = useState<string>(addDaysISO(opToday, -6));
  const [rangeTo, setRangeTo] = useState<string>(opToday);

  const { queryString, localLabel } = useMemo(() => {
    const end = opToday;

    if (period === "hoje") return { queryString: "period=hoje", localLabel: "Hoje" };
    if (period === "ontem") return { queryString: "period=ontem", localLabel: "Ontem" };
    if (period === "7d") return { queryString: "period=7d", localLabel: "Últimos 7 dias" };
    if (period === "30d") return { queryString: "period=30d", localLabel: "Últimos 30 dias" };
    if (period === "este_mes") return { queryString: "period=este_mes", localLabel: "Esse mês" };
    if (period === "mes_anterior") return { queryString: "period=mes_anterior", localLabel: "Mês anterior" };
    if (period === "esse_ano") return { queryString: "period=esse_ano", localLabel: "Esse ano" };

    if (period === "uma_data") {
      const d = clampISO(singleDate) || end;
      return { queryString: `from=${d}&to=${d}`, localLabel: isoToBR(d) };
    }

    const f0 = clampISO(rangeFrom) || addDaysISO(end, -6);
    const t0 = clampISO(rangeTo) || end;
    const f = f0 <= t0 ? f0 : t0;
    const t = f0 <= t0 ? t0 : f0;
    return { queryString: `from=${f}&to=${t}`, localLabel: `${isoToBR(f)} – ${isoToBR(t)}` };
  }, [period, opToday, singleDate, rangeFrom, rangeTo]);

  const [_loading, setLoading] = useState(false);
  const [api, setApi] = useState<ApiDashboard | null>(null);
  const [err, setErr] = useState<string>("");
  const { startLoading, stopLoading } = useLoadingStore();

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;

    async function load() {
      setLoading(true);
      setErr("");
      startLoading();
      try {
        const res = await fetch(`/api/dashboard?${queryString}`, { signal: controller.signal });
        const j = (await res.json()) as ApiDashboard;
        if (!res.ok || !j?.ok) throw new Error(j?.error || `Erro ${res.status}`);
        if (alive) setApi(j);
      } catch (e: any) {
        if (alive && e?.name !== "AbortError") {
          setApi(null);
          setErr(e?.message || "Erro ao carregar dashboard");
        }
      } finally {
        if (alive) setLoading(false);
        stopLoading();
      }
    }

    load();
    return () => {
      alive = false;
      controller.abort();
      stopLoading();
    };
  }, [queryString, startLoading, stopLoading]);

  const conf = api?.conferencia_caixa;

  return (
    <>
      <div style={{ display: "grid", gap: 12 }}>
        <Shell style={{ background: BG_PAGE }}>
          <TitleRow
            title="Dashboard"
            subtitle={localLabel}
            right={
              <PeriodSelect
                value={period}
                onChange={(v) => {
                  setPeriod(v);
                  setErr("");
                  if (v === "uma_data") setSingleDate(opToday);
                  if (v === "um_periodo") {
                    setRangeFrom(addDaysISO(opToday, -6));
                    setRangeTo(opToday);
                  }
                }}
              />
            }
          />
          {err ? (
            <div style={{ marginTop: 10, fontSize: 11, opacity: 0.7, fontWeight: 900 }}>
              {`Erro: ${err}`}
            </div>
          ) : null}
        </Shell>

        {period === "uma_data" ? (
          <Shell>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 950, opacity: 0.82 }}>Selecionar data</div>
              <DateInput value={singleDate} onChange={setSingleDate} />
            </div>
          </Shell>
        ) : null}

        {period === "um_periodo" ? (
          <Shell>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 950, opacity: 0.82 }}>Selecionar período</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, minWidth: 0 }}>
                <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 950, opacity: 0.75 }}>De:</div>
                  <DateInput value={rangeFrom} onChange={setRangeFrom} />
                </div>
                <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 950, opacity: 0.75 }}>Até:</div>
                  <DateInput value={rangeTo} onChange={setRangeTo} />
                </div>
              </div>
            </div>
          </Shell>
        ) : null}

        <Entradas api={api} isFatias={isFatias} />

        <Saidas api={api} />

        <CardCaixa conf={conf ?? null} />
      </div>

      <style jsx global>{`
        input.fintex-date::-webkit-calendar-picker-indicator {
          opacity: 0;
          width: 0;
          height: 0;
          margin: 0;
          padding: 0;
          pointer-events: none;
        }
        input.fintex-date {
          padding-right: 12px !important;
        }
      `}</style>
    </>
  );
}
