"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useOrders } from "@/lib/hooks/use-orders";
import type { OrdersSourceItem } from "@/lib/types/orders";
import { resolveTodayBRT, opDateWindowDates } from "@/lib/period";

type Row = Record<string, any>;

const COLS = [
  { key: "DATA", label: "DATA", w: 90, type: "text" },
  { key: "HORA", label: "HORA", w: 90, type: "text" },
  { key: "CLIENTE", label: "CLIENTE", w: 260, type: "text" },
  { key: "PLATAFORMA", label: "PLATAFORMA", w: 160, type: "text" },
  { key: "ATENDIMENTO", label: "ATENDIMENTO", w: 160, type: "text" },
  { key: "R$ INICIAL", label: "R$ INICIAL", w: 120, type: "money" },
  { key: "TROCO", label: "TROCO", w: 120, type: "money" },
  { key: "R$ FINAL", label: "R$ FINAL", w: 120, type: "money" },
  { key: "FORMA DE PAGAMENTO", label: "FORMA DE PAGAMENTO", w: 220, type: "text" },
  { key: "BAIRROS", label: "BAIRROS", w: 170, type: "text" },
  { key: "TAXA DE ENTREGA", label: "TAXA DE ENTREGA", w: 150, type: "money" },
  { key: "RESPONSÁVEL", label: "RESPONSÁVEL", w: 170, type: "text" },
  { key: "STATUS", label: "STATUS", w: 170, type: "text" },
] as const;

