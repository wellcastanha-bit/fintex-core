"use client";

import React, { useMemo } from "react";
import Sidebar from "./sidebar";
import Topbar from "./topbar";
import { EmpresaProvider } from "@/lib/empresa-context";

export default function Shell({
  children,
  nomeEmpresa,
  isHolding = false,
  contentPadding = 40,
}: {
  children: React.ReactNode;
  nomeEmpresa?: string;
  isHolding?: boolean;
  contentPadding?: number;
}) {
  const empresaCtx = useMemo(() => ({
    nome: nomeEmpresa ?? "",
    isHolding,
    isFatias: (nomeEmpresa ?? "").toLowerCase().includes("fatia"),
  }), [nomeEmpresa, isHolding]);
  const TOPBAR_H = 76;

  return (
    <EmpresaProvider value={empresaCtx}>
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -120,
          left: "50%",
          transform: "translateX(-50%)",
          width: 900,
          height: 600,
          borderRadius: "50%",
          background: "rgba(79,220,255,0.09)",
          filter: "blur(110px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ height: TOPBAR_H, flex: "0 0 auto", position: "relative", zIndex: 10 }}>
        <Topbar nomeEmpresa={nomeEmpresa} isHolding={isHolding} />
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden", position: "relative", zIndex: 1 }}>
        <div style={{ flex: "0 0 auto" }}>
          <Sidebar isHolding={isHolding} />
        </div>

        <main
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            overflow: "auto",
            background: "transparent",
            padding: contentPadding,
            boxSizing: "border-box",
          }}
        >
          {children}
        </main>
      </div>
    </div>
    </EmpresaProvider>
  );
}
