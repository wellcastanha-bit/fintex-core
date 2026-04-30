"use client";

import React, { useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { EmpresaProvider } from "@/lib/empresa-context";

export default function MobileShell({
  children,
  nomeEmpresa,
}: {
  children: React.ReactNode;
  nomeEmpresa?: string;
}) {
  const empresaCtx = useMemo(() => ({
    nome: nomeEmpresa ?? "",
    isHolding: false,
    isFatias: (nomeEmpresa ?? "").toLowerCase().includes("fatia"),
  }), [nomeEmpresa]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const TAGS = new Set(["BUTTON", "A", "SELECT"]);

    function getTarget(e: TouchEvent): HTMLElement | null {
      let el = e.target as HTMLElement | null;
      while (el) {
        if (
          TAGS.has(el.tagName) ||
          el.getAttribute("role") === "button" ||
          el.getAttribute("data-tap") === "true" ||
          (el.onclick != null && el.tagName !== "DIV") ||
          el.style?.cursor === "pointer"
        ) return el;
        el = el.parentElement;
      }
      return null;
    }

    function onStart(e: TouchEvent) {
      const el = getTarget(e);
      if (el) el.classList.add("tap-press");
    }
    function onEnd(e: TouchEvent) {
      const el = getTarget(e);
      if (el) el.classList.remove("tap-press");
    }

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    document.addEventListener("touchcancel", onEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  return (
    <EmpresaProvider value={empresaCtx}>
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        overflow: "auto",
        WebkitOverflowScrolling: "touch",
        overscrollBehaviorY: "none",
        background:
          "radial-gradient(1200px 700px at 50% -20%, rgba(45,207,190,0.15), transparent 60%)," +
          "linear-gradient(180deg, #041328 0%, #020b18 70%, #020814 100%)",
        color: "rgba(255,255,255,0.92)",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          paddingTop: "env(safe-area-inset-top)",
          paddingLeft: 20,
          paddingRight: 20,
          paddingBottom: 0,
          background: "linear-gradient(180deg, rgba(1,27,60,0.98) 0%, rgba(3,16,40,0.96) 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 2px 24px rgba(0,0,0,0.32)",
        }}
      >
        <div style={{ height: 76, display: "flex", alignItems: "center", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 16 }}>
          <Link href="/m/empresas" style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <Image
              src="/imagens/logo_foriv.png"
              alt="Fintex"
              width={140}
              height={36}
              style={{ height: "36px", width: "auto", objectFit: "contain", cursor: "pointer", display: "block" }}
              priority
            />
          </Link>

          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 2, textAlign: "right", minWidth: 0 }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "rgba(255,255,255,0.95)",
                lineHeight: 1.3,
                letterSpacing: 0.2,
                whiteSpace: "nowrap",
              }}
            >
              Sistema de gestão
            </div>
            {nomeEmpresa ? (
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.95)",
                  lineHeight: 1.3,
                  letterSpacing: 0.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {nomeEmpresa}
              </div>
            ) : null}
          </div>
        </div>
        </div>
      </div>

      <main style={{ maxWidth: 560, margin: "0 auto", padding: 16, paddingBottom: "max(40px, env(safe-area-inset-bottom))" }}>
        {children}
      </main>
    </div>
    </EmpresaProvider>
  );
}
