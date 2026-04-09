"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { pdvSet } from "../pdvstore";
import type { ConfigItem } from "../page";
import { IMAGENS_ATENDIMENTOS as IMAGENS } from "../imagens";

type Props = { atendimentos: ConfigItem[] };

const BTN_W = 160;
const BTN_H = 60;

export default function Atendimento({ atendimentos }: Props) {
  const [selecionada, setSelecionada] = useState("");
  const [hoverCard, setHoverCard] = useState(false);
  const [hoverInner, setHoverInner] = useState(false);

  const cardGlowOn = hoverCard && !hoverInner;

  useEffect(() => {
    const onReset = () => setSelecionada("");
    window.addEventListener("pdv:reset", onReset);
    return () => window.removeEventListener("pdv:reset", onReset);
  }, []);

  const NOME_MAP: Record<string, string> = {
    delivery: "entrega",
  }

  function select(p: ConfigItem) {
    setSelecionada(p.codigo);
    const serviceType = NOME_MAP[p.codigo] ?? p.nome;
    pdvSet("service_type", serviceType);
    window.dispatchEvent(
      new CustomEvent("pdv:service_type", { detail: { codigo: p.codigo, nome: serviceType } })
    );
  }

  const ORDEM = ['retirada', 'delivery', 'entrega', 'mesas', 'mesa']

  const ativas = atendimentos
    .filter((a) => a.ativo)
    .sort((a, b) => {
      const ia = ORDEM.indexOf(a.codigo)
      const ib = ORDEM.indexOf(b.codigo)
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
    })

  return (
    <div
      onMouseEnter={() => setHoverCard(true)}
      onMouseLeave={() => {
        setHoverCard(false);
        setHoverInner(false);
      }}
      style={{
        width: "100%",
        maxWidth: 600,
        padding: "16px 38px",
        borderRadius: 16,
        position: "relative",
        background: `
          radial-gradient(900px 200px at 15% -10%,
            rgba(79, 220, 255, 0.12) 0%,
            rgba(79,220,255,0.06) 35%,
            rgba(79, 220, 255, 0.04) 60%
          ),
          linear-gradient(180deg,
            rgba(255,255,255,0.08) 0%,
            rgba(255,255,255,0.04) 25%,
            rgba(6,16,37,0.94) 100%
          )
        `,
        border: cardGlowOn ? "1px solid rgba(79,220,255,0.55)" : "1px solid rgba(79,220,255,0.42)",
        boxShadow: cardGlowOn
          ? `0 20px 55px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.08), 0 0 26px rgba(79,220,255,0.45)`
          : `0 20px 55px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.08), 0 0 22px rgba(79,220,255,0.12)`,
        transition: "border 160ms ease, box-shadow 160ms ease",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 16,
          pointerEvents: "none",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      />

      <div
        style={{
          color: "#4fdcff",
          fontWeight: 700,
          fontSize: 17,
          marginBottom: 12,
          position: "relative",
          zIndex: 1,
        }}
      >
        Atendimento:
      </div>

      {ativas.length === 0 ? (
        <div style={{ color: "rgba(234,240,255,0.45)", fontWeight: 700, fontSize: 14, paddingBottom: 8 }}>
          Nenhum tipo de atendimento configurado.
        </div>
      ) : (
        <div
          onMouseEnter={() => setHoverInner(true)}
          onMouseLeave={() => setHoverInner(false)}
          style={{ display: "flex", flexWrap: "wrap", gap: 15, position: "relative", zIndex: 1 }}
        >
          {ativas.map((p) => {
            const ativo = selecionada === p.codigo;
            const src = IMAGENS[p.codigo] ?? null;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => select(p)}
                onMouseDown={(e) => e.preventDefault()}
                style={{
                  width: BTN_W,
                  height: BTN_H,
                  padding: src ? 0 : "0 12px",
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
                  fontSize: 14,
                  cursor: "pointer",
                  borderRadius: 12,
                  overflow: "hidden",
                  lineHeight: src ? 0 : 1.2,
                  userSelect: "none",
                  WebkitTapHighlightColor: "transparent",
                  transform: ativo ? "scale(0.99)" : "scale(1)",
                  transition: "transform 90ms ease, filter 140ms ease",
                  filter: ativo ? "drop-shadow(0 10px 14px rgba(0,0,0,0.28))" : "none",
                }}
              >
                {src ? (
                  <Image
                    src={src}
                    alt={p.nome}
                    width={BTN_W}
                    height={BTN_H}
                    priority
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      display: "block",
                      borderRadius: 12,
                      filter: selecionada && !ativo ? "grayscale(100%) contrast(0.9) brightness(0.9)" : "none",
                      transition: "filter 140ms ease",
                    }}
                  />
                ) : (
                  <span
                    style={{
                      filter: selecionada && !ativo ? "opacity(0.45)" : "none",
                      transition: "filter 140ms ease",
                    }}
                  >
                    {p.nome}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
