"use client";

import { SectionCard, Field, FieldLabel } from "./ui";
import { useState, useEffect } from "react";

type EmpresaPerfil = {
  nome: string | null;
  cnpj: string | null;
  telefone: string | null;
  endereco: string | null;
};

export default function Empresa() {
  const [perfil, setPerfil] = useState<EmpresaPerfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/empresa/perfil")
      .then((r) => r.json())
      .then((res) => {
        if (!res.ok) throw new Error(res.error ?? "Erro");
        setPerfil(res.data);
      })
      .catch(() => setErro("Não foi possível carregar os dados da empresa."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SectionCard title="Empresa / Loja">
        <div
          style={{
            color: "rgba(234,240,255,0.45)",
            fontWeight: 700,
            fontSize: 14,
            padding: "12px 0",
          }}
        >
          Carregando...
        </div>
      </SectionCard>
    );
  }

  if (erro) {
    return (
      <SectionCard title="Empresa / Loja">
        <div
          style={{
            color: "rgba(255,100,100,0.9)",
            fontWeight: 700,
            fontSize: 14,
            padding: "12px 0",
          }}
        >
          {erro}
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Empresa / Loja">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <FieldLabel>Nome da Empresa</FieldLabel>
          <Field
            placeholder="Não informado"
            value={perfil?.nome ?? ""}
            onChange={() => {}}
            disabled
          />
        </div>

        <div>
          <FieldLabel>CNPJ</FieldLabel>
          <Field
            placeholder="Não informado"
            value={perfil?.cnpj ?? ""}
            onChange={() => {}}
            disabled
          />
        </div>

        <div>
          <FieldLabel>Telefone</FieldLabel>
          <Field
            placeholder="Não informado"
            value={perfil?.telefone ?? ""}
            onChange={() => {}}
            disabled
          />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <FieldLabel>Endereço</FieldLabel>
          <Field
            placeholder="Não informado"
            value={perfil?.endereco ?? ""}
            onChange={() => {}}
            disabled
          />
        </div>
      </div>
    </SectionCard>
  );
}
