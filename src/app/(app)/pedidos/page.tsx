"use client";

import PedidosClient, { type PatchPayload } from "./components/pedidosclient";
import { useOrders } from "@/lib/hooks/use-orders";
import { useEmpresa } from "@/lib/empresa-context";

export default function Page() {
  const { orders, loading, error, reload } = useOrders();
  const { isFatias } = useEmpresa();

  async function onRequestDelete(id: string) {
    if (!id) return;
    try {
      const r = await fetch(`/api/pedidos/${encodeURIComponent(id)}`, {
        method: "DELETE",
        cache: "no-store",
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) return;
      reload();
    } catch {
      // silent
    }
  }

  async function onPatch(payload: PatchPayload) {
    const { id, ...body } = payload;
    const r = await fetch(`/api/pedidos/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`PATCH ${id} falhou: ${r.status}`);
  }

  if (error) return <div style={{ padding: 14, fontWeight: 900, color: "#e74c3c" }}>Erro ao carregar pedidos.</div>;

  return (
    <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity 180ms ease" }}>
      <PedidosClient
        orders={orders}
        onRequestDelete={onRequestDelete}
        onPatch={onPatch}
        filterOperationalDay={true}
        isFatias={isFatias}
      />
    </div>
  );
}
