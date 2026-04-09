"use client";

import { createClient } from "@/lib/supabase/client";

function subscribeTable(table: string, empresaId: string, onChange: () => void): () => void {
  const supabase = createClient();
  const channel = supabase
    .channel(`${table}:${empresaId}:${Math.random().toString(36).slice(2, 8)}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table, filter: `empresa_id=eq.${empresaId}` },
      onChange
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export function subscribeOrders(empresaId: string, onChange: () => void): () => void {
  return subscribeTable("orders", empresaId, onChange);
}

export function subscribeReservations(empresaId: string, onChange: () => void): () => void {
  return subscribeTable("reservations", empresaId, onChange);
}

export function subscribeCash(empresaId: string, onChange: () => void): () => void {
  const u1 = subscribeTable("cash_entries", empresaId, onChange);
  const u2 = subscribeTable("cash_sessions", empresaId, onChange);
  return () => {
    u1();
    u2();
  };
}
