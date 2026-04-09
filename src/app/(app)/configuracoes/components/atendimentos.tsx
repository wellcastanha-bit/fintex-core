"use client";

import { useState } from "react";
import { SectionCard, ConfigToggleItem } from "./ui";
import type { ConfigItem } from "../page";

type ItemState = { ativo: boolean; saving: boolean };

type Props = { atendimentos: ConfigItem[] };

export default function Atendimentos({ atendimentos }: Props) {
  const [estados, setEstados] = useState<Record<string, ItemState>>(
    Object.fromEntries(atendimentos.map((a) => [a.id, { ativo: a.ativo, saving: false }]))
  );

  async function toggle(id: string) {
    const prev = estados[id];
    if (!prev || prev.saving) return;

    setEstados((s) => ({ ...s, [id]: { ativo: !prev.ativo, saving: true } }));

    try {
      const r = await fetch(`/api/configuracoes/atendimentos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !prev.ativo }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error();
      setEstados((s) => ({ ...s, [id]: { ...s[id], saving: false } }));
    } catch {
      setEstados((s) => ({ ...s, [id]: { ativo: prev.ativo, saving: false } }));
    }
  }

  if (atendimentos.length === 0) {
    return (
      <SectionCard title="Atendimentos">
        <div style={{ color: "rgba(234,240,255,0.45)", fontWeight: 700, fontSize: 14 }}>
          Nenhum tipo de atendimento cadastrado.
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Atendimentos">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {atendimentos.map((a) => {
          const estado = estados[a.id] ?? { ativo: a.ativo, saving: false };
          return (
            <ConfigToggleItem
              key={a.id}
              label={a.nome}
              ativo={estado.ativo}
              saving={estado.saving}
              onToggle={() => toggle(a.id)}
            />
          );
        })}
      </div>
    </SectionCard>
  );
}
