 "use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchExpenses, fetchObligations, fetchPayCycles } from "@/lib/clientApi";
import type { Expense, Obligation, PayCycle } from "@/lib/types";

const getInitialToken = () => (typeof window === "undefined" ? null : localStorage.getItem("token"));

export default function CicloPage({ params }: { params: { id: string } }) {
  const cycleId = Number(params.id);
  const [token, setToken] = useState<string | null>(getInitialToken);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [payCycles, setPayCycles] = useState<PayCycle[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [exps, obs, cycles] = await Promise.all([
          fetchExpenses(token),
          fetchObligations(token),
          fetchPayCycles(token),
        ]);
        setExpenses(exps);
        setObligations(obs);
        setPayCycles(cycles);
      } catch (err: any) {
        setError(err?.message || "Erro ao carregar ciclo");
      }
    })();
  }, [token]);

  const cycle = useMemo(() => payCycles.find((c) => c.id === cycleId), [payCycles, cycleId]);
  const filteredObligations = useMemo(
    () => obligations.filter((o) => o.payCycleId === cycleId),
    [obligations, cycleId]
  );
  const filteredExpenses = useMemo(() => expenses.filter((e) => e.payCycleId === cycleId), [expenses, cycleId]);

  const totalOb = filteredObligations.reduce((sum, o) => sum + o.amount, 0);
  const totalExp = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const total = totalOb + totalExp;

  if (Number.isNaN(cycleId)) {
    return (
      <div className="page">
        <p className="text-slate-200">ID do ciclo inválido.</p>
      </div>
    );
  }

  return (
    <div className="page space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="uppercase tracking-[0.08em] text-emerald-300 text-xs">Ciclo</p>
          <h1 className="text-2xl font-semibold text-slate-50">{cycle ? cycle.name : `Ciclo ${cycleId}`}</h1>
          {cycle && <p className="text-slate-400 text-sm">Dia de pagamento: {cycle.payDay}</p>}
        </div>
        <Link href="/" className="button-ghost">
          Voltar
        </Link>
      </div>

      {error && <p className="text-rose-400 text-sm">{error}</p>}

      <div className="glass p-4 space-y-2">
        <div className="flex items-center justify-between text-sm text-slate-200">
          <span>Fixas</span>
          <span>R$ {totalOb.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-200">
          <span>Variáveis</span>
          <span>R$ {totalExp.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-emerald-300 font-semibold">
          <span>Total</span>
          <span>R$ {total.toFixed(2)}</span>
        </div>
      </div>

      <section className="glass p-4 space-y-3">
        <h2 className="text-lg font-semibold text-slate-50">Obrigações vinculadas</h2>
        {filteredObligations.length === 0 ? (
          <p className="text-slate-300 text-sm">Nenhuma obrigação para este ciclo.</p>
        ) : (
          <ul className="list">
            {filteredObligations.map((ob) => (
              <li key={ob.id}>
                <div>
                  <p className="description">
                    {ob.title} <span className="muted">- dia {ob.dueDay}</span>
                  </p>
                  <p className="muted">
                    R$ {ob.amount.toFixed(2)} {ob.category && ` - ${ob.category}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="glass p-4 space-y-3">
        <h2 className="text-lg font-semibold text-slate-50">Despesas vinculadas</h2>
        {filteredExpenses.length === 0 ? (
          <p className="text-slate-300 text-sm">Nenhuma despesa para este ciclo.</p>
        ) : (
          <ul className="list">
            {filteredExpenses.map((ex) => (
              <li key={ex.id}>
                <div>
                  <p className="description">{ex.description}</p>
                  <p className="muted">
                    R$ {ex.amount.toFixed(2)} {ex.category && ` - ${ex.category}`} -{" "}
                    {new Date(ex.date).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
