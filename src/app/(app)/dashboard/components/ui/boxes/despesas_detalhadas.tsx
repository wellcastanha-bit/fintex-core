"use client";

import { useState } from "react";
import { CardShell, fmtBRL, pct } from "../card_shell";

function fmtDate(iso: string) {
  if (!iso) return "";
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}

const PAYMENT_LABEL: Record<string, string> = {
  pix: "Pix",
  debito: "Débito",
  credito: "Crédito",
  dinheiro: "Dinheiro",
};

export type DespesaRow = {
  key: string;
  pct: number;
  valor: number;
  itens: Array<{ id: string; descricao: string; valor: number; data: string; payment_method?: string | null }>;
};

export default function DespesasDetalhadas({ rows }: { rows: DespesaRow[] }) {
  const [outerHover, setOuterHover] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <div
      onMouseEnter={() => setOuterHover(true)}
      onMouseLeave={() => setOuterHover(false)}
      style={{
        borderRadius: 20,
        border: "1px solid rgba(79,220,255,0.34)",
        boxShadow: outerHover
          ? "0 0 0 1px rgba(79,220,255,0.18), 0 0 52px rgba(79,220,255,0.20), 0 18px 60px rgba(0,0,0,0.62)"
          : "0 0 0 1px rgba(79,220,255,0.14), 0 0 40px rgba(79,220,255,0.16), 0 18px 60px rgba(0,0,0,0.62)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.12))",
        backdropFilter: outerHover ? "blur(16px)" : "blur(12px)",
        WebkitBackdropFilter: outerHover ? "blur(16px)" : "blur(12px)",
        transition: "box-shadow 180ms ease, backdrop-filter 180ms ease, filter 180ms ease",
        filter: outerHover ? "brightness(1.03)" : "brightness(1)",
        overflow: "hidden",
      }}
    >
      <CardShell style={{ border: "1px solid rgba(0,0,0,0)", boxShadow: "none" }}>
        <div
          style={{
            padding: "16px 18px 12px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ color: "rgba(255,255,255,0.92)", fontWeight: 980, fontSize: 18 }}>
            Despesas Totais
          </div>
        </div>

        <div style={{ padding: "0 18px 18px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((d) => (
            <DespesaRowTile
              key={d.key}
              row={d}
              open={openKey === d.key}
              onToggle={() => setOpenKey((prev) => (prev === d.key ? null : d.key))}
            />
          ))}
        </div>
      </CardShell>
    </div>
  );
}

function DespesaRowTile({
  row,
  open,
  onToggle,
}: {
  row: DespesaRow;
  open: boolean;
  onToggle: () => void;
}) {
  const [hover, setHover] = useState(false);

  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${hover || open ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.12)"}`,
        background: hover || open
          ? "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.20))"
          : "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.18))",
        boxShadow: hover || open
          ? "0 0 0 1px rgba(255,255,255,0.06), 0 18px 55px rgba(0,0,0,0.55)"
          : "0 18px 55px rgba(0,0,0,0.45)",
        transition: "border-color 180ms ease, box-shadow 180ms ease, background 180ms ease",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: "100%",
          padding: "14px 14px",
          background: "transparent",
          border: "none",
          color: "inherit",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          minWidth: 0,
          textAlign: "left",
        }}
      >
        <div style={{ minWidth: 0, flex: "1 1 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                color: "#4dd5f8",
                fontWeight: 950,
                fontSize: 15,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {row.key}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 1000,
                opacity: 0.7,
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 160ms ease",
                lineHeight: 1,
                color: "#4dd5f8",
                flex: "0 0 auto",
              }}
              aria-hidden
            >
              ▾
            </div>
          </div>
          <div style={{ marginTop: 6, color: "rgb(255,255,255)", fontWeight: 850, fontSize: 12 }}>
            {pct(row.pct)} do faturamento
          </div>
        </div>

        <div style={{ color: "#4dd5f8", fontWeight: 980, fontSize: 18, whiteSpace: "nowrap", flex: "0 0 auto" }}>
          {fmtBRL(row.valor)}
        </div>
      </button>

      {open && (
        <div
          style={{
            padding: "0 14px 14px 14px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "grid",
            gap: 6,
          }}
        >
          <div style={{ height: 10 }} />
          {(row.itens ?? []).map((it) => (
            <div
              key={it.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "8px 12px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div style={{ minWidth: 0, flex: "1 1 auto" }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 900,
                    opacity: 0.88,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {it.descricao || "Sem descrição"}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 2, alignItems: "center" }}>
                  {fmtDate(it.data) ? (
                    <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.5 }}>
                      {fmtDate(it.data)}
                    </div>
                  ) : null}
                  {it.payment_method ? (
                    <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.65 }}>
                      {PAYMENT_LABEL[it.payment_method] ?? it.payment_method}
                    </div>
                  ) : null}
                </div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 1000,
                  opacity: 0.95,
                  whiteSpace: "nowrap",
                  flex: "0 0 auto",
                }}
              >
                {fmtBRL(it.valor)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
