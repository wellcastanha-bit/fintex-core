"use client";

import { useState } from "react";
import { SectionCard, ConfigToggleItem } from "./ui";
import type { ConfigItem } from "../page";

type ItemState = { ativo: boolean; saving: boolean };

type Props = { pagamentos: ConfigItem[] };

export default function FormasPagamento({ pagamentos }: Props) {
  const [estados, setEstados] = useState<Record<string, ItemState>>(
    Object.fromEntries(pagamentos.map((p) => [p.id, { ativo: p.ativo, saving: false }]))
  );

  async function toggle(id: string) {
    const prev = estados[id];
    if (!prev || prev.saving) return;

    setEstados((s) => ({ ...s, [id]: { ativo: !prev.ativo, saving: true } }));

    try {
      const r = await fetch(`/api/configuracoes/pagamentos/${id}`, {
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

  if (pagamentos.length === 0) {
    return (
      <SectionCard title="Formas de Pagamento">
        <div style={{ color: "rgba(234,240,255,0.45)", fontWeight: 700, fontSize: 14 }}>
          Nenhuma forma de pagamento cadastrada.
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Formas de Pagamento">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {pagamentos.map((p) => {
          const estado = estados[p.id] ?? { ativo: p.ativo, saving: false };
          return (
            <ConfigToggleItem
              key={p.id}
              label={p.nome}
              ativo={estado.ativo}
              saving={estado.saving}
              onToggle={() => toggle(p.id)}
            />
          );
        })}
      </div>
    </SectionCard>
  );
}
