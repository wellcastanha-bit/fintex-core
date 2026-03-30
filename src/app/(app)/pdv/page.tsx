"use client";

import { useCallback, useEffect, useState } from "react";

import Cliente from "./components/cliente";
import Plataforma from "./components/plataforma";
import Atendimento from "./components/atendimento";
import Local from "./components/local";
import Pagamento from "./components/pagamento";
import UltimosPedidos from "./components/ultimospedidos";

export type ConfigItem = {
  id: string;
  codigo: string;
  nome: string;
  ativo: boolean;
  ordem: number;
};

export type BairroItem = {
  id: string;
  nome: string;
  taxa_entrega: number;
  ativo: boolean;
  ordem: number;
};

type CancelModalState = {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
};

type ToastType = "success" | "error";

export default function Page() {
  const [plataformas, setPlataformas] = useState<ConfigItem[]>([]);
  const [pagamentos, setPagamentos] = useState<ConfigItem[]>([]);
  const [atendimentos, setAtendimentos] = useState<ConfigItem[]>([]);
  const [bairros, setBairros] = useState<BairroItem[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [erroConfig, setErroConfig] = useState<string | null>(null);

  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);

  useEffect(() => {
    fetch("/api/configuracoes")
      .then((r) => r.json())
      .then((res) => {
        if (!res.ok) throw new Error(res.error ?? "Erro ao carregar configurações");
        setPlataformas(res.data.plataformas ?? []);
        setPagamentos(res.data.pagamentos ?? []);
        setAtendimentos(res.data.atendimentos ?? []);
        setBairros(res.data.bairros ?? []);
      })
      .catch((e: Error) => setErroConfig(e.message))
      .finally(() => setLoadingConfig(false));
  }, []);

  const showToast = useCallback((msg: string, type: ToastType = "error") => {
    setToast({ msg, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const duration = toast.type === "success" ? 1000 : 3000;
    const t = window.setTimeout(() => setToast(null), duration);
    return () => window.clearTimeout(t);
  }, [toast]);

  const [cancelModal, setCancelModal] = useState<CancelModalState>({ open: false });

  const openCancelModal = useCallback((opts?: Partial<CancelModalState>) => {
    setCancelModal({
      open: true,
      title: opts?.title ?? "Cancelar pedido",
      message:
        opts?.message ??
        "Tem certeza que deseja cancelar? Essa ação não pode ser desfeita.",
      confirmLabel: opts?.confirmLabel ?? "Sim, cancelar",
      cancelLabel: opts?.cancelLabel ?? "Voltar",
      onConfirm: opts?.onConfirm,
    });
  }, []);

  const closeCancelModal = useCallback(() => {
    setCancelModal({ open: false });
  }, []);

  if (loadingConfig) {
    return (
      <div style={{ color: "rgba(234,240,255,0.45)", fontWeight: 700, fontSize: 15, padding: 32 }}>
        Carregando PDV...
      </div>
    );
  }

  if (erroConfig) {
    return (
      <div
        style={{
          color: "rgba(255,100,100,0.9)",
          fontWeight: 700,
          fontSize: 15,
          padding: 24,
          background: "rgba(255,80,80,0.06)",
          borderRadius: 16,
          border: "1px solid rgba(255,80,80,0.20)",
        }}
      >
        Erro ao carregar configurações do PDV: {erroConfig}
      </div>
    );
  }

  return (
    <>
      {cancelModal.open && (
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeCancelModal();
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.58)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 18,
          }}
        >
          <div
            style={{
              width: 420,
              maxWidth: "100%",
              borderRadius: 18,
              padding: 22,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(6,16,37,0.96) 100%)",
              border: "1px solid rgba(255,80,80,0.45)",
              boxShadow:
                "0 0 36px rgba(255,80,80,0.35), inset 0 1px 0 rgba(255,255,255,0.10)",
              color: "#fff",
            }}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  display: "grid",
                  placeItems: "center",
                  background:
                    "linear-gradient(180deg, rgba(255,80,80,0.22), rgba(255,80,80,0.08))",
                  border: "1px solid rgba(255,80,80,0.35)",
                  boxShadow: "0 0 18px rgba(255,80,80,0.25)",
                  flex: "0 0 auto",
                }}
              >
                ⚠️
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 0.2 }}>
                  {cancelModal.title ?? "Cancelar pedido"}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 13,
                    opacity: 0.86,
                    lineHeight: 1.35,
                  }}
                >
                  {cancelModal.message ??
                    "Tem certeza que deseja cancelar? Essa ação não pode ser desfeita."}
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 18,
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={closeCancelModal}
                style={{
                  height: 40,
                  padding: "0 14px",
                  borderRadius: 12,
                  cursor: "pointer",
                  border: "1px solid rgba(255,255,255,0.16)",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                  color: "rgba(255,255,255,0.88)",
                  fontWeight: 800,
                }}
              >
                {cancelModal.cancelLabel ?? "Voltar"}
              </button>

              <button
                type="button"
                onClick={() => {
                  try {
                    cancelModal.onConfirm?.();
                  } finally {
                    closeCancelModal();
                  }
                }}
                style={{
                  height: 40,
                  padding: "0 14px",
                  borderRadius: 12,
                  cursor: "pointer",
                  border: "1px solid rgba(255,80,80,0.55)",
                  background:
                    "linear-gradient(180deg, rgba(255,80,80,0.30), rgba(120,0,0,0.92))",
                  boxShadow: "0 0 18px rgba(255,80,80,0.35)",
                  color: "#fff",
                  fontWeight: 900,
                }}
              >
                {cancelModal.confirmLabel ?? "Sim, cancelar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          style={{
            position: "fixed",
            right: 24,
            bottom: 22,
            zIndex: 9998,
            maxWidth: 420,
            width: "calc(100vw - 48px)",
          }}
        >
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 14,
              background:
                toast.type === "success"
                  ? "linear-gradient(180deg, rgba(14,212,63,0.30), rgba(8,85,28,0.95))"
                  : "linear-gradient(180deg, rgba(255,80,80,0.28), rgba(120,0,0,0.88))",
              border:
                toast.type === "success"
                  ? "1px solid rgba(14,212,63,0.65)"
                  : "1px solid rgba(255,80,80,0.55)",
              boxShadow:
                toast.type === "success"
                  ? "0 0 24px rgba(14,212,63,0.55)"
                  : "0 0 24px rgba(255,80,80,0.45)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: 0.15,
              display: "flex",
              gap: 10,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 10,
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(0,0,0,0.22)",
                  border: "1px solid rgba(255,255,255,0.18)",
                }}
              >
                {toast.type === "success" ? "✅" : "⚠️"}
              </span>
              <span style={{ opacity: 0.95 }}>{toast.msg}</span>
            </div>

            <button
              type="button"
              onClick={() => setToast(null)}
              style={{
                height: 28,
                padding: "0 10px",
                borderRadius: 999,
                cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(0,0,0,0.18)",
                color: "rgba(255,255,255,0.9)",
                fontWeight: 900,
                fontSize: 12,
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          padding: 0,
          boxSizing: "border-box",
          display: "grid",
          gridTemplateColumns: "620px 1fr",
          gap: 0,
          alignItems: "start",
          minWidth: 0,
        }}
      >
        <div
          style={{
            gridColumn: "1 / -1",
            fontSize: 28,
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: 0.3,
            margin: 0,
            marginBottom: 24,
          }}
        >
          PDV{" "}
          <span style={{ opacity: 1.0, fontWeight: 800, fontSize: 24 }}>
            (Frente de Caixa)
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Cliente />
          <Plataforma plataformas={plataformas} />
          <Atendimento atendimentos={atendimentos} />
          <Local bairros={bairros} />
        </div>

        <div style={{ alignSelf: "start", minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              gap: 54,
              alignItems: "flex-start",
              flexWrap: "nowrap",
              minWidth: 0,
            }}
          >
            <div style={{ width: 340, flex: "0 0 340px" }}>
              <Pagamento
                pagamentos={pagamentos}
                showToast={showToast}
                onRequestCancel={(cancelFn) =>
                  openCancelModal({
                    title: "Cancelar pedido",
                    message: "Tem certeza que deseja cancelar? Isso vai limpar tudo.",
                    confirmLabel: "Sim, cancelar",
                    cancelLabel: "Voltar",
                    onConfirm: cancelFn,
                  })
                }
              />
            </div>

            <div style={{ flex: "1 1 auto", minWidth: 0 }}>
              <UltimosPedidos />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
