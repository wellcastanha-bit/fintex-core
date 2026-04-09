"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { SectionCard, SmallBtn, ToggleSwitch } from "./ui";
import type { BairroItem } from "../page";

type ItemState = { ativo: boolean; toggleSaving: boolean };

type Props = { bairros: BairroItem[] };

const field: React.CSSProperties = {
  width: "100%",
  height: 42,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.07)",
  color: "#eaf0ff",
  outline: "none",
  padding: "0 12px",
  fontWeight: 700,
  fontSize: 14,
  boxSizing: "border-box",
};

export default function TaxasEntrega({ bairros: initial }: Props) {
  const [bairros, setBairros] = useState<BairroItem[]>(initial);
  const [estados, setEstados] = useState<Record<string, ItemState>>(
    Object.fromEntries(initial.map((b) => [b.id, { ativo: b.ativo, toggleSaving: false }]))
  );
  const [showNew, setShowNew] = useState(false);

  async function toggleAtivo(id: string) {
    const prev = estados[id];
    if (!prev || prev.toggleSaving) return;

    const next = !prev.ativo;
    setEstados((s) => ({ ...s, [id]: { ativo: next, toggleSaving: true } }));

    try {
      const r = await fetch(`/api/configuracoes/bairros/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: next }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error();
      setEstados((s) => ({ ...s, [id]: { ...s[id], toggleSaving: false } }));
    } catch {
      setEstados((s) => ({ ...s, [id]: { ativo: prev.ativo, toggleSaving: false } }));
    }
  }

  async function saveEdit(id: string, nome: string, taxa: number) {
    const r = await fetch(`/api/configuracoes/bairros/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, taxa_entrega: taxa }),
    });
    const j = await r.json();
    if (!r.ok || !j.ok) throw new Error(j.error ?? "Erro ao salvar");
    setBairros((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, nome: j.data.nome, taxa_entrega: j.data.taxa_entrega } : b
      )
    );
  }

  async function criar(nome: string, taxa: number, ativo: boolean) {
    const r = await fetch("/api/configuracoes/bairros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, taxa_entrega: taxa, ativo }),
    });
    const j = await r.json();
    if (!r.ok || !j.ok) throw new Error(j.error ?? "Erro ao criar");
    const novo: BairroItem = j.data;
    setBairros((prev) => [...prev, novo]);
    setEstados((s) => ({ ...s, [novo.id]: { ativo: novo.ativo, toggleSaving: false } }));
    setShowNew(false);
  }

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <SectionCard title="Taxas / Entrega">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {bairros.length === 0 && !showNew && (
          <div style={{ color: "rgba(234,240,255,0.45)", fontWeight: 700, fontSize: 14 }}>
            Nenhum bairro cadastrado.
          </div>
        )}

        {bairros.map((b) => {
          const estado = estados[b.id] ?? { ativo: b.ativo, toggleSaving: false };
          return (
            <BairroRow
              key={b.id}
              bairro={b}
              ativo={estado.ativo}
              toggleSaving={estado.toggleSaving}
              onToggle={() => toggleAtivo(b.id)}
              onSave={(nome, taxa) => saveEdit(b.id, nome, taxa)}
              fmt={fmt}
            />
          );
        })}

        {showNew && (
          <NovoBairroForm onSave={criar} onCancel={() => setShowNew(false)} />
        )}

        {!showNew && (
          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
            <SmallBtn onClick={() => setShowNew(true)}>+ Novo bairro</SmallBtn>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function BairroRow({
  bairro,
  ativo,
  toggleSaving,
  onToggle,
  onSave,
  fmt,
}: {
  bairro: BairroItem;
  ativo: boolean;
  toggleSaving: boolean;
  onToggle: () => void;
  onSave: (nome: string, taxa: number) => Promise<void>;
  fmt: (v: number) => string;
}) {
  const [editing, setEditing] = useState(false);
  const [editNome, setEditNome] = useState(bairro.nome);
  const [editTaxa, setEditTaxa] = useState(String(bairro.taxa_entrega));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState(false);

  function startEdit() {
    setEditNome(bairro.nome);
    setEditTaxa(String(bairro.taxa_entrega));
    setError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setError(null);
  }

  async function handleSave() {
    const nome = editNome.trim();
    const taxa = parseFloat(editTaxa.replace(",", "."));

    if (!nome) { setError("Nome obrigatório"); return; }
    if (isNaN(taxa) || taxa < 0) { setError("Taxa inválida"); return; }

    setSaving(true);
    setError(null);

    try {
      await onSave(nome, taxa);
      setEditing(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: "14px 18px",
          borderRadius: 14,
          border: "1px solid rgba(79,220,255,0.45)",
          background: "rgba(79,220,255,0.06)",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 130px", gap: 10 }}>
          <input
            value={editNome}
            onChange={(e) => setEditNome(e.target.value)}
            placeholder="Nome do bairro"
            autoFocus
            style={field}
          />
          <input
            value={editTaxa}
            onChange={(e) => setEditTaxa(e.target.value)}
            placeholder="Taxa (ex: 8.50)"
            style={field}
          />
        </div>

        {error && (
          <div style={{ fontSize: 12, color: "rgba(255,110,110,0.95)", fontWeight: 700 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <SmallBtn onClick={cancelEdit} danger>Cancelar</SmallBtn>
          <SmallBtn onClick={handleSave}>{saving ? "Salvando..." : "Salvar"}</SmallBtn>
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto auto auto",
        alignItems: "center",
        gap: 14,
        padding: "14px 18px",
        borderRadius: 14,
        border: ativo
          ? hover
            ? "1px solid rgba(79,220,255,0.55)"
            : "1px solid rgba(79,220,255,0.28)"
          : hover
          ? "1px solid rgba(255,255,255,0.20)"
          : "1px solid rgba(255,255,255,0.10)",
        background: ativo ? "rgba(79,220,255,0.06)" : "rgba(255,255,255,0.03)",
        opacity: toggleSaving ? 0.65 : 1,
        transition: "border 160ms ease, background 160ms ease",
      }}
    >
      <div
        style={{
          fontWeight: 800,
          fontSize: 15,
          color: ativo ? "#eaf0ff" : "rgba(234,240,255,0.50)",
          transition: "color 160ms ease",
        }}
      >
        {bairro.nome}
      </div>

      <div
        style={{
          fontWeight: 900,
          fontSize: 14,
          color: ativo ? "#4fdcff" : "rgba(79,220,255,0.35)",
          whiteSpace: "nowrap",
          transition: "color 160ms ease",
        }}
      >
        R$ {fmt(bairro.taxa_entrega)}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 900,
            color: toggleSaving
              ? "rgba(234,240,255,0.40)"
              : ativo
              ? "#4fdcff"
              : "rgba(234,240,255,0.30)",
            letterSpacing: 0.6,
            textTransform: "uppercase",
            minWidth: 68,
            textAlign: "right",
            transition: "color 160ms ease",
          }}
        >
          {toggleSaving ? "Salvando..." : ativo ? "Ativo" : "Desligado"}
        </div>

        <ToggleSwitch value={ativo} onChange={onToggle} disabled={toggleSaving} />
      </div>

      <button
        type="button"
        onClick={startEdit}
        title="Editar"
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          border: hover
            ? "1px solid rgba(79,220,255,0.35)"
            : "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.05)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "border 160ms ease",
        }}
      >
        <Pencil size={13} color={hover ? "#4fdcff" : "rgba(234,240,255,0.50)"} />
      </button>
    </div>
  );
}

function NovoBairroForm({
  onSave,
  onCancel,
}: {
  onSave: (nome: string, taxa: number, ativo: boolean) => Promise<void>;
  onCancel: () => void;
}) {
  const [nome, setNome] = useState("");
  const [taxa, setTaxa] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const nomeTrim = nome.trim();
    const taxaNum = parseFloat(taxa.replace(",", "."));

    if (!nomeTrim) { setError("Nome obrigatório"); return; }
    if (isNaN(taxaNum) || taxaNum < 0) { setError("Taxa inválida (ex: 8.50)"); return; }

    setSaving(true);
    setError(null);

    try {
      await onSave(nomeTrim, taxaNum, ativo);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao criar bairro");
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "14px 18px",
        borderRadius: 14,
        border: "1px solid rgba(79,220,255,0.45)",
        background: "rgba(79,220,255,0.06)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 900,
          color: "#4fdcff",
          letterSpacing: 0.7,
          textTransform: "uppercase",
        }}
      >
        Novo bairro
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 130px", gap: 10 }}>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome do bairro"
          autoFocus
          style={field}
        />
        <input
          value={taxa}
          onChange={(e) => setTaxa(e.target.value)}
          placeholder="Taxa (ex: 8.50)"
          style={field}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ToggleSwitch value={ativo} onChange={() => setAtivo((v) => !v)} />
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: ativo ? "#4fdcff" : "rgba(234,240,255,0.40)",
            letterSpacing: 0.4,
            transition: "color 160ms ease",
          }}
        >
          {ativo ? "Ativo" : "Inativo"}
        </span>
      </div>

      {error && (
        <div style={{ fontSize: 12, color: "rgba(255,110,110,0.95)", fontWeight: 700 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <SmallBtn onClick={onCancel} danger>Cancelar</SmallBtn>
        <SmallBtn onClick={handleSave}>{saving ? "Salvando..." : "Salvar bairro"}</SmallBtn>
      </div>
    </div>
  );
}
