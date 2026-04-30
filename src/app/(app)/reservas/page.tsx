"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { MonthCalendar } from "./components/calendar";
import { ReservasDoDia } from "./components/reservas-do-dia";
import type { Reserva } from "./components/reservas-do-dia";
import { subscribeReservations } from "@/lib/realtime";
import { useLoadingStore } from "@/lib/loading-store";

const AQUA = "#2DCFBE";
const PAGE_BG = "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(6,16,37,0.94) 100%)";

type LocacaoStatus = "Pago" | "Pendente";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function isoToBR(iso: string) {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}
function brToISO(br: string) {
  const m = String(br || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "";
  const [, dd, mm, yy] = m;
  if (Number(mm) < 1 || Number(mm) > 12 || Number(dd) < 1 || Number(dd) > 31) return "";
  return `${yy}-${mm}-${dd}`;
}
function maskDateBR(value: string) {
  const d = (value || "").replace(/\D/g, "").slice(0, 8);
  let out = d.slice(0, 2);
  if (d.length > 2) out += `/${d.slice(2, 4)}`;
  if (d.length > 4) out += `/${d.slice(4, 8)}`;
  return out;
}
function fmtBRL(raw: string) {
  const v = raw.replace(/[^\d]/g, "").padStart(3, "0");
  const cents = v.slice(-2);
  const n = Number(v.slice(0, -2));
  return `${n.toLocaleString("pt-BR")},${cents}`;
}
function brlToNumber(s: string) {
  const n = Number((s ?? "0,00").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

const TIME_OPTIONS: string[] = [];
for (let t = 600; t <= 1410; t += 30) {
  TIME_OPTIONS.push(`${pad2(Math.floor(t / 60))}:${pad2(t % 60)}`);
}

function CardShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        borderRadius: 18,
        padding: 18,
        border: "1px solid rgba(45,207,190,0.32)",
        boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
        background: PAGE_BG,
      }}
    >
      <div style={{ marginBottom: 14, color: AQUA, fontWeight: 900, fontSize: 20 }}>{title}</div>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children?: React.ReactNode }) {
  return (
    <div style={{ color: "#eaf0ff", fontWeight: 800, fontSize: 13, marginBottom: 8 }}>
      {children}
    </div>
  );
}

function FieldShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        height: 54,
        borderRadius: 16,
        padding: "0 14px",
        display: "flex",
        alignItems: "center",
        border: "1px solid rgba(255,255,255,0.14)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(6,16,37,0.95))",
        boxSizing: "border-box",
      }}
    >
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  inputMode,
  align = "left",
  onBlur,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  align?: "left" | "right";
  onBlur?: () => void;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      inputMode={inputMode}
      style={{
        width: "100%",
        height: 44,
        background: "transparent",
        border: "none",
        outline: "none",
        color: "#fff",
        fontSize: 18,
        fontWeight: 900,
        textAlign: align,
      }}
    />
  );
}

function AquaButton({
  children,
  onClick,
  full = false,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  full?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        height: 54,
        width: full ? "100%" : "auto",
        borderRadius: 16,
        padding: "0 18px",
        border: "1px solid rgba(45,207,190,0.55)",
        background: "linear-gradient(0deg, rgba(45,207,190,0.58), rgba(255,255,255,0.02))",
        color: "#fff",
        fontWeight: 900,
        fontSize: 16,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  );
}

function TimeSelect({
  value,
  onChange,
  allowEmpty = false,
}: {
  value: string;
  onChange: (v: string) => void;
  allowEmpty?: boolean;
}) {
  return (
    <div style={{ width: "100%", height: 44, display: "flex", alignItems: "center" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          height: 44,
          border: "none",
          outline: "none",
          background: "transparent",
          color: "#fff",
          fontSize: 18,
          fontWeight: 900,
          appearance: "none",
          WebkitAppearance: "none",
          cursor: "pointer",
        }}
      >
        {allowEmpty && (
          <option value="" style={{ background: "#061025" }}>
            —
          </option>
        )}
        {TIME_OPTIONS.map((t) => (
          <option key={t} value={t} style={{ background: "#061025" }}>
            {t}
          </option>
        ))}
      </select>
      <div
        style={{
          marginLeft: -22,
          pointerEvents: "none",
          color: "rgba(234,240,255,0.85)",
          fontWeight: 900,
        }}
      >
        ▾
      </div>
    </div>
  );
}

const TODAY = toISODate(new Date());

