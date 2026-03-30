"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { Save, X } from "lucide-react";
import { pdvGet, pdvSet, pdvClear, draftToPayload } from "../pdvstore";
import type { OrdersSourceItem } from "@/lib/types/orders";
import type { ConfigItem } from "../page";
import { IMAGENS_PAGAMENTOS as IMAGENS } from "../imagens";

type ToastType = "success" | "error";

type Props = {
  pagamentos: ConfigItem[];
  showToast: (msg: string, type?: ToastType) => void;
  onRequestCancel: (cancelFn: () => void) => void;
};

const WRAP_W = 370;
const PAY_BTN_W = 100;
const PAY_BTN_H = 100;
const GAP_X = 16;
const GAP_Y = 12;
const PAY_RADIUS = 14;

export default function Pagamento({ pagamentos, showToast, onRequestCancel }: Props) {
  const [forma, setForma] = useState<string>("");

  const [valorPedido, setValorPedido] = useState<string>("0,00");
  const [editandoValor, setEditandoValor] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [trocoPara, setTrocoPara] = useState<string>("0,00");
  const trocoRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [hoverFormas, setHoverFormas] = useState(false);
  const [hoverValor, setHoverValor] = useState(false);
  const [hoverSalvar, setHoverSalvar] = useState(false);
  const [hoverCancelar, setHoverCancelar] = useState(false);

  const pressIn = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "scale(0.96)";
  };
  const pressOut = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "scale(1)";
  };
  const pressOutPay = (e: React.PointerEvent<HTMLButtonElement>) => {
    const key = e.currentTarget.getAttribute("data-key") as string;
    e.currentTarget.style.transform = key && key === forma ? "scale(0.99)" : "scale(1)";
  };

  const fmtBRL = (raw: string) => {
    const v = raw.toString().replace(/[^\d]/g, "").padStart(3, "0");
    const cents = v.slice(-2);
    const ints = v.slice(0, -2);
    const n = Number(ints);
    const withThousands = n.toLocaleString("pt-BR");
    return `${withThousands},${cents}`;
  };

  const brlToNumber = (s: string) => {
    const clean = (s ?? "0,00").toString().replace(/\./g, "").replace(",", ".");
    const n = Number(clean);
    return Number.isFinite(n) ? n : 0;
  };

  const onValorChange = (s: string) => {
    const f = fmtBRL(s);
    setValorPedido(f);
    pdvSet("total", brlToNumber(f));
  };

  const onTrocoChange = (s: string) => {
    const f = fmtBRL(s);
    setTrocoPara(f);
    pdvSet("cash_tendered", brlToNumber(f));
  };

  const startEditValor = () => {
    setEditandoValor(true);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  };
  const stopEditValor = () => setEditandoValor(false);

  useEffect(() => {
    pdvSet("total", brlToNumber(valorPedido));
    if (forma) pdvSet("payment_method", forma);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const salvar = async () => {
    const valor_pedido = brlToNumber(valorPedido);

    if (!forma) return showToast("Selecione a forma de pagamento.");
    if (valor_pedido <= 0) return showToast("Informe o valor do pedido.");

    const d = pdvGet();

    if (!d.customer_name?.trim()) pdvSet("customer_name", "Cliente");
    if (!d.platform?.trim()) pdvSet("platform", "balcao");
    if (!d.service_type?.trim()) pdvSet("service_type", "retirada");

    pdvSet("payment_method", forma);
    pdvSet("total", valor_pedido);
    pdvSet("cash_tendered", brlToNumber(trocoPara));

    setLoading(true);

    const savedDraft = pdvGet();
    const savedPayload = draftToPayload(savedDraft);
    let savedId: string | undefined;
    let savedCreatedAt: string | undefined;

    try {
      const r = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(savedPayload),
      });

      const j = await r.json().catch(() => null);

      if (!r.ok || !j?.ok) {
        showToast(j?.error ?? "Erro ao salvar pedido.", "error");
        return;
      }

      savedId = j.id;
      savedCreatedAt = j.created_at;
    } catch {
      showToast("Sem conexão com o servidor.", "error");
      return;
    } finally {
      setLoading(false);
    }

    const optimisticOrder: OrdersSourceItem = {
      id: savedId ?? crypto.randomUUID(),
      created_at: savedCreatedAt ?? new Date().toISOString(),
      status: "EM PRODUÇÃO",
      responsavel: null,
      cliente_nome: savedPayload.customer_name || "Cliente",
      plataforma: savedDraft.platform ?? null,
      atendimento: savedDraft.service_type ?? null,
      bairro: savedPayload.bairros,
      taxa_entrega: savedPayload.taxa_entrega,
      pagamento: savedPayload.payment_method,
      valor_pago: savedPayload.r_inicial,
      valor_final: null,
      troco: savedPayload.troco,
    };
    window.dispatchEvent(new CustomEvent<OrdersSourceItem>("pdv:order-saved", { detail: optimisticOrder }));

    showToast("Pedido salvo", "success");
    pdvClear();
    setForma("");
    setValorPedido("0,00");
    setEditandoValor(false);
    setTrocoPara("0,00");
  };

  const cancelarReal = () => {
    setForma("");
    setValorPedido("0,00");
    setEditandoValor(false);
    setTrocoPara("0,00");
    pdvClear();
    showToast("Pedido cancelado");
  };

  const cancelar = () => {
    onRequestCancel(cancelarReal);
  };

  const ativas = pagamentos.filter((p) => p.ativo);
  const placeholders = (3 - (ativas.length % 3)) % 3;

  const PayBtn = ({ p }: { p: ConfigItem }) => {
    const ativo = forma === p.codigo;
    const src = IMAGENS[p.codigo] ?? null;

    return (
      <button
        type="button"
        data-key={p.codigo}
        tabIndex={-1}
        onClick={(e) => {
          setForma(p.codigo);
          pdvSet("payment_method", p.codigo);
          (e.currentTarget as HTMLButtonElement).blur();
          if (p.codigo === "dinheiro") requestAnimationFrame(() => trocoRef.current?.focus());
        }}
        onFocus={(e) => (e.currentTarget as HTMLButtonElement).blur()}
        onPointerDown={pressIn}
        onPointerUp={pressOutPay}
        onPointerLeave={pressOutPay}
        onPointerCancel={pressOutPay}
        onMouseDown={(e) => e.preventDefault()}
        aria-pressed={ativo}
        style={{
          width: PAY_BTN_W,
          height: PAY_BTN_H,
          padding: src ? 0 : "0 8px",
          border: src
            ? "none"
            : ativo
            ? "1px solid rgba(79,220,255,0.55)"
            : "1px solid rgba(255,255,255,0.14)",
          background: src
            ? "transparent"
            : ativo
            ? "rgba(79,220,255,0.12)"
            : "rgba(255,255,255,0.06)",
          color: "#eaf0ff",
          fontWeight: 900,
          fontSize: 12,
          cursor: "pointer",
          outline: "none",
          boxShadow: "none",
          borderRadius: PAY_RADIUS,
          overflow: "hidden",
          lineHeight: src ? 0 : 1.3,
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",
          WebkitAppearance: "none",
          appearance: "none",
          boxSizing: "border-box",
          transform: ativo ? "scale(0.99)" : "scale(1)",
          transition: "transform 90ms ease",
          textAlign: "center",
        }}
      >
        {src ? (
          <Image
            src={src}
            alt={p.nome}
            width={PAY_BTN_W}
            height={PAY_BTN_H}
            priority
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
              filter: forma && !ativo ? "grayscale(100%) contrast(0.9) brightness(0.9)" : "none",
              transition: "filter 140ms ease",
            }}
          />
        ) : (
          <span
            style={{
              filter: forma && !ativo ? "opacity(0.45)" : "none",
              transition: "filter 140ms ease",
            }}
          >
            {p.nome}
          </span>
        )}
      </button>
    );
  };

  const valorNum = brlToNumber(valorPedido);
  const trocoParaNum = brlToNumber(trocoPara);
  const trocoCalc = Math.max(0, trocoParaNum - valorNum);
  const trocoFmt = trocoCalc.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const premiumBg = `radial-gradient(
      900px 200px at 15% -10%,
      rgba(79, 220, 255, 0.12) 0%,
      rgba(79,220,255,0.06) 35%,
      rgba(79, 220, 255, 0.04) 60%
    ),
    linear-gradient(
      180deg,
      rgba(255,255,255,0.08) 0%,
      rgba(255,255,255,0.04) 25%,
      rgba(6,16,37,0.94) 100%
    )`;

  const hoverBorder = (_hover: boolean) => "1px solid rgba(79,220,255,0.55)";

  const hoverShadow = (hover: boolean) =>
    hover
      ? `inset 0 1px 0 rgba(255,255,255,0.12), 0 0 18px rgba(79,220,255,0.45)`
      : `inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.45)`;

  const actionFieldStyle = (hover: boolean, tint: "green" | "red"): React.CSSProperties => {
    const glowColor = tint === "green" ? "rgba(14,212,63,0.55)" : "rgba(225,11,11,0.55)";
    const borderColor =
      tint === "green"
        ? hover
          ? "rgba(14,212,63,0.85)"
          : "rgba(14,212,63,0.55)"
        : hover
        ? "rgba(225,11,11,0.85)"
        : "rgba(225,11,11,0.55)";

    return {
      height: 58,
      width: "100%",
      borderRadius: 14,
      border: `1px solid ${borderColor}`,
      boxShadow: hover
        ? `inset 0 1px 0 rgba(255,255,255,0.14), 0 0 18px ${glowColor}, 0 0 32px ${glowColor}`
        : `inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.45)`,
      transition: "border 160ms ease, box-shadow 160ms ease, transform 90ms ease",
      transform: "scale(1)",
      cursor: "pointer",
      userSelect: "none",
      WebkitTapHighlightColor: "transparent",
      background:
        tint === "green"
          ? `linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 25%, rgba(8,85,28,0.95) 100%)`
          : `linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 25%, rgba(120,10,10,0.95) 100%)`,
      color: "#fff",
      fontWeight: 900,
      fontSize: 20,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    };
  };

  return (
    <div style={{ width: WRAP_W }}>
      <div
        onMouseEnter={() => setHoverFormas(true)}
        onMouseLeave={() => setHoverFormas(false)}
        style={{
          borderRadius: 16,
          padding: "16px 14px 16px",
          background: premiumBg,
          border: hoverBorder(hoverFormas),
          boxShadow: hoverShadow(hoverFormas),
          transition: "border 160ms ease, box-shadow 160ms ease",
        }}
      >
        <div style={{ color: "#27d3ff", fontWeight: 800, fontSize: 18, marginBottom: 12 }}>
          Formas de Pagamento:
        </div>

        {ativas.length === 0 ? (
          <div style={{ color: "rgba(234,240,255,0.45)", fontWeight: 700, fontSize: 14, padding: "8px 0" }}>
            Nenhuma forma de pagamento configurada.
          </div>
        ) : (
          <div
            style={{
              paddingLeft: 20,
              paddingRight: 20,
              display: "grid",
              gridTemplateColumns: `repeat(3, ${PAY_BTN_W}px)`,
              gridAutoRows: `${PAY_BTN_H}px`,
              columnGap: GAP_X,
              rowGap: GAP_Y,
              justifyContent: "center",
              alignContent: "start",
              boxSizing: "border-box",
            }}
          >
            {ativas.map((p) => (
              <PayBtn key={p.id} p={p} />
            ))}
            {Array.from({ length: placeholders }).map((_, i) => (
              <div key={`ph-${i}`} style={{ width: PAY_BTN_W, height: PAY_BTN_H }} />
            ))}
          </div>
        )}
      </div>

      <div
        onMouseEnter={() => setHoverValor(true)}
        onMouseLeave={() => setHoverValor(false)}
        style={{
          marginTop: 16,
          borderRadius: 16,
          padding: "18px 18px",
          background: premiumBg,
          border: hoverBorder(hoverValor),
          boxShadow: hoverShadow(hoverValor),
          transition: "border 160ms ease, box-shadow 160ms ease",
        }}
      >
        {!editandoValor ? (
          <button
            type="button"
            onClick={startEditValor}
            onPointerDown={pressIn}
            onPointerUp={pressOut}
            onPointerLeave={pressOut}
            onPointerCancel={pressOut}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              width: "100%",
              border: "none",
              padding: 0,
              background: "transparent",
              cursor: "pointer",
              textAlign: "left",
              outline: "none",
              WebkitTapHighlightColor: "transparent",
              userSelect: "none",
            }}
          >
            <div style={{ color: "#fdfeff", fontWeight: 800, fontSize: 18 }}>Valor do Pedido:</div>
            <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ color: "#ffffff", fontWeight: 900, fontSize: 34 }}>R$</span>
              <span style={{ color: "#ffffff", fontWeight: 900, fontSize: 34, lineHeight: 1 }}>{valorPedido}</span>
            </div>
          </button>
        ) : (
          <div>
            <div style={{ color: "#fdfeff", fontWeight: 800, fontSize: 18 }}>Valor do Pedido:</div>

            <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ color: "#ffffff", fontWeight: 900, fontSize: 34 }}>R$</span>

              <input
                ref={inputRef}
                value={valorPedido}
                placeholder="0,00"
                onChange={(e) => onValorChange(e.target.value)}
                onBlur={stopEditValor}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Escape") stopEditValor();
                }}
                inputMode="numeric"
                style={{
                  width: 180,
                  height: 44,
                  border: "none",
                  outline: "none",
                  background: "rgba(255,255,255,0.10)",
                  color: "#fff",
                  borderRadius: 12,
                  padding: "0 12px",
                  fontSize: 34,
                  fontWeight: 900,
                  textAlign: "left",
                }}
              />
            </div>
          </div>
        )}

        {forma === "dinheiro" && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", alignItems: "center", gap: 10 }}>
              <div style={{ color: "#e9fbff", fontWeight: 800, fontSize: 22 }}>Troco para:</div>

              <div
                style={{
                  background: "rgba(0,0,0,0.22)",
                  borderRadius: 12,
                  padding: "10px 12px",
                  display: "grid",
                  gridTemplateColumns: "46px 92px",
                  justifyContent: "end",
                  alignItems: "center",
                  gap: 0,
                  width: "fit-content",
                  marginLeft: "auto",
                }}
              >
                <div style={{ color: "#fff", fontWeight: 900, fontSize: 18 }}>R$</div>

                <input
                  ref={trocoRef}
                  value={trocoPara}
                  placeholder="0,00"
                  onChange={(e) => onTrocoChange(e.target.value)}
                  inputMode="numeric"
                  style={{
                    width: 92,
                    maxWidth: 92,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    color: "#fff",
                    fontWeight: 900,
                    fontSize: 22,
                    textAlign: "right",
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: 8, color: "#dffbff", fontWeight: 900, fontSize: 22 }}>
              Troco: <span style={{ color: "#0ed43f" }}>R$ {trocoFmt}</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
        <button
          type="button"
          onClick={salvar}
          disabled={loading}
          onMouseEnter={() => setHoverSalvar(true)}
          onMouseLeave={() => setHoverSalvar(false)}
          onPointerDown={(e) => !loading && (e.currentTarget.style.transform = "scale(0.97)")}
          onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onPointerCancel={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseDown={(e) => e.preventDefault()}
          style={{
            ...actionFieldStyle(hoverSalvar, "green"),
            opacity: loading ? 0.65 : 1,
            cursor: loading ? "wait" : "pointer",
          }}
        >
          <Save size={22} />
          {loading ? "SALVANDO..." : "SALVAR"}
        </button>

        <button
          type="button"
          onClick={cancelar}
          onMouseEnter={() => setHoverCancelar(true)}
          onMouseLeave={() => setHoverCancelar(false)}
          onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
          onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onPointerCancel={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseDown={(e) => e.preventDefault()}
          style={actionFieldStyle(hoverCancelar, "red")}
        >
          <X size={22} />
          CANCELAR
        </button>
      </div>
    </div>
  );
}
