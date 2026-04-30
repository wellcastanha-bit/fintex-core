"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useLoadingStore } from "@/lib/loading-store";
import { resolveTodayBRT } from "@/lib/period";

const EntradasTab = dynamic(() => import("./entradas"), { ssr: false });
const DespesasTab = dynamic(() => import("./despesas"), { ssr: false });
const SangriasTab = dynamic(() => import("./sangria"), { ssr: false });
const ContadoresTab = dynamic(() => import("./contadores"), { ssr: false });

type TabKey = "entradas" | "despesas" | "sangrias" | "contadores";

export type PedidoCashRow = {
  id: string;
  date: string;
  time: string;
  cliente: string;
  plataforma: string;
  atendimento: string;
  pagamentoLabel: "Dinheiro" | "PIX" | "Pagamento Online" | "Cartão de Débito" | "Cartão de Crédito";
  valor: number;
};

export type ManualCashEntry = {
  id: string;
  date: string;
  time: string;
  description: string;
  amount: number;
};

export type Expense = { id: string; date: string; time: string; category: string; description: string; amount: number; payment_method?: string };
export type Withdrawal = { id: string; date: string; time: string; reason: string; authorizedBy: string; amount: number };
export type CountItem = { denomination: number; quantity: number };

export const DENOMS: number[] = [200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.25, 0.1, 0.05];

function brl(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}


