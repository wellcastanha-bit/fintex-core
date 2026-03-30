"use client";

import { useState } from "react";
import { SectionCard, ConfigToggleItem } from "./ui";

const ITENS = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "ifood", label: "iFood" },
  { id: "aiqfome", label: "AiqFome" },
] as const;

type ItemId = (typeof ITENS)[number]["id"];

export default function Integracoes() {
  const [estados, setEstados] = useState<Record<ItemId, boolean>>({
    whatsapp: false,
    ifood: false,
    aiqfome: false,
  });

  function toggle(id: ItemId) {
    setEstados((s) => ({ ...s, [id]: !s[id] }));
  }

  return (
    <SectionCard title="Integrações">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {ITENS.map((item) => (
          <ConfigToggleItem
            key={item.id}
            label={item.label}
            ativo={estados[item.id]}
            onToggle={() => toggle(item.id)}
          />
        ))}
      </div>
    </SectionCard>
  );
}
