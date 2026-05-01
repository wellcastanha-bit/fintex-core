"use client";

import React, { useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { EmpresaProvider } from "@/lib/empresa-context";

export default function MobileShell({
  children,
  nomeEmpresa,
}: {
  children: React.ReactNode;
  nomeEmpresa?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/m";

  function handleReload() {
    router.refresh();
    window.dispatchEvent(new CustomEvent("fintex:reload"));
  }

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
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        'button, a, select, [role="button"], [data-tap="true"]'
      ) ?? null;
      if (!el) return null;
      if (el.getAttribute("data-tap") === "true") return el;
      const rect = el.getBoundingClientRect();
      if (rect.width > window.innerWidth * 0.85 || rect.height > window.innerHeight * 0.35) return null;
      return el;
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
            <Link href="/m/empresas" style={{ display: "flex", alignItems: "center" }}>
              <Image
                src="/imagens/logo_foriv.png"
                alt="Fintex"
                width={140}
                height={36}
                style={{ height: "36px", width: "auto", objectFit: "contain", cursor: "pointer", display: "block" }}
                priority
              />
            </Link>
            {!isHome && (
              <Link href="/m" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, flexShrink: 0, color: "#2DCFBE" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
              </Link>
            )}
            {!isHome && (
              <button
                onClick={handleReload}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, flexShrink: 0, color: "#2DCFBE", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6" />
                  <path d="M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </button>
            )}
          </div>

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
