"use client";

export type OrderDraft = {
  customer_name: string;
  platform: string;
  service_type: string;
  payment_method: string;
  total: number;
  cash_tendered: number;
  bairros: string;
  taxa_entrega: number;
};

export type CreateOrderPayload = {
  customer_name: string;
  platform: string;
  service_type: string;
  payment_method: string;
  r_inicial: number;
  troco: number;
  bairros: string | null;
  taxa_entrega: number;
};

type DraftPartial = Partial<OrderDraft>;

const KEY = "__pdv_draft__";

function read(): DraftPartial {
  if (typeof window === "undefined") return {};
  return (window as any)[KEY] ?? {};
}

function write(next: DraftPartial) {
  (window as any)[KEY] = next;
}

export function pdvSet<K extends keyof OrderDraft>(key: K, value: OrderDraft[K]) {
  const curr = read();
  write({ ...curr, [key]: value });
}

export function pdvGet(): DraftPartial {
  return read();
}

export function pdvClear() {
  write({});
  window.dispatchEvent(new Event("pdv:reset"));
}

const PAYMENT_METHOD_MAP: Record<string, string> = {
  pix:          "PIX",
  dinheiro:     "DINHEIRO",
  credito:      "CARTÃO DE CRÉDITO",
  debito:       "CARTÃO DE DÉBITO",
  online_ifood: "PAGAMENTO ONLINE",
};

export function draftToPayload(draft: DraftPartial): CreateOrderPayload {
  const total = draft.total ?? 0;
  const cash = draft.cash_tendered ?? 0;
  const codigo = draft.payment_method ?? "";
  const paymentMethod = PAYMENT_METHOD_MAP[codigo] ?? codigo;
  const isDinheiro = codigo === "dinheiro" && cash > 0;

  return {
    customer_name: draft.customer_name?.trim() ?? "",
    platform: draft.platform?.trim() ?? "",
    service_type: draft.service_type ?? "",
    payment_method: paymentMethod,
    r_inicial: isDinheiro ? cash : total,
    troco: isDinheiro ? Math.max(0, cash - total) : 0,
    bairros: draft.bairros?.trim() || null,
    taxa_entrega: draft.taxa_entrega ?? 0,
  };
}
