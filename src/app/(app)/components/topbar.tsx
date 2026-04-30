"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Topbar({ nomeEmpresa, isHolding: _isHolding }: { nomeEmpresa?: string; isHolding?: boolean }) {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dataHora = now.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const BASE = {
    color: "#fff" as const,
    fontFamily: "'BaiJamjuree', sans-serif",
    fontWeight: 800 as const,
    fontSize: 15,
    letterSpacing: 0.2,
    lineHeight: 1,
  };

  return (
    <div
      className="flex items-center justify-between w-full px-3 py-2 sm:px-6 sm:py-0"
      style={{
        height: 76,
        background: `
  linear-gradient(
    180deg,
    rgba(1,27,60,0.96) 0%,
    rgba(3,16,40,0.94) 100%
  )
`,
        borderBottom: "none",
        boxShadow: "none",
        boxSizing: "border-box",
        fontFamily: BASE.fontFamily,
      }}
    >
      {/* left side */}
      <div className="flex items-center gap-2 min-w-0 sm:gap-4 sm:min-w-[360px]">
        <Link
          href="/empresas"
          style={{ display: "flex", alignItems: "center", textDecoration: "none" }}
        >
          <Image
            src="/imagens/logo_foriv.png"
            alt="Fintex"
            width={140}
            height={33}
            className="min-w-[110px] w-[110px] sm:w-auto sm:min-w-0"
            style={{ height: 36, display: "block" }}
            priority
          />
        </Link>

        <div
          className="text-lg font-bold leading-snug whitespace-normal ml-10 sm:text-2xl sm:whitespace-nowrap sm:ml-0"
          style={{ color: BASE.color, fontFamily: BASE.fontFamily, opacity: 0.95 }}
        >
          <span className="sm:hidden">
            {nomeEmpresa ? (
              <>Sistema de gestão <br />{nomeEmpresa}</>
            ) : (
              "Sistema de gestão"
            )}
          </span>
          <span className="hidden sm:inline">
            {nomeEmpresa ? `Sistema de gestão - ${nomeEmpresa}` : "Sistema de gestão"}
          </span>
        </div>
      </div>

      {/* right side */}
      <div
        className="flex items-center gap-1.5 sm:gap-[18px] sm:min-w-[320px] sm:justify-end"
        style={{ fontFamily: BASE.fontFamily }}
      >
        {/* desktop right */}
        <div className="hidden sm:flex sm:items-center sm:gap-[18px]">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#2ecc71",
                boxShadow: "0 0 6px rgba(46,204,113,.85)",
                display: "block",
              }}
            />
            <span style={{ ...BASE, fontSize: 20, fontWeight: 700 }}>Online</span>
          </div>

          <span
            style={{
              width: 1,
              height: 18,
              background: "rgba(255,255,255,.25)",
              display: "block",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              padding: "8px 10px",
              borderRadius: 10,
              background: "rgba(255, 0, 0, 0.06)",
              border: "1px solid rgba(255, 0, 0, 0.12)",
            }}
          >
            <span style={{ ...BASE, fontSize: 20, fontWeight: 700 }}>Welton</span>
            <span style={{ ...BASE, fontSize: 20, fontWeight: 700, opacity: 0.9 }}>▾</span>
          </div>
        </div>
      </div>
    </div>
  );
}