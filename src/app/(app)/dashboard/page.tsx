"use client";

import { useState } from "react";
import { useEmpresa } from "@/lib/empresa-context";
import DashboardView from "./components/dashboard";
import RelatorioDetalhadoView from "./components/relatorio-detalhado";
import HeaderDashboard, { buildDashboardQS } from "./components/ui/boxes/header_dashboard";
import type { DashboardQuery } from "./components/ui/boxes/header_dashboard";
import { LayoutDashboard, ListOrdered } from "lucide-react";

type Tab = "DASHBOARD" | "RELATORIO";

function TabBtn({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 40,
        padding: "0 12px",
        borderRadius: 14,
        border: active ? "1px solid rgba(45,207,190,0.40)" : "1px solid rgba(255,255,255,0.12)",
        background: active ? "rgba(45,207,190,0.16)" : "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.92)",
        fontWeight: 950,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        boxShadow: active ? "0 0 22px rgba(45,207,190,0.12)" : "none",
        userSelect: "none",
        transition: "all .16s ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        if (!active) {
          el.style.border = "1px solid rgba(45,207,190,0.28)";
          el.style.background = "rgba(45,207,190,0.10)";
          el.style.boxShadow = "0 0 18px rgba(45,207,190,0.10)";
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        if (!active) {
          el.style.border = "1px solid rgba(255,255,255,0.12)";
          el.style.background = "rgba(255,255,255,0.06)";
          el.style.boxShadow = "none";
        }
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [input, setInput] = useState("");
  const [erro, setErro] = useState(false);

  function tentar() {
    if (input === "senhafintex") {
      onUnlock();
    } else {
      setErro(true);
      setInput("");
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(1400px 900px at 18% 18%, rgba(45,207,190,0.14) 0%, rgba(2,11,24,0) 52%), linear-gradient(180deg, #041328 0%, #031022 35%, #020b18 100%)",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          padding: "36px 32px",
          borderRadius: 24,
          background: "linear-gradient(180deg, rgba(10,25,45,0.96) 0%, rgba(5,16,33,0.98) 100%)",
          border: "1px solid rgba(45,207,190,0.18)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03) inset",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "#f8fbff",
            letterSpacing: "-0.03em",
            marginBottom: 6,
          }}
        >
          Dashboard
        </div>
        <div
          style={{
            fontSize: 13,
            color: "rgba(227,236,248,0.50)",
            marginBottom: 24,
          }}
        >
          Digite a senha para continuar.
        </div>

        <input
          type="password"
          value={input}
          autoFocus
          onChange={(e) => { setInput(e.target.value); setErro(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") tentar(); }}
          placeholder="Senha"
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 14,
            border: erro
              ? "1px solid rgba(255,100,100,0.50)"
              : "1px solid rgba(45,207,190,0.18)",
            background: "rgba(2,11,24,0.60)",
            color: "#f8fbff",
            fontSize: 15,
            fontWeight: 700,
            outline: "none",
            boxSizing: "border-box",
            marginBottom: 8,
          }}
        />

        {erro && (
          <div
            style={{
              fontSize: 12,
              color: "rgba(255,130,130,0.85)",
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            Senha incorreta.
          </div>
        )}

        <button
          type="button"
          onClick={tentar}
          style={{
            marginTop: erro ? 0 : 8,
            width: "100%",
            padding: "12px 0",
            borderRadius: 14,
            border: "1px solid rgba(45,207,190,0.30)",
            background: "rgba(45,207,190,0.12)",
            color: "#f8fbff",
            fontSize: 14,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Entrar
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [desbloqueado, setDesbloqueado] = useState(false);
  const [tab, setTab] = useState<Tab>("DASHBOARD");
  const [qs, setQs] = useState("period=hoje");
  const { nome: nomeEmpresa, isFatias } = useEmpresa();

  function handleQueryChange(q: DashboardQuery) {
    setQs(buildDashboardQS(q));
  }

  const tabToggle = (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid rgba(45,207,190,0.22)",
        background: "rgba(0,0,0,0.18)",
        boxShadow: "0 0 0 1px rgba(45,207,190,0.10) inset, 0 0 22px rgba(45,207,190,0.12)",
        padding: 10,
        display: "flex",
        gap: 10,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <TabBtn
        active={tab === "DASHBOARD"}
        label="Dashboard"
        icon={<LayoutDashboard size={16} />}
        onClick={() => setTab("DASHBOARD")}
      />
      <TabBtn
        active={tab === "RELATORIO"}
        label="Relatório Detalhado"
        icon={<ListOrdered size={16} />}
        onClick={() => setTab("RELATORIO")}
      />
    </div>
  );

  if (!desbloqueado) {
    return <LockScreen onUnlock={() => setDesbloqueado(true)} />;
  }

  return (
    <div style={{ width: "100%" }}>
      <HeaderDashboard
        title="Dashboard"
        subtitle={nomeEmpresa}
        initialPreset="hoje"
        onQueryChange={handleQueryChange}
        rightSlot={tabToggle}
      />
      <div>
        {tab === "DASHBOARD" ? <DashboardView qs={qs} isFatias={isFatias} /> : <RelatorioDetalhadoView />}
      </div>
    </div>
  );
}
