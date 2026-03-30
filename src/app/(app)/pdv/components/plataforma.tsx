"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { pdvSet } from "../pdvstore";
import type { ConfigItem } from "../page";
import { IMAGENS_PLATAFORMAS as IMAGENS } from "../imagens";

type Props = { plataformas: ConfigItem[] };

const BTN_W = 160;
const BTN_H = 60;
const BTN_RADIUS = 12;
const GAP = 15;

export default function Plataforma({ plataformas }: Props) {
  const [selecionada, setSelecionada] = useState("");
  const [hoverCard, setHoverCard] = useState(false);
  const [hoverInner, setHoverInner] = useState(false);

  const cardGlowOn = hoverCard && !hoverInner;

  useEffect(() => {
    const onReset = () => setSelecionada("");
    window.addEventListener("pdv:reset", onReset);
    return () => window.removeEventListener("pdv:reset", onReset);
  }, []);

  const pressIn = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "scale(0.96)";
  };

  const pressOut = (e: React.PointerEvent<HTMLButtonElement>, ativo: boolean) => {
    e.currentTarget.style.transform = ativo ? "scale(0.99)" : "scale(1)";
  };

  function select(p: ConfigItem) {
    setSelecionada(p.codigo);
    pdvSet("platform", p.nome);
  }

  const ORDEM = ['whatsapp', 'delivery_much', 'balcao', 'aiqfome', 'ifood']

  const ativas = plataformas
    .filter((p) => p.ativo)
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
        padding: `16px 38px`,
        borderRadius: 16,
        position: "relative",
        boxSizing: "border-box",
        overflow: "hidden",
        background: `
          radial-gradient(900px 200px at 15% -10%, rgba(79,220,255,0.12) 0%, rgba(79,220,255,0.06) 35%, rgba(79,220,255,0.04) 60%),
          linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 25%, rgba(6,16,37,0.94) 100%)
        `,
        border: cardGlowOn ? "1px solid rgba(79,220,255,0.55)" : "1px solid rgba(79,220,255,0.42)",
        boxShadow: cardGlowOn
          ? `0 20px 55px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.08), 0 0 26px rgba(79,220,255,0.45)`
          : `0 20px 55px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.08), 0 0 22px rgba(79,220,255,0.12)`,
        transition: "border 160ms ease, box-shadow 160ms ease",
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
        Plataforma:
      </div>

      {ativas.length === 0 ? (
        <div style={{ color: "rgba(234,240,255,0.45)", fontWeight: 700, fontSize: 14, paddingBottom: 8 }}>
          Nenhuma plataforma configurada.
        </div>
      ) : (
        <div
          onMouseEnter={() => setHoverInner(true)}
          onMouseLeave={() => setHoverInner(false)}
          style={{ display: "flex", flexDirection: "column", gap: GAP, position: "relative", zIndex: 1 }}
        >
          {[ativas.slice(0, 2), ativas.slice(2)].map((grupo, gi) => (
            <div key={gi} style={{ display: "flex", gap: GAP }}>
              {grupo.map((p) => {
            const ativo = selecionada === p.codigo;
            const src = IMAGENS[p.codigo] ?? null;

            return (
              <button
                key={p.id}
                type="button"
                data-key={p.codigo}
                onClick={() => select(p)}
                onPointerDown={pressIn}
                onPointerUp={(e) => pressOut(e, ativo)}
                onPointerLeave={(e) => pressOut(e, ativo)}
                onPointerCancel={(e) => pressOut(e, ativo)}
                onMouseDown={(e) => e.preventDefault()}
                aria-pressed={ativo}
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
                  fontSize: 13,
                  cursor: "pointer",
                  borderRadius: BTN_RADIUS,
                  overflow: "hidden",
                  lineHeight: src ? 0 : 1.2,
                  userSelect: "none",
                  WebkitTapHighlightColor: "transparent",
                  boxSizing: "border-box",
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
                      borderRadius: BTN_RADIUS,
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
          ))}
        </div>
      )}
    </div>
  );
}
