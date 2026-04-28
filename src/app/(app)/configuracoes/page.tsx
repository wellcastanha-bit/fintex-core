"use client";

import { useState, useEffect } from "react";
import { useLoadingStore } from "@/lib/loading-store";

import MenuConfig from "./components/menu";
import Empresa from "./components/empresa";
import FormasPagamento from "./components/formasdepagamento";
import Plataformas from "./components/plataformas";
import Atendimentos from "./components/atendimentos";
import TaxasEntrega from "./components/taxasentrega";
import Impressora from "./components/impressora";
import Integracoes from "./components/integracoes";
import UsuariosPermissoes from "./components/usuariospermissoes";

export type SectionKey =
  | "empresa"
  | "pagamentos"
  | "plataformas"
  | "atendimentos"
  | "taxas"
  | "impressora"
  | "integracoes"
  | "usuarios";

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

export type Configuracoes = {
  config: { nome_exibicao: string; margem_padrao: number; ativo: boolean } | null;
  plataformas: ConfigItem[];
  pagamentos: ConfigItem[];
  atendimentos: ConfigItem[];
  bairros: BairroItem[];
};

export default function ConfiguracoesPage() {
  const [active, setActive] = useState<SectionKey>("empresa");
  const [configuracoes, setConfiguracoes] = useState<Configuracoes | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const { startLoading, stopLoading } = useLoadingStore();

  useEffect(() => {
    startLoading();
    fetch("/api/configuracoes")
      .then((r) => r.json())
      .then((res) => {
        if (!res.ok) throw new Error(res.error ?? "Erro ao carregar configurações");
        setConfiguracoes(res.data);
      })
      .catch((e: Error) => setErro(e.message))
      .finally(() => { setLoading(false); stopLoading(); });
  }, [startLoading, stopLoading]);

  if (loading) {
    return (
      <div style={{ color: "rgba(234,240,255,0.45)", fontWeight: 700, fontSize: 15, padding: 32 }}>
        Carregando configurações...
      </div>
    );
  }

  if (erro) {
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
        Erro ao carregar configurações: {erro}
      </div>
    );
  }

  const data = configuracoes!;

  return (
    <>
      <div
        style={{
          fontWeight: 900,
          fontSize: 30,
          color: "#ffffff",
          marginBottom: 18,
        }}
      >
        Configurações
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "520px 1fr",
          gap: 18,
          alignItems: "start",
          minWidth: 0,
        }}
      >
        <MenuConfig active={active} onChange={setActive} />

        {active === "empresa" && <Empresa />}
        {active === "pagamentos" && <FormasPagamento pagamentos={data.pagamentos} />}
        {active === "plataformas" && <Plataformas plataformas={data.plataformas} />}
        {active === "atendimentos" && <Atendimentos atendimentos={data.atendimentos} />}
        {active === "taxas" && <TaxasEntrega bairros={data.bairros} />}
        {active === "impressora" && <Impressora />}
        {active === "integracoes" && <Integracoes />}
        {active === "usuarios" && <UsuariosPermissoes />}
      </div>
    </>
  );
}