function toNumberSmart(v: any) {
  if (v === null || v === undefined) return 0;
  let s = String(v).trim();
  if (!s) return 0;
  s = s.replace(/[R$\s]/g, "");
  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }
  if (s.includes(".")) {
    const m = s.match(/^\d+(\.\d{1,2})$/);
    if (m) {
      const n = Number(s);
      return Number.isFinite(n) ? n : 0;
    }
    s = s.replace(/\./g, "");
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function calcTotalCounts(list: CountItem[]) {
  return list.reduce((s, it) => s + it.denomination * it.quantity, 0);
}

function normalizeCounts(list: any): CountItem[] {
  if (!Array.isArray(list)) return DENOMS.map((d) => ({ denomination: d, quantity: 0 }));
  const m = new Map<number, number>();
  for (const it of list) {
    const denom = Number(it?.denomination);
    const qty = Number(it?.quantity);
    if (Number.isFinite(denom) && Number.isFinite(qty) && qty >= 0) m.set(denom, qty);
  }
  return DENOMS.map((d) => ({ denomination: d, quantity: m.get(d) ?? 0 }));
}

function normPaymentLabel(v: any): PedidoCashRow["pagamentoLabel"] {
  const s = String(v ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!s) return "Dinheiro";
  if (s.includes("dinheiro") || s === "cash") return "Dinheiro";
  if (s === "pix") return "PIX";
  if (s.includes("online") || s.includes("gateway")) return "Pagamento Online";
  if (s.includes("debito") || s.includes("debit")) return "Cartão de Débito";
  if (s.includes("credito") || s.includes("credit")) return "Cartão de Crédito";
  return "Dinheiro";
}

function timeFromOccurredAt(iso: string) {
  const d = new Date(String(iso || ""));
  if (!Number.isFinite(d.getTime())) return "00:00";
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function mapPedidoToCashRow(row: any): PedidoCashRow {
  const d = new Date(String(row.created_at ?? ""));
  const valid = Number.isFinite(d.getTime());
  return {
    id: String(row.id ?? ""),
    date: valid ? `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` : "-",
    time: valid ? `${pad2(d.getHours())}:${pad2(d.getMinutes())}` : "-",
    cliente: String(row.customer_name ?? "").trim(),
    plataforma: String(row.platform ?? "").trim(),
    atendimento: String(row.service_type ?? "").trim(),
    pagamentoLabel: normPaymentLabel(row.payment_method),
    valor: Number(row.r_final ?? row.r_inicial ?? 0),
  };
}

const AQUA = "rgba(45,207,190,0.45)";
const AQUA_SOFT = "rgba(45,207,190,0.22)";

function CardShell({ children, hoverOn }: { children: React.ReactNode; hoverOn: boolean }) {
  return (
    <div
      style={{
        borderRadius: 24,
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        background: `
          radial-gradient(
            900px 240px at 15% -10%,
            rgba(79, 220, 255, 0.10) 0%,
            rgba(45,207,190,0.05) 40%,
            rgba(79, 220, 255, 0.03) 65%
          ),
          linear-gradient(
            180deg,
            rgba(255,255,255,0.06) 0%,
            rgba(255,255,255,0.03) 22%,
            rgba(6,16,37,0.94) 100%
          )
        `,
        border: hoverOn ? "1px solid rgba(45,207,190,0.55)" : "1px solid rgba(45,207,190,0.40)",
        boxShadow: hoverOn
          ? `
            0 20px 55px rgba(0,0,0,0.60),
            0 1px 0 rgba(255,255,255,0.08),
            0 0 26px ${AQUA}
          `
          : `
            0 20px 55px rgba(0,0,0,0.60),
            0 1px 0 rgba(255,255,255,0.08),
            0 0 18px ${AQUA_SOFT}
          `,
        transition: "border 160ms ease, box-shadow 160ms ease",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 24,
          pointerEvents: "none",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "emerald" | "red" | "orange" | "blue" | "cyan" | "white";
}) {
  const [hover, setHover] = useState(false);

  const valClass =
    color === "emerald"
      ? "text-emerald-400"
      : color === "red"
      ? "text-red-400"
      : color === "orange"
      ? "text-orange-400"
      : color === "blue"
      ? "text-blue-400"
      : color === "cyan"
      ? "text-cyan-400"
      : "text-white";

  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <CardShell hoverOn={hover}>
        <div className="px-5 py-4">
          <div className="text-[12px] text-slate-300/70">{label}</div>
          <div className={"mt-1 text-[14px] font-semibold " + valClass}>{value}</div>
        </div>
      </CardShell>
    </div>
  );
}

function TabBar({ tab, setTab }: { tab: TabKey; setTab: (k: TabKey) => void }) {
  const base = "h-[44px] w-full rounded-full border border-white/10 bg-white/[0.04] px-2";
  const item = "h-[44px] rounded-full flex items-center justify-center gap-2 text-[18px] font-semibold transition-all";
  const inactive = "text-slate-300/70 hover:text-white";
  const activeWrap = "ring-2 ring-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.35)]";

  const getActiveClass = (k: TabKey) => {
    if (k !== tab) return item + " " + inactive;
    if (k === "entradas") return item + " bg-emerald-500 text-white " + activeWrap;
    if (k === "despesas") return item + " bg-red-500 text-white " + activeWrap;
    if (k === "sangrias") return item + " bg-orange-500 text-white " + activeWrap;
    return item + " bg-blue-500 text-white " + activeWrap;
  };

  return (
    <div className={base}>
      <div className="grid grid-cols-4 gap-2">
        <button className={getActiveClass("entradas")} onClick={() => setTab("entradas")}>
          <span className="opacity-90">↗</span> Entradas
        </button>
        <button className={getActiveClass("despesas")} onClick={() => setTab("despesas")}>
          <span className="opacity-90">$</span> Despesas
        </button>
        <button className={getActiveClass("sangrias")} onClick={() => setTab("sangrias")}>
          <span className="opacity-90">↘</span> Sangrias
        </button>
        <button className={getActiveClass("contadores")} onClick={() => setTab("contadores")}>
          <span className="opacity-90">▦</span> Contadores
        </button>
      </div>
    </div>
  );
}

export default function CaixaDiario() {
  const STAT_W = 170;
  const { startLoading, stopLoading } = useLoadingStore();

  const [tab, setTab] = useState<TabKey>("entradas");
  const [dateISO, setDateISO] = useState<string>(() => resolveTodayBRT());
  const [status, setStatus] = useState<"loading" | "ok" | "err">("loading");

  useEffect(() => {
    const t = setInterval(() => {
      const next = resolveTodayBRT();
      setDateISO((cur) => (cur === next ? cur : next));
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  const [pedidosAll, setPedidosAll] = useState<PedidoCashRow[]>([]);
  const [manualCash, setManualCash] = useState<ManualCashEntry[]>([]);
  const [manualAmount, setManualAmount] = useState("");
  const [manualDesc, setManualDesc] = useState("");

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expensePaymentMethod, setExpensePaymentMethod] = useState("");

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalReason, setWithdrawalReason] = useState("");
  const [withdrawalAuthorizedBy, setWithdrawalAuthorizedBy] = useState("");

  const [initialCounts, setInitialCounts] = useState<CountItem[]>(DENOMS.map((d) => ({ denomination: d, quantity: 0 })));
  const [finalCounts, setFinalCounts] = useState<CountItem[]>(DENOMS.map((d) => ({ denomination: d, quantity: 0 })));

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setStatus("loading");
      startLoading();
      try {
        const res = await fetch(`/api/caixa-diario?date=${encodeURIComponent(dateISO)}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!alive) return;

        const session = data.session;
        if (session?.initial_counts) setInitialCounts(normalizeCounts(session.initial_counts));
        if (session?.final_counts) setFinalCounts(normalizeCounts(session.final_counts));

        const entries: any[] = data.entries ?? [];
        const manualIn: ManualCashEntry[] = [];
        const exps: Expense[] = [];
        const withs: Withdrawal[] = [];

        for (const e of entries) {
          const time = timeFromOccurredAt(e.occurred_at);
          const amt = Number(e.amount ?? 0);

          if (e.type === "manual_in") {
            manualIn.push({ id: e.id, date: dateISO, time, description: String(e.description || "Reforço de caixa"), amount: amt });
          } else if (e.type === "expense") {
            exps.push({ id: e.id, date: dateISO, time, category: String(e.category || ""), description: String(e.description || ""), amount: amt, payment_method: e.payment_method ?? undefined });
          } else if (e.type === "withdrawal") {
            withs.push({ id: e.id, date: dateISO, time, reason: String(e.description || ""), authorizedBy: String(e.category || ""), amount: amt });
          }
        }

        setManualCash(manualIn);
        setExpenses(exps);
        setWithdrawals(withs);
        setPedidosAll((data.pedidos ?? []).map(mapPedidoToCashRow));
        setStatus("ok");
      } catch {
        if (!alive) return;
        setStatus("err");
      } finally {
        if (alive) stopLoading();
      }
    }

    load();
    return () => { alive = false; stopLoading(); };
  }, [dateISO, startLoading, stopLoading]);

  const totalsByPay = useMemo(() => {
    const base = { dinheiro: 0, pix: 0, online: 0, debito: 0, credito: 0, total: 0 };
    for (const p of pedidosAll) {
      base.total += p.valor;
      if (p.pagamentoLabel === "Dinheiro") base.dinheiro += p.valor;
      else if (p.pagamentoLabel === "PIX") base.pix += p.valor;
      else if (p.pagamentoLabel === "Pagamento Online") base.online += p.valor;
      else if (p.pagamentoLabel === "Cartão de Débito") base.debito += p.valor;
      else if (p.pagamentoLabel === "Cartão de Crédito") base.credito += p.valor;
    }
    return base;
  }, [pedidosAll]);

  const manualCashTotal = useMemo(() => manualCash.reduce((s, m) => s + (m.amount ?? 0), 0), [manualCash]);
  const cashInTotal = totalsByPay.dinheiro + manualCashTotal;

  const totalDespesas = useMemo(() => expenses.reduce((s, e) => s + (e.amount ?? 0), 0), [expenses]);
  const totalSangrias = useMemo(() => withdrawals.reduce((s, w) => s + (w.amount ?? 0), 0), [withdrawals]);

  const caixaInicial = useMemo(() => calcTotalCounts(initialCounts), [initialCounts]);
  const caixaFinal = useMemo(() => calcTotalCounts(finalCounts), [finalCounts]);

  // Only cash expenses (payment_method = 'dinheiro' or null for legacy records) reduce the cash register
  const cashDespesas = useMemo(
    () => expenses
      .filter((e) => !e.payment_method || e.payment_method === 'dinheiro')
      .reduce((s, e) => s + (e.amount ?? 0), 0),
    [expenses]
  );

  const esperado = useMemo(
    () => caixaInicial + cashInTotal - cashDespesas - totalSangrias,
    [caixaInicial, cashInTotal, cashDespesas, totalSangrias]
  );

  const diferenca = useMemo(() => esperado - caixaFinal, [esperado, caixaFinal]);
  const difIsBad = Math.abs(diferenca) > 5;

  const addManualCash = async () => {
    const desc = manualDesc.trim();
    const amt = toNumberSmart(manualAmount);
    if (!amt || amt <= 0) return;

    const now = new Date();
    const optimistic: ManualCashEntry = {
      id: `tmp_${Date.now()}`,
      date: dateISO,
      time: `${pad2(now.getHours())}:${pad2(now.getMinutes())}`,
      description: desc || "Reforço de caixa",
      amount: amt,
    };

    setManualCash((prev) => [optimistic, ...prev]);
    setManualAmount("");
    setManualDesc("");

    try {
      const res = await fetch("/api/caixa-diario/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op_date: dateISO, type: "manual_in", amount: amt, description: optimistic.description }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const e = data.entry;
      setManualCash((prev) => prev.map((m) => (m.id === optimistic.id ? { ...m, id: e.id, time: timeFromOccurredAt(e.occurred_at) } : m)));
    } catch {
      setManualCash((prev) => prev.filter((m) => m.id !== optimistic.id));
    }
  };

  const removeManual = async (id: string) => {
    setManualCash((prev) => prev.filter((m) => m.id !== id));
    if (id.startsWith("tmp_")) return;
    try {
      await fetch(`/api/caixa-diario/entries/${encodeURIComponent(id)}`, { method: "DELETE", cache: "no-store" });
    } catch {}
  };

  const removePedido = (id: string) => setPedidosAll((prev) => prev.filter((p) => p.id !== id));

  const addExpense = async () => {
    const v = toNumberSmart(expenseAmount);
    if (!expenseCategory || !expenseDescription.trim() || !v) return;

    const now = new Date();
    const optimistic: Expense = {
      id: `tmp_${Date.now()}`,
      date: dateISO,
      time: `${pad2(now.getHours())}:${pad2(now.getMinutes())}`,
      category: expenseCategory,
      description: expenseDescription,
      amount: v,
      payment_method: expensePaymentMethod || undefined,
    };

    setExpenses((prev) => [optimistic, ...prev]);
    setExpenseCategory("");
    setExpenseAmount("");
    setExpenseDescription("");
    setExpensePaymentMethod("");

    try {
      const res = await fetch("/api/caixa-diario/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op_date: dateISO, type: "expense", amount: v, category: optimistic.category, description: optimistic.description, payment_method: expensePaymentMethod || null }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const e = data.entry;
      setExpenses((prev) => prev.map((x) => (x.id === optimistic.id ? { ...x, id: e.id, time: timeFromOccurredAt(e.occurred_at) } : x)));
    } catch {
      setExpenses((prev) => prev.filter((x) => x.id !== optimistic.id));
    }
  };

  const removeExpense = async (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    if (id.startsWith("tmp_")) return;
    try {
      await fetch(`/api/caixa-diario/entries/${encodeURIComponent(id)}`, { method: "DELETE", cache: "no-store" });
    } catch {}
  };

  const addWithdrawal = async () => {
    const v = toNumberSmart(withdrawalAmount);
    if (!withdrawalReason.trim() || !withdrawalAuthorizedBy.trim() || !v) return;

    const now = new Date();
    const optimistic: Withdrawal = {
      id: `tmp_${Date.now()}`,
      date: dateISO,
      time: `${pad2(now.getHours())}:${pad2(now.getMinutes())}`,
      amount: v,
      reason: withdrawalReason,
      authorizedBy: withdrawalAuthorizedBy,
    };

    setWithdrawals((prev) => [optimistic, ...prev]);
    setWithdrawalAmount("");
    setWithdrawalReason("");
    setWithdrawalAuthorizedBy("");

    try {
      const res = await fetch("/api/caixa-diario/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          op_date: dateISO,
          type: "withdrawal",
          amount: v,
          category: optimistic.authorizedBy,
          description: optimistic.reason,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const e = data.entry;
      setWithdrawals((prev) => prev.map((w) => (w.id === optimistic.id ? { ...w, id: e.id, time: timeFromOccurredAt(e.occurred_at) } : w)));
    } catch {
      setWithdrawals((prev) => prev.filter((w) => w.id !== optimistic.id));
    }
  };

  const removeWithdrawal = async (id: string) => {
    setWithdrawals((prev) => prev.filter((w) => w.id !== id));
    if (id.startsWith("tmp_")) return;
    try {
      await fetch(`/api/caixa-diario/entries/${encodeURIComponent(id)}`, { method: "DELETE", cache: "no-store" });
    } catch {}
  };

  const updateCount = (which: "initial" | "final", denom: number, qty: number) => {
    const setter = which === "initial" ? setInitialCounts : setFinalCounts;
    let captured: CountItem[] = [];

    setter((prev) => {
      const next = prev.map((it) => (it.denomination === denom ? { ...it, quantity: qty } : it));
      captured = next;
      return next;
    });

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      if (!captured.length) return;
      try {
        await fetch("/api/caixa-diario/session", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            which === "initial"
              ? { op_date: dateISO, initial_counts: captured }
              : { op_date: dateISO, final_counts: captured }
          ),
        });
      } catch {}
    }, 650);
  };

  return (
    <div className="w-full min-w-0 text-white">
      <div className="w-full min-w-0">
        <div className="mb-8">
          <div className="text-[34px] font-extrabold leading-none">Caixa Diário</div>
          {status === "loading" && <div className="mt-3 text-[13px] text-slate-200/70">Carregando…</div>}
          {status === "err" && <div className="mt-3 text-[13px] text-red-300/80">Falha ao carregar o caixa.</div>}
        </div>

        <div className="w-full overflow-x-auto pb-1">
          <div style={{ display: "flex", gap: 16, flexWrap: "nowrap", minWidth: "max-content" }}>
            <div style={{ width: STAT_W, flex: `0 0 ${STAT_W}px` }}>
              <StatCard label="Caixa Inicial:" value={brl(caixaInicial)} color="cyan" />
            </div>
            <div style={{ width: STAT_W, flex: `0 0 ${STAT_W}px` }}>
              <StatCard label="Entradas (Dinheiro):" value={brl(cashInTotal)} color="emerald" />
            </div>
            <div style={{ width: STAT_W, flex: `0 0 ${STAT_W}px` }}>
              <StatCard label="Despesas:" value={brl(totalDespesas)} color="red" />
            </div>
            <div style={{ width: STAT_W, flex: `0 0 ${STAT_W}px` }}>
              <StatCard label="Sangrias:" value={brl(totalSangrias)} color="orange" />
            </div>
            <div style={{ width: STAT_W, flex: `0 0 ${STAT_W}px` }}>
              <StatCard label="Esperado:" value={brl(esperado)} color="blue" />
            </div>
            <div style={{ width: STAT_W, flex: `0 0 ${STAT_W}px` }}>
              <StatCard label="Caixa Final:" value={brl(caixaFinal)} color="cyan" />
            </div>
            <div style={{ width: STAT_W, flex: `0 0 ${STAT_W}px` }}>
              <StatCard
                label="Diferença:"
                value={(diferenca >= 0 ? "+" : "") + brl(diferenca)}
                color={difIsBad ? "red" : "emerald"}
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <TabBar tab={tab} setTab={setTab} />
        </div>

        <div className="mt-8 space-y-6">
          {tab === "entradas" && (
            <EntradasTab
              pedidosAll={pedidosAll}
              manualCash={manualCash}
              manualDesc={manualDesc}
              manualAmount={manualAmount}
              setManualDesc={setManualDesc}
              setManualAmount={setManualAmount}
              addManualCash={addManualCash}
              removeManual={removeManual}
              removePedido={removePedido}
              onDeleteManual={removeManual}
            />
          )}

          {tab === "despesas" && (
            <DespesasTab
              expenses={expenses}
              setExpenses={setExpenses}
              expenseCategory={expenseCategory}
              setExpenseCategory={setExpenseCategory}
              expenseAmount={expenseAmount}
              setExpenseAmount={setExpenseAmount}
              expenseDescription={expenseDescription}
              setExpenseDescription={setExpenseDescription}
              expensePaymentMethod={expensePaymentMethod}
              setExpensePaymentMethod={setExpensePaymentMethod}
              addExpense={addExpense}
              totalDespesas={totalDespesas}
              onDeleteExpense={removeExpense}
            />
          )}

          {tab === "sangrias" && (
            <SangriasTab
              withdrawals={withdrawals}
              setWithdrawals={setWithdrawals}
              withdrawalAmount={withdrawalAmount}
              setWithdrawalAmount={setWithdrawalAmount}
              withdrawalReason={withdrawalReason}
              setWithdrawalReason={setWithdrawalReason}
              withdrawalAuthorizedBy={withdrawalAuthorizedBy}
              setWithdrawalAuthorizedBy={setWithdrawalAuthorizedBy}
              addWithdrawal={addWithdrawal}
              totalSangrias={totalSangrias}
              onDeleteWithdrawal={removeWithdrawal}
            />
          )}

          {tab === "contadores" && (
            <ContadoresTab
              initialCounts={initialCounts}
              finalCounts={finalCounts}
              initialTotal={caixaInicial}
              finalTotal={caixaFinal}
              updateCount={updateCount}
            />
          )}
        </div>
      </div>
    </div>
  );
}
