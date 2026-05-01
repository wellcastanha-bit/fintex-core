"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useEmpresaId } from "@/lib/hooks/use-empresa-id";
import { subscribeOrders } from "@/lib/realtime";
import { resolveTodayBRT } from "@/lib/period";
import { useEmpresa } from "@/lib/empresa-context";

const AQUA_LINE = "rgba(79,220,255,0.18)";
const CARD_BG =
  "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))";
const CARD_INNER = "rgba(2,11,24,0.42)";

type Accent = "aqua" | "green" | "yellow" | "red" | "purple";

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

function fmtBRL(v: number) {
  const n = Number(v);
  const vv = Number.isFinite(n) ? n : 0;
  try {
    return vv.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  } catch {
    return `R$ ${vv.toFixed(2)}`;
  }
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function isoToBR(iso: string) {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
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
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function PageTitleRow({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      <div style={{ fontSize: 20, fontWeight: 1000, letterSpacing: 0.2 }}>
        {children}
      </div>
      <div style={{ marginLeft: "auto", minWidth: 0 }}>{right}</div>
    </div>
  );
}

function Badge({ text, accent = "aqua" }: { text: string; accent?: Accent }) {
  const a = accentRGB(accent);
  return (
    <span
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        border: "none",
        background: "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.92)",
        fontSize: 13,
        fontWeight: 1000,
        letterSpacing: 0.2,
        boxShadow: `0 0 18px ${a.glow}`,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

type Pedido = {
  id: string;
  cliente: string;
  valor: number;
  plataforma: string;
  atendimento: string;
  pagamento: string;
  hora: string;
  status: string;
  responsavel?: string;
  bairro?: string;
  taxaEntrega?: number;
  fatias?: number | null;
};

function statusAccentBadge(s: string): Accent {
  const k = String(s || "").toUpperCase();
  if (k.includes("PRODU")) return "red";
  if (k.includes("ENTREG")) return "green";
  if (k.includes("CANCEL")) return "red";
  return "aqua";
}
function paymentAccent(p: string): Accent {
  const k = String(p || "").toUpperCase();
  if (k.includes("DIN")) return "green";
  if (k.includes("PIX")) return "aqua";
  if (k.includes("CART")) return "yellow";
  if (k.includes("ONLINE")) return "purple";
  return "aqua";
}
function orderBorderAccentOnly2(status: string): "red" | "green" {
  const k = String(status || "").toUpperCase();
  if (k.includes("ENTREG")) return "green";
  return "red";
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 14,
        border: "1px solid rgba(79,220,255,0.10)",
        background: "rgba(2,11,24,0.36)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.02) inset",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 1000, opacity: 0.7 }}>
        {label.toUpperCase()}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 950,
          opacity: 0.92,
          textAlign: "right",
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function PedidoCard({
  p,
  open,
  onToggle,
  isFatias,
}: {
  p: Pedido;
  open: boolean;
  onToggle: () => void;
  isFatias?: boolean;
}) {
  const borderAcc = orderBorderAccentOnly2(p.status);
  const a = accentRGB(borderAcc);

  return (
    <div
      style={{
        borderRadius: 18,
        padding: 14,
        background: CARD_INNER,
        border: `1px solid ${a.line}`,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.02) inset, 0 0 26px ${a.glow}`,
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          textAlign: "left",
          background: "transparent",
          border: "none",
          padding: 0,
          color: "inherit",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto auto",
            gap: 10,
            alignItems: "center",
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 1000,
              letterSpacing: 0.2,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {p.cliente}
          </div>

          <div
            style={{
              fontSize: 15,
              fontWeight: 1000,
              opacity: 0.95,
              whiteSpace: "nowrap",
            }}
          >
            {fmtBRL(p.valor)}
          </div>

          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              border: `1px solid ${a.line}`,
              background: "rgba(255,255,255,0.06)",
              display: "grid",
              placeItems: "center",
              boxShadow: `0 0 18px ${a.glow}`,
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 220ms ease",
              fontWeight: 1000,
              opacity: 0.9,
            }}
            aria-label="Expandir"
          >
            ▾
          </div>
        </div>

        <div
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            opacity: 0.85,
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 1000,
              letterSpacing: 0.2,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {p.plataforma} - {p.atendimento}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 950, opacity: 0.75 }}>{p.hora}</div>
            <Badge text={p.pagamento} accent={paymentAccent(p.pagamento)} />
          </div>
        </div>
      </button>

      {open ? (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "grid",
            gap: 10,
          }}
        >
          {isFatias ? <FieldRow label="Fatias" value={p.fatias != null ? String(p.fatias) : "—"} /> : null}
          <FieldRow label="Forma de pagamento" value={p.pagamento} />
          <FieldRow label="Bairros" value={p.bairro || "—"} />
          <FieldRow
            label="Taxa de entrega"
            value={p.taxaEntrega != null ? fmtBRL(p.taxaEntrega) : "—"}
          />
          <FieldRow label="Responsável" value={p.responsavel || "—"} />
          <FieldRow
            label="Status"
            value={<Badge text={p.status} accent={statusAccentBadge(p.status)} />}
          />
        </div>
      ) : null}
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
  | "uma_data"
  | "um_periodo";

const PERIOD_LABEL: Record<PeriodKey, string> = {
  hoje: "hoje",
  ontem: "ontem",
  "7d": "últimos 7 dias",
  "30d": "últimos 30 dias",
  mes_anterior: "mês anterior",
  este_mes: "esse mês",
  uma_data: "uma data",
  um_periodo: "um período",
};

function PeriodSelect({
  value,
  onChange,
}: {
  value: PeriodKey;
  onChange: (v: PeriodKey) => void;
}) {
  return (
    <div style={{ display: "grid", gap: 8, minWidth: 160 }}>
      <div style={{ fontSize: 13, fontWeight: 950, opacity: 0.75, textAlign: "right" }} />
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as PeriodKey)}
          style={{
            width: "100%",
            height: 40,
            borderRadius: 14,
            border: "1px solid rgba(79,220,255,0.20)",
            background: "rgba(2,11,24,0.55)",
            color: "rgba(255,255,255,0.92)",
            fontWeight: 950,
            outline: "none",
            padding: "0 12px",
            appearance: "none",
          }}
        >
          {(
            ["hoje", "ontem", "7d", "30d", "mes_anterior", "este_mes", "uma_data", "um_periodo"] as PeriodKey[]
          ).map((k) => (
            <option key={k} value={k}>
              {PERIOD_LABEL[k]}
            </option>
          ))}
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
  border: "1px solid rgba(79,220,255,0.20)",
  background: "rgba(2,11,24,0.55)",
  color: "rgba(255,255,255,0.92)",
  fontWeight: 1000,
  fontSize: 15,
  letterSpacing: 0.2,
  outline: "none",
  padding: "0 12px",
  boxSizing: "border-box",
  appearance: "none",
  WebkitAppearance: "none",
};

function DateInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
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

type ApiPedidoRow = {
  id: string;
  created_at: string;
  status: string | null;
  responsavel: string | null;
  cliente_nome: string | null;
  plataforma: string | null;
  atendimento: string | null;
  bairro: string | null;
  taxa_entrega: number | null;
  pagamento: string | null;
  valor_pago: number | null;
  valor_final: number | null;
  troco: number | null;
  fatias: number | null;
};

function apiToPedido(r: ApiPedidoRow): Pedido {
  const ts = r.created_at ? new Date(r.created_at) : null;
  const hora = ts
    ? `${pad2(ts.getHours())}:${pad2(ts.getMinutes())}`
    : "—";
  return {
    id: r.id,
    cliente: r.cliente_nome || "—",
    valor: Number(r.valor_final ?? r.valor_pago ?? 0),
    plataforma: r.plataforma || "—",
    atendimento: r.atendimento || "—",
    pagamento: r.pagamento || "—",
    hora,
    status: r.status || "—",
    responsavel: r.responsavel ?? undefined,
    bairro: r.bairro ?? undefined,
    taxaEntrega: r.taxa_entrega ?? undefined,
    fatias: r.fatias ?? null,
  };
}

export default function MobilePedidosPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [reloadTick, setReloadTick] = useState(0);

  const empresaId = useEmpresaId();
  const { isFatias } = useEmpresa();
  const opToday = useMemo(() => resolveTodayBRT(), []);

  const [period, setPeriod] = useState<PeriodKey>("hoje");
  const [singleDate, setSingleDate] = useState<string>(opToday);
  const [rangeFrom, setRangeFrom] = useState<string>(addDaysISO(opToday, -6));
  const [rangeTo, setRangeTo] = useState<string>(opToday);

  const { fromISO, toISO, queryString } = useMemo(() => {
    const end = opToday;

    if (period === "hoje") return { fromISO: end, toISO: end, queryString: "period=hoje" };
    if (period === "ontem") {
      const y = addDaysISO(end, -1);
      return { fromISO: y, toISO: y, queryString: "period=ontem" };
    }
    if (period === "7d") return { fromISO: addDaysISO(end, -6), toISO: end, queryString: "period=7d" };
    if (period === "30d") return { fromISO: addDaysISO(end, -29), toISO: end, queryString: "period=30d" };
    if (period === "este_mes") return { fromISO: opToday, toISO: end, queryString: "period=este_mes" };
    if (period === "mes_anterior") return { fromISO: opToday, toISO: end, queryString: "period=mes_anterior" };

    if (period === "uma_data") {
      const d = clampISO(singleDate) || end;
      return { fromISO: d, toISO: d, queryString: `from=${d}&to=${d}` };
    }

    const f = clampISO(rangeFrom) || addDaysISO(end, -6);
    const t = clampISO(rangeTo) || end;
    const [fi, ti] = f <= t ? [f, t] : [t, f];
    return { fromISO: fi, toISO: ti, queryString: `from=${fi}&to=${ti}` };
  }, [period, opToday, singleDate, rangeFrom, rangeTo]);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`/api/pedidos?${queryString}`, { cache: "no-store" });
        const j = await res.json();
        if (!res.ok || !j?.ok) throw new Error(j?.error || `Erro ${res.status}`);
        if (alive) setPedidos((j.rows as ApiPedidoRow[]).map(apiToPedido));
      } catch (e: any) {
        if (alive) { setPedidos([]); setErr(e?.message || "Erro ao carregar pedidos"); }
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [queryString, reloadTick]);

  useEffect(() => {
    if (!empresaId) return;
    return subscribeOrders(empresaId, () => setReloadTick((t) => t + 1));
  }, [empresaId]);

  useEffect(() => {
    const handler = () => setReloadTick((t) => t + 1);
    window.addEventListener("fintex:reload", handler);
    return () => window.removeEventListener("fintex:reload", handler);
  }, []);

  const totalPedidos = pedidos.length;
  const totalValor = useMemo(
    () => pedidos.reduce((acc, p) => acc + (Number(p.valor) || 0), 0),
    [pedidos]
  );
  const totalFatias = useMemo(
    () => pedidos.reduce((acc, p) => acc + (Number(p.fatias) || 0), 0),
    [pedidos]
  );

  return (
    <>
      <div style={{ display: "grid", gap: 12 }}>
        <PageTitleRow
          right={
            <PeriodSelect
              value={period}
              onChange={(v) => {
                setPeriod(v);
                setOpenId(null);
                if (v === "uma_data") setSingleDate(fromISO);
                if (v === "um_periodo") {
                  setRangeFrom(fromISO);
                  setRangeTo(toISO);
                }
              }}
            />
          }
        >
          Pedidos
        </PageTitleRow>

        {period === "uma_data" ? (
          <Shell>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 950, opacity: 0.82 }}>
                Selecionar data
              </div>
              <DateInput value={singleDate} onChange={setSingleDate} />
            </div>
          </Shell>
        ) : null}

        {period === "um_periodo" ? (
          <Shell>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 950, opacity: 0.82 }}>
                Selecionar período
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  minWidth: 0,
                }}
              >
                <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 950, opacity: 0.75 }}>
                    De:
                  </div>
                  <DateInput value={rangeFrom} onChange={setRangeFrom} />
                </div>

                <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 950, opacity: 0.75 }}>
                    Até:
                  </div>
                  <DateInput value={rangeTo} onChange={setRangeTo} />
                </div>
              </div>
            </div>
          </Shell>
        ) : null}

        <Shell>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) max-content",
              gap: 12,
              alignItems: "baseline",
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: 14,
                opacity: 0.82,
                fontWeight: 950,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {`Total de pedidos: ${totalPedidos}`}
            </div>

            <div
              style={{
                fontSize: 15,
                fontWeight: 1000,
                opacity: 0.95,
                whiteSpace: "nowrap",
                justifySelf: "end",
              }}
            >
              {fmtBRL(totalValor)}
            </div>
          </div>

          {isFatias ? (
            <div style={{ marginTop: 6, fontSize: 13, opacity: 0.82, fontWeight: 950 }}>
              {`Fatias vendidas: ${totalFatias}`}
            </div>
          ) : null}
          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.7, fontWeight: 950 }}>
            {isoToBR(fromISO)} - {isoToBR(toISO)}
          </div>

          {err ? (
            <div style={{ marginTop: 8, fontSize: 13, opacity: 0.7, fontWeight: 900 }}>
              {`Erro: ${err}`}
            </div>
          ) : null}
        </Shell>

        <div style={{ display: "grid", gap: 10, opacity: loading ? 0.6 : 1, transition: "opacity 180ms ease" }}>
          {pedidos.map((p) => (
            <PedidoCard
              key={p.id}
              p={p}
              open={openId === p.id}
              onToggle={() => setOpenId((cur) => (cur === p.id ? null : p.id))}
              isFatias={isFatias}
            />
          ))}
        </div>
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
