"use client";

import Link from "next/link";
import { ChevronRight, FileBarChart2 } from "lucide-react";
import { useState } from "react";

const MESES_LISTA = [
  { label: "Abril", ano: 2026, slug: "2026-04" },
  { label: "Março", ano: 2026, slug: "2026-03" },
  { label: "Fevereiro", ano: 2026, slug: "2026-02" },
  { label: "Janeiro", ano: 2026, slug: "2026-01" },
];

export default function RelatoriosMensaisPage() {
  return (
    <div style={{ maxWidth: 620, position: "relative" }}>
      {/* Header glass panel */}
      <div
        style={{
          marginBottom: 36,
          padding: "28px 32px",
          borderRadius: 28,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 60%, rgba(45,207,190,0.04) 100%)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.11)",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.12)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Specular line */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: "8%",
            right: "8%",
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.45) 50%, transparent)",
            pointerEvents: "none",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
          {/* Icon badge */}
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(135deg, rgba(45,207,190,0.28) 0%, rgba(45,207,190,0.08) 100%)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(45,207,190,0.38)",
              boxShadow:
                "0 0 24px rgba(45,207,190,0.18), inset 0 1px 0 rgba(255,255,255,0.22)",
              flexShrink: 0,
            }}
          >
            <FileBarChart2 size={22} color="#2DCFBE" />
          </div>

          <div>
            <h1
              style={{
                color: "#fff",
                fontSize: 27,
                fontWeight: 800,
                margin: 0,
                letterSpacing: -0.8,
                textShadow: "0 0 30px rgba(45,207,190,0.25)",
              }}
            >
              Relatórios Mensais
            </h1>
            <p
              style={{
                color: "rgba(255,255,255,0.38)",
                fontSize: 13,
                margin: "4px 0 0",
                letterSpacing: 0.1,
              }}
            >
              Demonstrativos de resultados por período
            </p>
          </div>
        </div>
      </div>

      {/* Month cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {MESES_LISTA.map((mes, i) => (
          <MonthCard key={mes.slug} {...mes} index={i} />
        ))}
      </div>
    </div>
  );
}

function MonthCard({
  label,
  ano,
  slug,
  index,
}: {
  label: string;
  ano: number;
  slug: string;
  index: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/relatorios-mensais/${slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "22px 26px",
        borderRadius: 24,
        textDecoration: "none",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease, background 0.25s ease, border-color 0.25s ease",

        background: hovered
          ? "linear-gradient(135deg, rgba(255,255,255,0.13) 0%, rgba(45,207,190,0.07) 55%, rgba(45,207,190,0.10) 100%)"
          : "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.025) 55%, rgba(45,207,190,0.04) 100%)",
        backdropFilter: "blur(32px) saturate(200%)",
        WebkitBackdropFilter: "blur(32px) saturate(200%)",
        border: hovered
          ? "1px solid rgba(45,207,190,0.28)"
          : "1px solid rgba(255,255,255,0.09)",
        boxShadow: hovered
          ? "0 20px 56px rgba(0,0,0,0.38), 0 0 44px rgba(45,207,190,0.10), inset 0 1px 0 rgba(255,255,255,0.20), inset 0 -1px 0 rgba(0,0,0,0.14)"
          : "0 6px 24px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.10)",
        transform: hovered ? "translateY(-3px) scale(1.012)" : "translateY(0) scale(1)",
      }}
    >
      {/* Top specular highlight */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: "6%",
          right: "6%",
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.38) 50%, transparent)",
          opacity: hovered ? 1 : 0.55,
          transition: "opacity 0.3s ease",
          pointerEvents: "none",
        }}
      />

      {/* Bottom edge shadow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: 0,
          left: "10%",
          right: "10%",
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(0,0,0,0.35) 50%, transparent)",
          pointerEvents: "none",
        }}
      />

      {/* Left: badge + text */}
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        {/* Number badge */}
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 15,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            background: hovered
              ? "linear-gradient(135deg, rgba(45,207,190,0.26) 0%, rgba(45,207,190,0.10) 100%)"
              : "linear-gradient(135deg, rgba(45,207,190,0.12) 0%, rgba(45,207,190,0.04) 100%)",
            border: hovered
              ? "1px solid rgba(45,207,190,0.42)"
              : "1px solid rgba(45,207,190,0.16)",
            boxShadow: hovered
              ? "0 0 18px rgba(45,207,190,0.18), inset 0 1px 0 rgba(255,255,255,0.18)"
              : "inset 0 1px 0 rgba(255,255,255,0.08)",
            transition: "all 0.3s ease",
            fontSize: 14,
            fontWeight: 800,
            color: hovered ? "#2DCFBE" : "rgba(45,207,190,0.6)",
            letterSpacing: 0,
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </div>

        <div>
          <div
            style={{
              color: hovered ? "#fff" : "rgba(255,255,255,0.88)",
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: -0.3,
              marginBottom: 4,
              transition: "color 0.2s ease",
            }}
          >
            {label}
          </div>
          <div
            style={{
              color: hovered ? "rgba(45,207,190,0.85)" : "rgba(45,207,190,0.5)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              transition: "color 0.2s ease",
            }}
          >
            {ano}
          </div>
        </div>
      </div>

      {/* Right: CTA glass pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 16px",
          borderRadius: 100,
          background: hovered
            ? "linear-gradient(135deg, rgba(45,207,190,0.22) 0%, rgba(45,207,190,0.10) 100%)"
            : "rgba(255,255,255,0.05)",
          border: hovered
            ? "1px solid rgba(45,207,190,0.38)"
            : "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: hovered
            ? "0 0 22px rgba(45,207,190,0.12), inset 0 1px 0 rgba(255,255,255,0.18)"
            : "inset 0 1px 0 rgba(255,255,255,0.06)",
          transition: "all 0.3s ease",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            color: hovered ? "#2DCFBE" : "rgba(255,255,255,0.30)",
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: "nowrap",
            transition: "color 0.2s ease",
          }}
        >
          Ver relatório
        </span>
        <ChevronRight
          size={14}
          color={hovered ? "#2DCFBE" : "rgba(255,255,255,0.30)"}
          style={{
            transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
            transform: hovered ? "translateX(3px)" : "translateX(0)",
          }}
        />
      </div>
    </Link>
  );
}
