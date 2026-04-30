"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import { subscribeReservations } from "@/lib/realtime";
import { useLoadingStore } from "@/lib/loading-store";

const AQUA_LINE = "rgba(45,207,190,0.18)";
const BG_CARD = "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))";

type LocacaoStatus = "Pago" | "Pendente";

type Reserva = {
  id: string;
  empresa_id: string;
  date: string;
  startTime: string;
  endTime?: string | null;
  people?: number | null;
  customerName: string;
  phone?: string | null;
  notes?: string | null;
  table?: string | null;
  location?: string | null;
  value: number;
  isPaid: boolean;
  createdAt: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function isoToBR(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
function monthTitlePT(date: Date) {
  const months = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}
function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function parseMoney(v: string) {
  const s = String(v ?? "").trim().replace(/[^\d,.\-]/g, "");
  const n = Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s);
  return Number.isFinite(n) ? n : 0;
}
function toIntOrNull(v: string) {
  const n = Number(v);
  return Number.isFinite(n) && v.trim() !== "" ? Math.trunc(n) : null;
}

const TIME_OPTIONS: string[] = [];
for (let t = 600; t <= 1440; t += 30) {
  const h = Math.floor(t / 60) % 24;
  TIME_OPTIONS.push(`${pad2(h)}:${pad2(t % 60)}`);
}

function CardShell({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        borderRadius: 20,
        padding: 14,
        background: BG_CARD,
        border: `1px solid ${AQUA_LINE}`,
        boxShadow: "0 0 0 1px rgba(45,207,190,0.05) inset, 0 22px 60px rgba(0,0,0,0.40)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 15, fontWeight: 1000, letterSpacing: 0.2, color: "rgba(45,207,190,0.95)" }}>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 1000, letterSpacing: 0.2, color: "#ffffff" }}>
      {children}
    </div>
  );
}

function FieldShell({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        marginTop: 8,
        borderRadius: 16,
        padding: 12,
        background: "rgba(2,11,24,0.45)",
        border: "1px solid rgba(45,207,190,0.12)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function InputField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        border: "none",
        outline: "none",
        background: "transparent",
        color: "rgba(255,255,255,0.92)",
        fontWeight: 850,
        padding: 0,
      }}
    />
  );
}

function SelectField({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        border: "none",
        outline: "none",
        background: "transparent",
        color: "rgba(255,255,255,0.92)",
        fontWeight: 900,
        padding: 0,
        appearance: "none",
        WebkitAppearance: "none",
      }}
    >
      {children}
    </select>
  );
}