export default function ReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { startLoading, stopLoading } = useLoadingStore();

  const [monthDate, setMonthDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [selectedISO, setSelectedISO] = useState(TODAY);
  const [selectedBR, setSelectedBR] = useState(isoToBR(TODAY));

  const [chegada, setChegada] = useState("19:30");
  const [saida, setSaida] = useState("");
  const [pessoas, setPessoas] = useState("");
  const [mesa, setMesa] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [observacao, setObservacao] = useState("");
  const [locacaoDesc, setLocacaoDesc] = useState("");
  const [locacaoValor, setLocacaoValor] = useState("0,00");
  const [locacaoStatus, setLocacaoStatus] = useState<LocacaoStatus>("Pago");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const reloadRef = useRef<() => void>(() => {});

  useEffect(() => {
    let cancelled = false;
    const y = monthDate.getFullYear();
    const m = monthDate.getMonth();
    const from = `${y}-${pad2(m + 1)}-01`;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const to = `${y}-${pad2(m + 1)}-${pad2(lastDay)}`;

    startLoading();
    fetch(`/api/reservas?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.ok) { setReservas(json.rows ?? []); setFetchError(null); }
        else setFetchError(json.error ?? 'Erro desconhecido');
      })
      .catch((e) => { if (!cancelled) setFetchError(String(e)); })
      .finally(() => { if (!cancelled) stopLoading(); });

    reloadRef.current = () => {
      startLoading();
      fetch(`/api/reservas?from=${from}&to=${to}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.ok) { setReservas(json.rows ?? []); setFetchError(null); }
          else setFetchError(json.error ?? 'Erro desconhecido');
        })
        .catch((e) => setFetchError(String(e)))
        .finally(() => stopLoading());
    };

    return () => {
      cancelled = true;
      stopLoading();
    };
  }, [monthDate, startLoading, stopLoading]);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    fetch("/api/empresa")
      .then((r) => r.json())
      .then((json) => {
        if (json?.ok && !json?.data?.isHolding) {
          unsub = subscribeReservations(json.data.id, () => reloadRef.current());
        }
      })
      .catch(() => {});
    return () => {
      unsub?.();
    };
  }, []);

  const hasReservaByDay = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const r of reservas) map[r.date] = true;
    return map;
  }, [reservas]);

  const listDia = useMemo(
    () =>
      [...reservas.filter((r) => r.date === selectedISO)].sort((a, b) =>
        a.startTime < b.startTime ? -1 : 1
      ),
    [reservas, selectedISO]
  );

  const monthLabel = useMemo(() => {
    const m = monthDate.toLocaleString("pt-BR", { month: "long" });
    const y = monthDate.getFullYear();
    return `${m.charAt(0).toUpperCase()}${m.slice(1)} ${y}`;
  }, [monthDate]);

  function resetForm() {
    setChegada("19:30");
    setSaida("");
    setPessoas("");
    setMesa("");
    setNome("");
    setTelefone("");
    setObservacao("");
    setLocacaoDesc("");
    setLocacaoValor("0,00");
    setLocacaoStatus("Pago");
    setEditingId(null);
  }

  function onPickDayISO(iso: string) {
    setSelectedISO(iso);
    setSelectedBR(isoToBR(iso));
    setConfirmDeleteId(null);
  }

  function onSelectedBRChange(v: string) {
    const masked = maskDateBR(v);
    setSelectedBR(masked);
    const iso = brToISO(masked);
    if (iso) {
      setSelectedISO(iso);
      setConfirmDeleteId(null);
      const [y, m] = iso.split("-").map(Number);
      if (y !== monthDate.getFullYear() || m - 1 !== monthDate.getMonth()) {
        setMonthDate(new Date(y, m - 1, 1));
      }
    }
  }

  function startEdit(r: Reserva) {
    setEditingId(r.id);
    setSelectedISO(r.date);
    setSelectedBR(isoToBR(r.date));
    setChegada(r.startTime || "19:30");
    setSaida(r.endTime || "");
    setPessoas(String(r.people ?? ""));
    setMesa(r.table || "");
    setNome(r.customerName || "");
    setTelefone(r.phone || "");
    setObservacao(r.notes || "");
    setLocacaoDesc(r.location || "");
    const val = r.value > 0 ? r.value : 0;
    setLocacaoValor(fmtBRL(String(Math.round(val * 100))));
    setLocacaoStatus(r.isPaid ? "Pago" : "Pendente");
    setConfirmDeleteId(null);
  }

  async function doDelete(id: string) {
    await fetch(`/api/reservas/${id}`, { method: "DELETE" });
    setConfirmDeleteId(null);
    if (editingId === id) resetForm();
    reloadRef.current();
  }

  async function salvar() {
    if (nome.trim().length < 2 || chegada.trim().length < 4) return;

    const locVal = brlToNumber(locacaoValor);
    const body = {
      date: selectedISO,
      startTime: chegada,
      endTime: saida || null,
      people: Math.max(1, Number(pessoas) || 1),
      table: mesa.trim() || null,
      customerName: nome.trim(),
      phone: telefone.trim() || null,
      notes: observacao.trim() || null,
      location: locacaoDesc.trim() || null,
      value: locVal > 0 ? locVal : null,
      isPaid: locacaoStatus === "Pago",
    };

    if (editingId) {
      await fetch(`/api/reservas/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    resetForm();
    reloadRef.current();
  }

  return (
    <div style={{ width: "100%", boxSizing: "border-box" }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontWeight: 900, fontSize: 34, color: "#ffffff" }}>Reservas</div>
      </div>

      {fetchError && (
        <div style={{ marginBottom: 14, padding: "12px 16px", borderRadius: 12, background: "rgba(255,80,80,0.12)", border: "1px solid rgba(255,80,80,0.35)", color: "rgba(255,140,140,0.95)", fontWeight: 700, fontSize: 13 }}>
          Erro ao carregar reservas: {fetchError}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "500px 600px", gap: 18, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 18 }}>
          <CardShell title="Calendário">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <div style={{ color: "#ffffff", fontWeight: 900, fontSize: 22 }}>{monthLabel}</div>
              <div style={{ display: "flex", gap: 10 }}>
                <AquaButton
                  onClick={() =>
                    setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
                  }
                >
                  ◀
                </AquaButton>
                <AquaButton
                  onClick={() =>
                    setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
                  }
                >
                  ▶
                </AquaButton>
              </div>
            </div>

            <MonthCalendar
              monthDate={monthDate}
              selectedISO={selectedISO}
              onSelectISO={onPickDayISO}
              hasReservaByDay={hasReservaByDay}
            />

            <div style={{ marginTop: 14 }}>
              <FieldShell>
                <Input
                  value={selectedBR}
                  onChange={onSelectedBRChange}
                  placeholder="dd/mm/aaaa"
                  inputMode="numeric"
                />
              </FieldShell>
            </div>
          </CardShell>

          <ReservasDoDia
            title={`Reservas do dia: ${isoToBR(selectedISO)}`}
            listDia={listDia}
            confirmDeleteId={confirmDeleteId}
            setConfirmDeleteId={setConfirmDeleteId}
            startEdit={startEdit}
            doDelete={doDelete}
          />
        </div>

        <CardShell title={editingId ? "Editar reserva" : "Nova reserva"}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <FieldLabel>Horário chegada</FieldLabel>
              <FieldShell>
                <TimeSelect value={chegada} onChange={setChegada} />
              </FieldShell>
            </div>

            <div>
              <FieldLabel>Horário saída (opcional)</FieldLabel>
              <FieldShell>
                <TimeSelect value={saida} onChange={setSaida} allowEmpty />
              </FieldShell>
            </div>

            <div>
              <FieldLabel>Pessoas</FieldLabel>
              <FieldShell>
                <Input
                  value={pessoas}
                  onChange={setPessoas}
                  placeholder="Quantidade de pessoas"
                  inputMode="numeric"
                />
              </FieldShell>
            </div>

            <div>
              <FieldLabel>Mesa (opcional)</FieldLabel>
              <FieldShell>
                <Input value={mesa} onChange={setMesa} placeholder="Ex: 04" />
              </FieldShell>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <FieldLabel>Nome</FieldLabel>
              <FieldShell>
                <Input value={nome} onChange={setNome} placeholder="Nome do cliente" />
              </FieldShell>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <FieldLabel>Telefone (opcional)</FieldLabel>
              <FieldShell>
                <Input
                  value={telefone}
                  onChange={setTelefone}
                  placeholder="WhatsApp / telefone"
                  inputMode="numeric"
                />
              </FieldShell>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <FieldLabel>Observação (opcional)</FieldLabel>
              <FieldShell>
                <Input
                  value={observacao}
                  onChange={setObservacao}
                  placeholder="Ex: Deck Inferior / Salão Inferior / Deck Superior"
                />
              </FieldShell>
            </div>

            <div style={{ gridColumn: "1 / -1", display: "grid", gap: 12 }}>
              <div>
                <FieldLabel>Locação</FieldLabel>
                <FieldShell>
                  <Input
                    value={locacaoDesc}
                    onChange={setLocacaoDesc}
                    placeholder="Período Vespertino / Período Noturno"
                  />
                </FieldShell>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 12,
                  alignItems: "end",
                }}
              >
                <div>
                  <FieldLabel>Valor</FieldLabel>
                  <FieldShell>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                      <div style={{ color: "#fff", fontWeight: 900 }}>R$</div>
                      <Input
                        value={locacaoValor}
                        onChange={(v) => setLocacaoValor(fmtBRL(v))}
                        placeholder="0,00"
                        inputMode="numeric"
                        align="right"
                      />
                    </div>
                  </FieldShell>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  {(["Pago", "Pendente"] as LocacaoStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setLocacaoStatus(st)}
                      style={{
                        height: 54,
                        padding: "0 16px",
                        borderRadius: 16,
                        border:
                          locacaoStatus === st
                            ? "1px solid rgba(45,207,190,0.55)"
                            : "1px solid rgba(255,255,255,0.14)",
                        background:
                          locacaoStatus === st
                            ? "rgba(45,207,190,0.14)"
                            : "rgba(255,255,255,0.06)",
                        color: "#fff",
                        fontWeight: 900,
                        cursor: "pointer",
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div
              style={{
                gridColumn: "1 / -1",
                display: "grid",
                gridTemplateColumns: "1fr 140px",
                gap: 14,
              }}
            >
              <AquaButton full onClick={salvar}>
                {editingId ? "Salvar alterações" : "Criar reserva"}
              </AquaButton>
              <AquaButton onClick={resetForm}>
                {editingId ? "Cancelar" : "Limpar"}
              </AquaButton>
            </div>
          </div>
        </CardShell>
      </div>
    </div>
  );
}
