"use client";

import React from "react";
import { Pencil, Trash2 } from "lucide-react";

const AQUA = "#2DCFBE";

export type Reserva = {
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

function numberToBRL(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ReservasDoDia({
  title,
  listDia,
  confirmDeleteId,
  setConfirmDeleteId,
  startEdit,
  doDelete,
}: {
  title: string;
  listDia: Reserva[];
  confirmDeleteId: string | null;
  setConfirmDeleteId: React.Dispatch<React.SetStateAction<string | null>>;
  startEdit: (r: Reserva) => void;
  doDelete: (id: string) => void;
}) {
  return (
    <div
      style={{
        borderRadius: 18,
        padding: 18,
        border: "1px solid rgba(45,207,190,0.32)",
        boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(6,16,37,0.94) 100%)",
      }}
    >
      <div style={{ marginBottom: 14, color: AQUA, fontWeight: 900, fontSize: 20 }}>{title}</div>

      {!listDia.length ? (
        <div style={{ color: "#eaf0ff", fontWeight: 800, opacity: 0.75 }}>Nenhuma reserva nesse dia.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {listDia.map((r) => {
            const hasLocVal = r.value > 0;

            return (
              <div
                key={r.id}
                style={{
                  borderRadius: 16,
                  padding: 14,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(1,27,60,0.30)",
                  display: "grid",
                  gap: 8,
                  position: "relative",
                }}
              >
                <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => startEdit(r)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.14)",
                      background: "rgba(255,255,255,0.06)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Pencil size={18} color={AQUA} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId((cur) => (cur === r.id ? null : r.id))}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.14)",
                      background: "rgba(255,255,255,0.06)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Trash2 size={18} color="rgba(255,110,110,0.95)" />
                  </button>
                </div>

                <div style={{ color: "#fff", fontWeight: 900, fontSize: 16 }}>
                  {r.customerName}{" "}
                  {r.people ? <span style={{ color: "#eaf0ff", opacity: 0.9 }}>- {r.people} Pessoas</span> : null}
                </div>

                <div style={{ color: "#eaf0ff", fontWeight: 900 }}>
                  Horário:{" "}
                  <span style={{ color: "#fff" }}>
                    {r.startTime}
                    {r.endTime ? ` - ${r.endTime}` : ""}
                  </span>
                </div>

                {!!r.phone?.trim() && (
                  <div style={{ color: "#eaf0ff", fontWeight: 900 }}>
                    Contato: <span style={{ color: "#fff" }}>{r.phone}</span>
                  </div>
                )}

                {!!r.notes?.trim() && (
                  <div style={{ color: "#eaf0ff", fontWeight: 900 }}>
                    Descrição: <span style={{ color: "#fff" }}>{r.notes}</span>
                  </div>
                )}

                {!!r.table?.trim() && (
                  <div style={{ color: "#eaf0ff", fontWeight: 900 }}>
                    Mesa: <span style={{ color: "#fff" }}>{r.table}</span>
                  </div>
                )}

                {!!(r.location || "").trim() && (
                  <div style={{ color: "#eaf0ff", fontWeight: 900 }}>
                    Locação: <span style={{ color: "#fff" }}>{r.location}</span>
                  </div>
                )}

                {hasLocVal && (
                  <div style={{ color: "#eaf0ff", fontWeight: 900, display: "flex", gap: 10, alignItems: "center" }}>
                    <span>
                      Valor da Locação:{" "}
                      <span style={{ color: "#0ed43f" }}>R$ {numberToBRL(r.value)}</span>
                    </span>
                    <span
                      style={{
                        marginLeft: "auto",
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,0.18)",
                        background: r.isPaid
                          ? "rgba(14,212,63,0.18)"
                          : "rgba(255,196,0,0.14)",
                        color: "#fff",
                        fontWeight: 900,
                        fontSize: 12,
                      }}
                    >
                      {r.isPaid ? "Pago" : "Pendente"}
                    </span>
                  </div>
                )}

                {confirmDeleteId === r.id && (
                  <div
                    style={{
                      marginTop: 10,
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.14)",
                      background: "rgba(0,0,0,0.20)",
                      padding: 12,
                      display: "grid",
                      gap: 10,
                    }}
                  >
                    <div style={{ color: "#fff", fontWeight: 900 }}>
                      Você realmente deseja excluir essa reserva?
                    </div>
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        style={{
                          height: 34,
                          padding: "0 12px",
                          borderRadius: 12,
                          border: "1px solid rgba(255,255,255,0.14)",
                          background: "rgba(255,255,255,0.06)",
                          color: "#fff",
                          fontWeight: 900,
                          cursor: "pointer",
                        }}
                      >
                        Não
                      </button>
                      <button
                        type="button"
                        onClick={() => doDelete(r.id)}
                        style={{
                          height: 34,
                          padding: "0 12px",
                          borderRadius: 12,
                          border: "1px solid rgba(225,11,11,0.55)",
                          background: "rgba(255,255,255,0.06)",
                          color: "#fff",
                          fontWeight: 900,
                          cursor: "pointer",
                        }}
                      >
                        Sim
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