function AquaBtn({
  children, onClick, variant = "solid", style, disabled, type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "solid" | "ghost";
  style?: React.CSSProperties;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const solid = variant === "solid";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 14,
        border: solid ? "1px solid rgba(45,207,190,0.26)" : "1px solid rgba(45,207,190,0.14)",
        background: solid ? "rgba(45,207,190,0.12)" : "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.92)",
        fontWeight: 1000,
        fontSize: 14,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.65 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function SmallBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 38, height: 38, borderRadius: 12,
        border: "1px solid rgba(45,207,190,0.18)",
        background: "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.92)",
        display: "grid", placeItems: "center", cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function Accordion({ title, subtitle, children, open, setOpen }: {
  title: string; subtitle?: string; children: React.ReactNode; open: boolean; setOpen: (v: boolean) => void;
}) {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [h, setH] = useState<number>(0);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const measure = () => setH(el.scrollHeight);
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, []);

  return (
    <CardShell style={{ padding: 0, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", textAlign: "left", padding: 14,
          background: "transparent", border: "none", color: "inherit",
          cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 1000, color: "rgba(45,207,190,0.95)" }}>{title}</div>
          {subtitle ? <div style={{ marginTop: 6, fontSize: 13, opacity: 0.72 }}>{subtitle}</div> : null}
        </div>
        <div
          style={{
            width: 34, height: 34, borderRadius: 12,
            border: "1px solid rgba(45,207,190,0.18)",
            background: "rgba(255,255,255,0.06)",
            display: "grid", placeItems: "center",
          }}
        >
          <div style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 220ms ease", fontWeight: 1000, opacity: 0.9 }}>▾</div>
        </div>
      </button>

      <div style={{ height: open ? h : 0, transition: "height 260ms ease", overflow: "hidden", borderTop: "1px solid rgba(45,207,190,0.10)" }}>
        <div
          ref={innerRef}
          style={{ padding: 14, opacity: open ? 1 : 0, transform: open ? "translateY(0px)" : "translateY(-6px)", transition: "opacity 220ms ease, transform 260ms ease" }}
        >
          {children}
        </div>
      </div>
    </CardShell>
  );
}

function statusColors(isPaid: boolean) {
  return isPaid
    ? { line: "rgba(80,255,160,0.35)", glow: "rgba(80,255,160,0.14)" }
    : { line: "rgba(255,200,80,0.35)", glow: "rgba(255,200,80,0.14)" };
}

const TODAY = toISODate(new Date());

export default function MobileReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { startLoading, stopLoading } = useLoadingStore();

  const [monthRef, setMonthRef] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedISO, setSelectedISO] = useState(TODAY);

  const hasByDay = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const r of reservas) map[r.date] = true;
    return map;
  }, [reservas]);

  const reservasDoDia = useMemo(
    () => reservas.filter((r) => r.date === selectedISO),
    [reservas, selectedISO]
  );

  const grid = useMemo(() => {
    const y = monthRef.getFullYear();
    const m = monthRef.getMonth();
    const start = new Date(y, m, 1).getDay();
    const total = new Date(y, m + 1, 0).getDate();
    const cells: Array<{ day: number | null; iso?: string }> = [];
    for (let i = 0; i < start; i++) cells.push({ day: null });
    for (let d = 1; d <= total; d++) cells.push({ day: d, iso: toISODate(new Date(y, m, d)) });
    while (cells.length % 7 !== 0) cells.push({ day: null });
    return cells;
  }, [monthRef]);

  const [chegada, setChegada] = useState("19:30");
  const [saida, setSaida] = useState("");
  const [pessoas, setPessoas] = useState("");
  const [mesa, setMesa] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [obs, setObs] = useState("");
  const [locacao, setLocacao] = useState("");
  const [valor, setValor] = useState("0,00");
  const [status, setStatus] = useState<LocacaoStatus>("Pago");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const hasValor = parseMoney(valor) > 0;

  const reloadRef = useRef<() => void>(() => {});

  useEffect(() => {
    let cancelled = false;
    const y = monthRef.getFullYear();
    const m = monthRef.getMonth();
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
  }, [monthRef, startLoading, stopLoading]);

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

  function limpar() {
    setChegada("19:30"); setSaida(""); setPessoas(""); setMesa("");
    setNome(""); setTelefone(""); setObs(""); setLocacao("");
    setValor("0,00"); setStatus("Pago"); setEditingId(null);
    setConfirmDeleteId(null);
  }

  function startEdit(r: Reserva) {
    setEditingId(r.id);
    setAccordionOpen(true);
    setChegada((r.startTime || "19:30").slice(0, 5));
    setSaida(r.endTime ? String(r.endTime).slice(0, 5) : "");
    setPessoas(r.people != null ? String(r.people) : "");
    setMesa(r.table ?? "");
    setNome(r.customerName ?? "");
    setTelefone(r.phone ?? "");
    setObs(r.notes ?? "");
    setLocacao(r.location ?? "");
    const vNum = Number(r.value ?? 0);
    setValor(Number.isFinite(vNum) && vNum > 0 ? String(vNum).replace(".", ",") : "0,00");
    setStatus(r.isPaid ? "Pago" : "Pendente");
    setConfirmDeleteId(null);
  }

  async function salvar() {
    if (nome.trim().length < 2 || chegada.trim().length < 4) return;
    const valNum = parseMoney(valor);
    const body = {
      date: selectedISO,
      startTime: chegada,
      endTime: saida || null,
      people: toIntOrNull(pessoas),
      table: mesa.trim() || null,
      customerName: nome.trim(),
      phone: telefone.trim() || null,
      notes: obs.trim() || null,
      location: locacao.trim() || null,
      value: valNum > 0 ? valNum : null,
      isPaid: status === "Pago",
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

    limpar();
    setAccordionOpen(false);
    reloadRef.current();
  }

  async function doDelete(id: string) {
    await fetch(`/api/reservas/${id}`, { method: "DELETE" });
    setConfirmDeleteId(null);
    limpar();
    setAccordionOpen(false);
    reloadRef.current();
  }

  const dow = ["D", "S", "T", "Q", "Q", "S", "S"];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ fontSize: 20, fontWeight: 1000, letterSpacing: 0.2 }}>Reservas</div>

      {fetchError && (
        <div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(255,80,80,0.12)", border: "1px solid rgba(255,80,80,0.35)", color: "rgba(255,140,140,0.95)", fontWeight: 700, fontSize: 14 }}>
          Erro: {fetchError}
        </div>
      )}

      <CardShell>
        <SectionTitle>Calendário</SectionTitle>

        <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 1000, letterSpacing: 0.2 }}>{monthTitlePT(monthRef)}</div>
          <div style={{ display: "flex", gap: 10 }}>
            <SmallBtn onClick={() => setMonthRef((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>◀</SmallBtn>
            <SmallBtn onClick={() => setMonthRef((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>▶</SmallBtn>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, fontSize: 13, fontWeight: 900, opacity: 0.7 }}>
          {dow.map((x, idx) => <div key={`${x}-${idx}`} style={{ textAlign: "center" }}>{x}</div>)}
        </div>

        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
          {grid.map((c, idx) => {
            const isSelected = c.iso && c.iso === selectedISO;
            const isToday = c.iso && c.iso === TODAY;
            const hasReserva = c.iso ? !!hasByDay[c.iso] : false;

            return (
              <button
                key={idx}
                disabled={!c.day}
                onClick={() => { if (c.iso) setSelectedISO(c.iso); }}
                style={{
                  height: 34, borderRadius: 12,
                  border: isSelected ? "1px solid rgba(45,207,190,0.30)" : hasReserva ? "1px solid rgba(45,207,190,0.42)" : "1px solid rgba(45,207,190,0.12)",
                  background: c.day ? isSelected ? "rgba(45,207,190,0.14)" : hasReserva ? "rgba(45,207,190,0.10)" : "rgba(255,255,255,0.05)" : "transparent",
                  color: c.day ? "rgba(255,255,255,0.92)" : "transparent",
                  fontWeight: 950, fontSize: 14,
                  cursor: c.day ? "pointer" : "default",
                  position: "relative",
                }}
              >
                {c.day || "—"}
                {isToday && !isSelected ? (
                  <span style={{ position: "absolute", left: 7, top: 7, width: 6, height: 6, borderRadius: 999, background: "rgba(45,207,190,0.9)" }} />
                ) : null}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 12, padding: 12, borderRadius: 16, background: "rgba(2,11,24,0.45)", border: "1px solid rgba(45,207,190,0.12)", fontWeight: 1000 }}>
          {isoToBR(selectedISO)}
        </div>
      </CardShell>

      <CardShell>
        <SectionTitle>Reservas do dia: {isoToBR(selectedISO)}</SectionTitle>

        {reservasDoDia.length === 0 ? (
          <div style={{ marginTop: 10, fontSize: 14, opacity: 0.75 }}>Nenhuma reserva nesse dia.</div>
        ) : (
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {reservasDoDia.map((r) => {
              const hasLocacaoValor = r.value > 0;
              const a = statusColors(r.isPaid);

              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => startEdit(r)}
                  style={{ textAlign: "left", borderRadius: 18, padding: 14, background: "rgba(2,11,24,0.42)", border: `1px solid ${a.line}`, boxShadow: `0 0 26px ${a.glow}`, color: "inherit", cursor: "pointer" }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "baseline" }}>
                    <div style={{ fontSize: 15, fontWeight: 1000 }}>{r.customerName || "—"}</div>
                    {hasLocacaoValor ? <div style={{ fontSize: 15, fontWeight: 1000, whiteSpace: "nowrap" }}>{fmtBRL(r.value)}</div> : <div />}
                  </div>

                  <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, opacity: 0.88 }}>
                    <div style={{ fontSize: 14, fontWeight: 950 }}>
                      {r.startTime || "—"}{r.endTime ? ` → ${r.endTime}` : ""}{r.table ? ` • Mesa ${r.table}` : ""}{r.people ? ` • ${r.people} pessoas` : ""}
                    </div>
                    {hasLocacaoValor ? (
                      <div style={{ padding: "6px 10px", borderRadius: 999, border: `1px solid ${a.line}`, background: "rgba(255,255,255,0.06)", fontSize: 13, fontWeight: 1000, whiteSpace: "nowrap" }}>
                        {r.isPaid ? "Pago" : "Pendente"}
                      </div>
                    ) : null}
                  </div>

                  {(r.phone || r.notes || r.location) ? (
                    <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                      {r.phone ? <div style={{ fontSize: 14 }}><span style={{ fontWeight: 1000, opacity: 0.9 }}>Telefone:</span> {r.phone}</div> : null}
                      {r.location ? <div style={{ fontSize: 14 }}><span style={{ fontWeight: 1000, opacity: 0.9 }}>Locação:</span> {r.location}</div> : null}
                      {r.notes ? <div style={{ fontSize: 14 }}><span style={{ fontWeight: 1000, opacity: 0.9 }}>Obs:</span> {r.notes}</div> : null}
                    </div>
                  ) : null}

                  <div style={{ marginTop: 10, fontSize: 13, opacity: 0.55 }}>Toque para editar</div>
                </button>
              );
            })}
          </div>
        )}
      </CardShell>

      <Accordion
        title={editingId ? "Editar reserva" : "Nova reserva"}
        subtitle={editingId ? "Alterar e salvar" : "Toque para abrir e preencher"}
        open={accordionOpen}
        setOpen={setAccordionOpen}
      >
        <form onSubmit={(e) => { e.preventDefault(); salvar(); }} style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <FieldLabel>Horário chegada</FieldLabel>
              <FieldShell>
                <SelectField value={chegada} onChange={setChegada}>
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </SelectField>
              </FieldShell>
            </div>
            <div>
              <FieldLabel>Horário saída (opcional)</FieldLabel>
              <FieldShell>
                <SelectField value={saida} onChange={setSaida}>
                  <option value="">—</option>
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </SelectField>
              </FieldShell>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <FieldLabel>Pessoas</FieldLabel>
              <FieldShell><InputField value={pessoas} onChange={setPessoas} placeholder="Qtde. Pessoas" /></FieldShell>
            </div>
            <div>
              <FieldLabel>Mesa (opcional)</FieldLabel>
              <FieldShell><InputField value={mesa} onChange={setMesa} placeholder="Ex: 04" /></FieldShell>
            </div>
          </div>

          <div>
            <FieldLabel>Nome</FieldLabel>
            <FieldShell><InputField value={nome} onChange={setNome} placeholder="Nome do cliente" /></FieldShell>
          </div>

          <div>
            <FieldLabel>Telefone (opcional)</FieldLabel>
            <FieldShell><InputField value={telefone} onChange={setTelefone} placeholder="WhatsApp / telefone" /></FieldShell>
          </div>

          <div>
            <FieldLabel>Observação (opcional)</FieldLabel>
            <FieldShell><InputField value={obs} onChange={setObs} placeholder="Ex: Deck Inferior / Salão Superior" /></FieldShell>
          </div>

          <div>
            <FieldLabel>Locação</FieldLabel>
            <FieldShell><InputField value={locacao} onChange={setLocacao} placeholder="Período Vespertino / Período Noturno" /></FieldShell>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div>
              <FieldLabel>Valor</FieldLabel>
              <FieldShell>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontWeight: 1000, opacity: 0.8 }}>R$</div>
                  <InputField value={valor} onChange={setValor} placeholder="0,00" />
                </div>
              </FieldShell>
            </div>
            <div style={{ gridColumn: "2 / span 2" }}>
              <FieldLabel>Status</FieldLabel>
              <FieldShell>
                <div style={{ display: "flex", gap: 10 }}>
                  <AquaBtn variant={status === "Pago" ? "solid" : "ghost"} onClick={() => setStatus("Pago")} style={{ flex: 1 }} disabled={!hasValor}>Pago</AquaBtn>
                  <AquaBtn variant={status === "Pendente" ? "solid" : "ghost"} onClick={() => setStatus("Pendente")} style={{ flex: 1 }} disabled={!hasValor}>Pendente</AquaBtn>
                </div>
              </FieldShell>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <AquaBtn type="submit">{editingId ? "Salvar alterações" : "Criar reserva"}</AquaBtn>
            <AquaBtn variant="ghost" onClick={() => { limpar(); setAccordionOpen(false); }}>{editingId ? "Cancelar" : "Limpar"}</AquaBtn>
          </div>

          {editingId ? (
            confirmDeleteId === editingId ? (
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 1000, opacity: 0.85, textAlign: "center" }}>
                  Excluir essa reserva?
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <AquaBtn variant="ghost" onClick={() => setConfirmDeleteId(null)}>Não</AquaBtn>
                  <AquaBtn
                    variant="ghost"
                    onClick={() => doDelete(editingId)}
                    style={{ border: "1px solid rgba(255,100,100,0.35)", color: "rgba(255,130,130,0.92)" }}
                  >
                    Sim, excluir
                  </AquaBtn>
                </div>
              </div>
            ) : (
              <AquaBtn
                variant="ghost"
                onClick={() => setConfirmDeleteId(editingId)}
                style={{ border: "1px solid rgba(255,100,100,0.25)", color: "rgba(255,130,130,0.85)" }}
              >
                Excluir reserva
              </AquaBtn>
            )
          ) : null}
        </form>
      </Accordion>
    </div>
  );
}
