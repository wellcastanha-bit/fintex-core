"use client";

import React, { useMemo, useRef, useState } from "react";

import { COLS, type Row, type ColDef } from "./pedidos.constant";

const FATIAS_COL: ColDef = { key: "FATIAS", label: "FATIAS", w: 110, type: "number" };

function getEffectiveCols(isFatias: boolean): readonly ColDef[] {
  if (!isFatias) return COLS;
  const cols = [...COLS];
  const idx = cols.findIndex((c) => c.key === "CLIENTE");
  cols.splice(idx + 1, 0, FATIAS_COL);
  return cols;
}
import { ensureAllCols, matchLoose, matchMotoboy, matchPlataforma, normKey, parseBRLToNumber } from "./pedidos.utils";

import PedidosHeader from "./pedidosheader";
import PedidosTable from "./pedidostable";
import PedidosConfirmDeleteModal from "./pedidosconfirmdeletemodal";

import type { OrdersSourceItem } from "@/lib/types/orders";
export type { OrdersSourceItem } from "@/lib/types/orders";

export type PatchPayload = {
  id: string;
  responsavel?: string | null;
  status?: string | null;
  fatias?: number | null;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function dayFromISO(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
}

function hourFromISO(iso: string) {
  const d = new Date(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function nicePayLabel(p: string) {
  const up = (p ?? "").toString().trim().toUpperCase();
  if (!up) return "";
  if (up === "DINHEIRO") return "Dinheiro";
  if (up === "DEBITO" || up === "DÉBITO" || up === "CARTÃO DE DÉBITO") return "Cartão de Débito";
  if (up === "CREDITO" || up === "CRÉDITO" || up === "CARTÃO DE CRÉDITO") return "Cartão de Crédito";
  if (up === "ONLINE" || up === "PAGAMENTO ONLINE") return "Pagamento Online";
  if (up === "PIX") return "PIX";
  return up;
}

function toNumSafe(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toISODateLocal(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function getOperationalWindow(opts?: { cutoffHour?: number; operationalISO?: string }) {
  const cutoffHour = typeof opts?.cutoffHour === "number" ? opts!.cutoffHour : 5;
  const start = new Date();

  if (opts?.operationalISO) {
    const [yy, mm, dd] = opts.operationalISO.split("-").map((x) => Number(x));
    start.setTime(new Date(yy, (mm || 1) - 1, dd || 1, 0, 0, 0, 0).getTime());
  } else {
    const now = new Date();
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    if (now.getHours() < cutoffHour) base.setDate(base.getDate() - 1);
    start.setTime(base.getTime());
  }

  start.setHours(cutoffHour, 0, 0, 0);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const operationalISO = toISODateLocal(start);

  return { start, end, operationalISO };
}

function isInWindow(iso: string | undefined, start: Date, end: Date) {
  if (!iso) return false;
  const t = new Date(String(iso)).getTime();
  if (!Number.isFinite(t)) return false;
  return t >= start.getTime() && t < end.getTime();
}

function mapOrderToRow(o: OrdersSourceItem, isFatias?: boolean): Row {
  const id = String(o?.id ?? "");
  const createdAt = String(o?.created_at ?? new Date().toISOString());
  const vFinal = toNumSafe(o?.valor_final ?? 0);

  const row = ensureAllCols({
    __ID: id,
    __ROWNUMBER: 0,
    [normKey("DATA")]: dayFromISO(createdAt),
    [normKey("HORA")]: hourFromISO(createdAt),
    [normKey("CLIENTE")]: String(o?.cliente_nome ?? ""),
    [normKey("PLATAFORMA")]: String(o?.plataforma ?? "").toUpperCase(),
    [normKey("ATENDIMENTO")]: String(o?.atendimento ?? "").toUpperCase(),
    [normKey("R$ INICIAL")]: toNumSafe(o?.valor_pago ?? 0),
    [normKey("TROCO")]: toNumSafe(o?.troco ?? 0),
    [normKey("R$ FINAL")]: vFinal,
    [normKey("FORMA DE PAGAMENTO")]: nicePayLabel(String(o?.pagamento ?? "")),
    [normKey("BAIRROS")]: String(o?.bairro ?? "") || "-",
    [normKey("TAXA DE ENTREGA")]: toNumSafe(o?.taxa_entrega ?? 0),
    [normKey("RESPONSÁVEL")]: o?.responsavel ? String(o.responsavel) : "-",
    [normKey("STATUS")]: o?.status ? String(o.status) : "EM PRODUÇÃO",
  });

  if (isFatias) row[normKey("FATIAS")] = o?.fatias ?? "-";

  return row;
}

type Props = {
  orders: OrdersSourceItem[];
  onRequestDelete?: (id: string) => Promise<void> | void;
  onPatch?: (payload: PatchPayload) => Promise<void>;
  highlightIdsFromParent?: string[];
  filterOperationalDay?: boolean;
  operationalISO?: string;
  cutoffHour?: number;
  isFatias?: boolean;
};

export default function PedidosClient({
  orders,
  onRequestDelete,
  onPatch,
  highlightIdsFromParent,
  filterOperationalDay = false,
  operationalISO,
  cutoffHour = 5,
  isFatias = false,
}: Props) {
  const effectiveCols = useMemo(() => getEffectiveCols(isFatias), [isFatias]);
  const [q, setQ] = useState<string>("");

  const sourceOrders = useMemo(() => {
    const list = orders || [];
    if (!filterOperationalDay) return list;
    const win = getOperationalWindow({ cutoffHour, operationalISO });
    return list.filter((o) => isInWindow(o?.created_at, win.start, win.end));
  }, [orders, filterOperationalDay, operationalISO, cutoffHour]);

  const [rowsState, setRowsState] = useState<Row[]>(() => (sourceOrders || []).map((o) => mapOrderToRow(o, isFatias)));

  React.useEffect(() => {
    setRowsState((sourceOrders || []).map((o) => mapOrderToRow(o, isFatias)));
  }, [sourceOrders, isFatias]);

  const [highlightIds, setHighlightIds] = useState<string[]>([]);
  const highlightSetRef = useRef<Set<string>>(new Set());

  React.useEffect(() => {
    if (!highlightIdsFromParent?.length) return;
    setHighlightIds(highlightIdsFromParent);
  }, [highlightIdsFromParent]);

  const [responsavelFilter, setResponsavelFilter] = useState<string>("");
  const [plataformaFilter, setPlataformaFilter] = useState<string>("");
  const [atendimentoFilter, setAtendimentoFilter] = useState<string>("");
  const [pagamentoFilter, setPagamentoFilter] = useState<string>("");

  const [fechamentoOpen, setFechamentoOpen] = useState<boolean>(false);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [confirmId, setConfirmId] = useState<string>("");
  const [confirmBusy, setConfirmBusy] = useState<boolean>(false);

  const minWidth = useMemo(() => effectiveCols.reduce((a: number, c: ColDef) => a + c.w, 0), [effectiveCols]);

  const lastSentRef = useRef<Map<string, { responsavel: string; status: string; fatias: string }>>(new Map());

  function schedulePatchForDiff(prevRows: Row[], nextRows: Row[]) {
    const prevById = new Map<string, Row>();
    for (const r of prevRows) {
      const id = String(r?.__ID ?? "");
      if (id) prevById.set(id, r);
    }

    for (const nr of nextRows) {
      const id = String(nr?.__ID ?? "");
      if (!id) continue;

      const pr = prevById.get(id);
      if (!pr) continue;

      const prResp = String(pr?.[normKey("RESPONSÁVEL")] ?? "");
      const prStatus = String(pr?.[normKey("STATUS")] ?? "");
      const prFatias = String(pr?.[normKey("FATIAS")] ?? "");
      const nrResp = String(nr?.[normKey("RESPONSÁVEL")] ?? "");
      const nrStatus = String(nr?.[normKey("STATUS")] ?? "");
      const nrFatias = String(nr?.[normKey("FATIAS")] ?? "");

      if (prResp === nrResp && prStatus === nrStatus && prFatias === nrFatias) continue;

      const last = lastSentRef.current.get(id);
      if (last && last.responsavel === nrResp && last.status === nrStatus && last.fatias === nrFatias) continue;

      lastSentRef.current.set(id, { responsavel: nrResp, status: nrStatus, fatias: nrFatias });

      const fatiasNum = nrFatias !== "" && nrFatias !== "-" ? Number(nrFatias) : null;

      (async () => {
        try {
          await onPatch?.({ id, responsavel: nrResp || null, status: nrStatus || null, fatias: fatiasNum });
        } catch {
          // silent
        }
      })();
    }
  }

  const setRowsWithSync: React.Dispatch<React.SetStateAction<Row[]>> = (updater) => {
    setRowsState((prev) => {
      const next = typeof updater === "function" ? (updater as any)(prev) : updater;
      try {
        schedulePatchForDiff(prev, next);
      } catch {
        // silent
      }
      return next;
    });
  };

  const base = useMemo(() => {
    let rws = rowsState;
    if (responsavelFilter) rws = rws.filter((r: Row) => matchMotoboy(r?.[normKey("RESPONSÁVEL")], responsavelFilter));
    if (plataformaFilter) rws = rws.filter((r: Row) => matchPlataforma(r?.[normKey("PLATAFORMA")], plataformaFilter));
    if (atendimentoFilter) rws = rws.filter((r: Row) => matchLoose(r?.[normKey("ATENDIMENTO")], atendimentoFilter));
    if (pagamentoFilter) rws = rws.filter((r: Row) => matchLoose(r?.[normKey("FORMA DE PAGAMENTO")], pagamentoFilter));
    return rws;
  }, [rowsState, responsavelFilter, plataformaFilter, atendimentoFilter, pagamentoFilter]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return base;
    return base.filter((r: Row) =>
      effectiveCols.some((c: ColDef) => {
        if (c.type === "action") return false;
        return (r?.[normKey(c.key)] ?? "").toString().toLowerCase().includes(term);
      })
    );
  }, [q, base]);

  const autosomasMotoboy = useMemo(() => {
    let repassePizzaria = 0;
    let qtdeEntregas = 0;
    let valorEntregas = 0;

    for (const r of base) {
      const vInicial = parseBRLToNumber(r?.[normKey("R$ INICIAL")]);
      const vTaxa = parseBRLToNumber(r?.[normKey("TAXA DE ENTREGA")]);
      const forma = (r?.[normKey("FORMA DE PAGAMENTO")] ?? "").toString().trim().toUpperCase();

      if (forma === "DINHEIRO" && typeof vInicial === "number") repassePizzaria += vInicial;
      if (typeof vTaxa === "number") valorEntregas += vTaxa;

      const atend = (r?.[normKey("ATENDIMENTO")] ?? "").toString().trim().toUpperCase();
      if (atend === "ENTREGA") qtdeEntregas += 1;
    }

    return { repassePizzaria, qtdeEntregas, valorEntregas };
  }, [base]);

  const autosomasGerais = useMemo(() => {
    let qtdePedidos = 0;
    let valorTotal = 0;

    for (const r of base) {
      qtdePedidos += 1;
      const v = parseBRLToNumber(r?.[normKey("R$ INICIAL")]);
      if (typeof v === "number") valorTotal += v;
    }

    return { qtdePedidos, valorTotal };
  }, [base]);

  const hasAnyFilter = !!(responsavelFilter || plataformaFilter || atendimentoFilter || pagamentoFilter);

  function openConfirmDelete(id: string) {
    if (!id) return;
    setConfirmId(id);
    setConfirmOpen(true);
  }

  function closeConfirm() {
    if (confirmBusy) return;
    setConfirmOpen(false);
    setConfirmId("");
  }

  async function confirmDelete() {
    if (!confirmId || confirmBusy) return;

    try {
      setConfirmBusy(true);
      await onRequestDelete?.(confirmId);
    } catch {
      // silent
    } finally {
      setConfirmBusy(false);
      closeConfirm();
    }
  }

  return (
    <div style={{ width: "100%", minWidth: 0, boxSizing: "border-box", position: "relative" }}>
      <PedidosConfirmDeleteModal open={confirmOpen} busy={confirmBusy} onClose={closeConfirm} onConfirm={confirmDelete} />

      <PedidosHeader
        q={q}
        setQ={setQ}
        fechamentoOpen={fechamentoOpen}
        setFechamentoOpen={setFechamentoOpen}
        responsavelFilter={responsavelFilter}
        setResponsavelFilter={setResponsavelFilter}
        plataformaFilter={plataformaFilter}
        setPlataformaFilter={setPlataformaFilter}
        atendimentoFilter={atendimentoFilter}
        setAtendimentoFilter={setAtendimentoFilter}
        pagamentoFilter={pagamentoFilter}
        setPagamentoFilter={setPagamentoFilter}
        autosomasMotoboy={autosomasMotoboy}
        autosomasGerais={autosomasGerais}
      />

      <PedidosTable
        filtered={filtered}
        cols={effectiveCols}
        minWidth={minWidth}
        highlightSetRef={highlightSetRef}
        setHighlightIds={setHighlightIds}
        confirmBusy={confirmBusy}
        onRequestDelete={openConfirmDelete}
        setRows={setRowsWithSync}
      />

      {!filtered.length && (
        <div style={{ padding: 14, fontWeight: 900 }}>
          {rowsState.length
            ? hasAnyFilter
              ? "Nenhum pedido bateu com esse filtro."
              : "Nada encontrado na busca."
            : "Nada para mostrar."}
        </div>
      )}
    </div>
  );
}
