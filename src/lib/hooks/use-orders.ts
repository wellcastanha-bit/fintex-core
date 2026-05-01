"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { subscribeOrders } from "@/lib/realtime";
import { useEmpresaId } from "@/lib/hooks/use-empresa-id";
import type { OrdersSourceItem } from "@/lib/types/orders";

export function useOrders() {
  const [orders, setOrders] = useState<OrdersSourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const busyRef = useRef(false);

  const empresaId = useEmpresaId();

  const reload = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const r = await fetch("/api/pedidos", { cache: "no-store" });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.ok) {
        setOrders(j.rows ?? []);
        setError(false);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!empresaId) return;
    return subscribeOrders(empresaId, reload);
  }, [empresaId, reload]);

  const prependOrder = useCallback((order: OrdersSourceItem) => {
    setOrders((prev) => [order, ...prev]);
  }, []);

  return { orders, loading, error, reload, prependOrder };
}