function normKey(s: string) {
  return (s || "")
    .toString()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s$]/g, "")
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function parseBRLToNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;

  const original = String(v).trim();
  if (!original || original === "-" || original.toUpperCase() === "R$" || original.includes("R$ -")) return null;

  let s = original.replace(/^R\$/i, "").replace(/\s/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/[^0-9.\-]/g, "");

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function brl(v: any) {
  const n = parseBRLToNumber(v);
  if (n === null) return "R$  -";
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function dateBRFromISO(iso?: string) {
  if (!iso) return "-";
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return "-";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function hourFromISO(iso?: string) {
  if (!iso) return "-";
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return "-";
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function paymentLabel(v: any) {
  const s = (v ?? "").toString().trim().toUpperCase();
  if (s === "CARTÃO DE CRÉDITO" || s === "CRÉDITO" || s === "CREDITO") return "Cartão de Crédito";
  if (s === "CARTÃO DE DÉBITO" || s === "DÉBITO" || s === "DEBITO") return "Cartão de Débito";
  if (s === "PAGAMENTO ONLINE" || s === "ONLINE") return "Pagamento Online";
  if (s === "PIX") return "PIX";
  if (s === "DINHEIRO") return "Dinheiro";
  return (v ?? "-").toString();
}


function isInWindow(iso: string | undefined, start: Date, end: Date) {
  if (!iso) return false;
  const t = new Date(String(iso)).getTime();
  if (!Number.isFinite(t)) return false;
  return t >= start.getTime() && t < end.getTime();
}

function mapOrderToRow(o: OrdersSourceItem, i: number): Row {
  const out: Row = { __ROWNUMBER: i + 2, __ID: o?.id ?? "" };

  const baseISO = o.created_at || "";

  out[normKey("DATA")] = dateBRFromISO(baseISO) || "-";
  out[normKey("HORA")] = hourFromISO(baseISO) || "-";

  out[normKey("CLIENTE")] = o.cliente_nome ?? "-";
  out[normKey("PLATAFORMA")] = (o.plataforma ?? "-").toString().toUpperCase();
  out[normKey("ATENDIMENTO")] = (o.atendimento ?? "-").toString().toUpperCase();

  out[normKey("R$ INICIAL")] = o.valor_pago ?? 0;
  out[normKey("TROCO")] = o.troco ?? 0;
  out[normKey("R$ FINAL")] = o.valor_final ?? 0;

  out[normKey("FORMA DE PAGAMENTO")] = paymentLabel(o.pagamento ?? "-");

  out[normKey("BAIRROS")] = (o.bairro ?? "-").toString().trim() || "-";
  out[normKey("TAXA DE ENTREGA")] = o.taxa_entrega ?? 0;

  out[normKey("RESPONSÁVEL")] = o.responsavel ?? "Operador de Caixa";
  out[normKey("STATUS")] = o.status ?? "EM PRODUÇÃO";

  for (const c of COLS) {
    const k = normKey(c.key);
    if (!(k in out)) out[k] = c.type === "money" ? null : "-";
  }

  return out;
}

const AQUA_SOFT = "rgba(79,220,255,0.22)";

const headerStyle = (hover: boolean, width: number): React.CSSProperties => {
  const borderColor = hover ? "rgba(75,212,246,0.85)" : "rgba(75,212,246,0.55)";
  return {
    width,
    height: 46,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
    position: "sticky",
    top: 0,
    zIndex: 5,
    border: `1px solid ${borderColor}`,
    transition: "border 160ms ease, box-shadow 160ms ease",
    userSelect: "none",
    background: `linear-gradient(180deg, #11586994 0%, #1b5d6d94 40%, #3590a794 100%)`,
    boxShadow: hover ? "0 0 22px rgba(75,212,246,0.55)" : `0 0 18px ${AQUA_SOFT}`,
  };
};

type Props = {
  emptyText?: string;
  filterOperationalDay?: boolean;
  operationalISO?: string;
};

export default function UltimosPedidos({
  emptyText = "Nada para mostrar.",
  filterOperationalDay = true,
  operationalISO,
}: Props) {
  const [hoverHeader, setHoverHeader] = useState(false);
  const { orders, prependOrder } = useOrders();

  useEffect(() => {
    const handler = (e: Event) => {
      prependOrder((e as CustomEvent<OrdersSourceItem>).detail);
    };
    window.addEventListener("pdv:order-saved", handler);
    return () => window.removeEventListener("pdv:order-saved", handler);
  }, [prependOrder]);

  const minWidth = useMemo(() => COLS.reduce((a, c) => a + c.w, 0), []);

  const visible = useMemo(() => {
    if (!filterOperationalDay) return orders.slice(0, 10);

    const opDate = operationalISO ?? resolveTodayBRT();
    const win = opDateWindowDates(opDate);
    return orders
      .filter((o) => isInWindow(o.created_at, win.start, win.end))
      .slice(0, 10);
  }, [orders, filterOperationalDay, operationalISO]);

  const rows: Row[] = useMemo(() => visible.map(mapOrderToRow), [visible]);

  return (
    <div
      style={{
        maxWidth: 1350,
        width: "100%",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(79,220,255,0.30)",
        boxShadow: `0 18px 60px rgba(0,0,0,0.55), 0 0 18px ${AQUA_SOFT}`,
        background: `
          radial-gradient(1200px 320px at 15% -10%, rgba(79,220,255,0.10) 0%, rgba(79,220,255,0.04) 45%, rgba(79,220,255,0.02) 70%),
          linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 22%, rgba(6,16,37,0.94) 100%)
        `,
      }}
    >
      <div style={{ maxHeight: 500, overflowY: "auto", overflowX: "auto" }}>
        <div style={{ width: minWidth }}>
          <div
            onMouseEnter={() => setHoverHeader(true)}
            onMouseLeave={() => setHoverHeader(false)}
            style={headerStyle(hoverHeader, minWidth)}
          >
            <div
              style={{
                pointerEvents: "none",
                position: "absolute",
                inset: 0,
                background: `
                  linear-gradient(
                    180deg,
                    transparent 0%,
                    rgba(75,212,246,0.28) 48%,
                    rgba(75,212,246,0.28) 52%,
                    transparent 72%
                  )
                `,
                opacity: hoverHeader ? 0.9 : 0.6,
                transition: "opacity 180ms ease",
              }}
            />
            <div
              style={{
                position: "relative",
                zIndex: 2,
                height: "100%",
                display: "grid",
                gridTemplateColumns: COLS.map((c) => `${c.w}px`).join(" "),
                alignItems: "center",
              }}
            >
              {COLS.map((c) => (
                <div
                  key={c.key}
                  style={{
                    textAlign: "center",
                    color: "#eaf0ff",
                    fontWeight: 900,
                    fontSize: 12,
                    letterSpacing: 0.35,
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.label}
                </div>
              ))}
            </div>
          </div>

          {rows.map((r, idx) => (
            <div
              key={String(r.__ID || r.__ROWNUMBER || idx)}
              style={{
                display: "grid",
                gridTemplateColumns: COLS.map((c) => `${c.w}px`).join(" "),
                background: "rgba(1,27,60,0.42)",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                color: "#e9f1ff",
              }}
            >
              {COLS.map((c) => {
                const raw = r?.[normKey(c.key)];
                const txt = c.type === "money" ? brl(raw) : (raw ?? "").toString().trim() || "-";
                return (
                  <div
                    key={c.key}
                    title={txt}
                    style={{
                      padding: "12px 8px",
                      fontWeight: 800,
                      fontSize: 12,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      boxSizing: "border-box",
                    }}
                  >
                    {txt}
                  </div>
                );
              })}
            </div>
          ))}

          {!rows.length && (
            <div style={{ padding: 14, fontWeight: 900, color: "#eaf0ff", opacity: 0.75 }}>{emptyText}</div>
          )}
        </div>
      </div>
    </div>
  );
}
