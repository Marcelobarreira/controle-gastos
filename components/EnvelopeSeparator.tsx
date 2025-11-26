"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addAllocation,
  createEnvelope,
  deleteAllocation,
  deleteEnvelope,
  fetchEnvelope,
  fetchEnvelopes,
} from "@/lib/envelopesClient";
import type { EnvelopeDTO } from "@/lib/typesEnvelope";
import type { PayCycle, ExtraIncome } from "@/lib/types";

type Props = {
  token: string;
  payCycles: PayCycle[];
  salary: number;
  extras: ExtraIncome[];
};

const toNumber = (value: any) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export function EnvelopeSeparator({ token, payCycles, salary, extras }: Props) {
  const [envelopes, setEnvelopes] = useState<EnvelopeDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [envelopeForm, setEnvelopeForm] = useState({ title: "", budget: "", payCycleId: "all" });
  const [allocationForm, setAllocationForm] = useState({ title: "", amount: "", date: "" });
  const [activeEnvelopeId, setActiveEnvelopeId] = useState<number | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<string>("all");

  const selectedCycleId = selectedCycle !== "all" && !Number.isNaN(Number(selectedCycle)) ? Number(selectedCycle) : null;

  useEffect(() => {
    if (!token) return;
    loadEnvelopes();
  }, [token, selectedCycle]);

  async function loadEnvelopes() {
    setError("");
    try {
      const cycleParam = selectedCycle === "all" ? undefined : selectedCycle;
      const items = await fetchEnvelopes(token, cycleParam);
      setEnvelopes(items);
      if (!activeEnvelopeId && items.length > 0) {
        setActiveEnvelopeId(items[0].id);
      }
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar envelopes");
    }
  }

  async function handleCreateEnvelope(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const budget = parseFloat(envelopeForm.budget);
    if (Number.isNaN(budget) || budget < 0 || !envelopeForm.title.trim()) {
      setError("Informe título e valor válido.");
      return;
    }
    setLoading(true);
    try {
      const payload: any = { title: envelopeForm.title.trim(), budget };
      if (envelopeForm.payCycleId !== "all" && envelopeForm.payCycleId !== "") {
        payload.payCycleId = Number(envelopeForm.payCycleId);
      }
      const created = await createEnvelope(token, payload);
      setEnvelopes((prev) => [created, ...prev]);
      setEnvelopeForm({ title: "", budget: "", payCycleId: selectedCycle });
    } catch (err: any) {
      setError(err?.message || "Erro ao criar envelope");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectEnvelope(id: number) {
    if (!token) return;
    setActiveEnvelopeId(id);
    try {
      const full = await fetchEnvelope(token, id);
      setEnvelopes((prev) => prev.map((env) => (env.id === id ? full : env)));
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar detalhes");
    }
  }

  async function handleAddAllocation(e: React.FormEvent) {
    e.preventDefault();
    const envelopeId = activeEnvelopeId || selected?.id;
    if (!token || !envelopeId) return;
    const amount = parseFloat(allocationForm.amount);
    if (Number.isNaN(amount) || !allocationForm.title.trim()) {
      setError("Título e valor são obrigatórios.");
      return;
    }
    setLoading(true);
    try {
      const updated = await addAllocation(token, envelopeId, {
        title: allocationForm.title.trim(),
        amount,
        date: allocationForm.date || undefined,
      });
      setEnvelopes((prev) => prev.map((env) => (env.id === envelopeId ? updated : env)));
      setAllocationForm({ title: "", amount: "", date: "" });
    } catch (err: any) {
      setError(err?.message || "Erro ao registrar gasto no envelope");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteEnvelope(id: number) {
    if (!token) return;
    const confirmed = confirm("Excluir este envelope?");
    if (!confirmed) return;
    setLoading(true);
    try {
      await deleteEnvelope(token, id);
      setEnvelopes((prev) => prev.filter((env) => env.id !== id));
      if (activeEnvelopeId === id) {
        setActiveEnvelopeId(null);
      }
      await loadEnvelopes();
    } catch (err: any) {
      setError(err?.message || "Erro ao excluir envelope");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAllocation(envelopeId: number, allocationId: number) {
    if (!token) return;
    const confirmed = confirm("Excluir este gasto do envelope?");
    if (!confirmed) return;
    setLoading(true);
    try {
      const updated = await deleteAllocation(token, envelopeId, allocationId);
      setEnvelopes((prev) => prev.map((env) => (env.id === envelopeId ? updated : env)));
    } catch (err: any) {
      setError(err?.message || "Erro ao excluir gasto");
    } finally {
      setLoading(false);
    }
  }

  const selected = useMemo(
    () => envelopes.find((env) => env.id === activeEnvelopeId) || envelopes[0],
    [envelopes, activeEnvelopeId]
  );

  useEffect(() => {
    if (activeEnvelopeId && !envelopes.find((env) => env.id === activeEnvelopeId)) {
      setActiveEnvelopeId(envelopes[0]?.id ?? null);
    }
  }, [envelopes, activeEnvelopeId]);

  const filteredEnvelopes =
    selectedCycleId != null
      ? envelopes.filter((env) => env.payCycleId === selectedCycleId)
      : envelopes;

  const extrasTotal = useMemo(() => {
    if (selectedCycleId != null) {
      return extras.reduce((sum, e) => {
        if (e.payCycleId === selectedCycleId || e.payCycleId == null) {
          return sum + e.amount;
        }
        return sum;
      }, 0);
    }
    return extras.reduce((sum, e) => sum + e.amount, 0);
  }, [extras, selectedCycleId]);

  const allocated = selected?.allocations?.reduce((sum, a) => sum + a.amount, 0) || 0;
  const budget = selected?.budget || 0;
  const remaining = budget - allocated;

  const selectedCycleSalary =
    selectedCycleId && payCycles.find((c) => c.id === selectedCycleId)?.salaryAmount
      ? toNumber(payCycles.find((c) => c.id === selectedCycleId)!.salaryAmount)
      : null;

  const allocatedTotal = filteredEnvelopes.reduce(
    (sum, env) => sum + (env.allocations?.reduce((s, a) => s + a.amount, 0) || 0),
    0
  );
  const cycleSalarySum = payCycles.reduce(
    (sum, c) => sum + (c.salaryAmount ? toNumber(c.salaryAmount) : 0),
    0
  );
  const salaryBase =
    selectedCycleId != null
      ? (selectedCycleSalary ?? salary) + extrasTotal
      : (cycleSalarySum > 0 ? cycleSalarySum : salary) + extrasTotal;
  const salaryRemaining = salaryBase - allocatedTotal;

  return (
    <section className="glass p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="uppercase tracking-[0.08em] text-emerald-300 text-xs">Separador de gastos</p>
          <h2 className="text-xl font-semibold text-slate-50">Envelopes de despesas</h2>
          <p className="text-slate-300 text-sm">Reserves por ciclo e acompanhe quanto ainda pode gastar.</p>
        </div>
      </div>

      <div className="glass p-4 rounded-xl border border-white/10 bg-white/5 grid gap-3 md:grid-cols-4">
        <div>
          <p className="text-xs text-slate-400 uppercase">Salário</p>
          <p className="text-lg font-semibold text-slate-50">R$ {salaryBase.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase">Gastos em envelopes</p>
          <p className="text-lg font-semibold text-rose-300">R$ {allocatedTotal.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase">Sobra geral</p>
          <p className="text-lg font-semibold text-emerald-300">R$ {salaryRemaining.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase">Extras considerados</p>
          <p className="text-lg font-semibold text-amber-300">R$ {extrasTotal.toFixed(2)}</p>
        </div>
        <div className="md:col-span-4">
          <div
            className="mx-auto w-full max-w-[320px] h-[320px] rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative"
            style={{
              background: `conic-gradient(#22c55e ${Math.max(0, Math.min(100, (salaryRemaining / (salaryBase || 1)) * 100))}% , #f43f5e 0)`,
            }}
          >
            <div className="absolute inset-[18%] rounded-full bg-slate-950 border border-white/10 flex flex-col items-center justify-center text-center px-4">
              <p className="text-xs text-slate-400">Disponível</p>
              <p className="text-xl font-bold text-emerald-300">R$ {salaryRemaining.toFixed(2)}</p>
              <p className="text-xs text-slate-400">de R$ {salaryBase.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass p-4 space-y-3">
        <h3 className="text-lg font-semibold text-slate-50">Criar novo envelope</h3>
        <form onSubmit={handleCreateEnvelope} className="grid gap-3 md:grid-cols-4 items-end">
          <label className="space-y-1 text-sm text-slate-200">
            Título
            <input
              type="text"
              value={envelopeForm.title}
              onChange={(e) => setEnvelopeForm({ ...envelopeForm, title: e.target.value })}
              placeholder="Ex: Ifood, Lazer..."
              className="input"
              required
            />
          </label>
          <label className="space-y-1 text-sm text-slate-200">
            Reserva (R$)
            <input
              type="number"
              step="0.01"
              value={envelopeForm.budget}
              onChange={(e) => setEnvelopeForm({ ...envelopeForm, budget: e.target.value })}
              placeholder="Ex: 200,00"
              className="input"
              required
            />
          </label>
          <label className="space-y-1 text-sm text-slate-200">
            Salário / Ciclo
            <select
              className="input"
              value={envelopeForm.payCycleId}
              onChange={(e) => {
                setEnvelopeForm({ ...envelopeForm, payCycleId: e.target.value });
                setSelectedCycle(e.target.value);
              }}
            >
              <option value="all">Todos</option>
              {payCycles.map((cycle) => (
                <option key={cycle.id} value={cycle.id.toString()}>
                  {cycle.name} (dia {cycle.payDay})
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="button-primary" disabled={loading}>
            {loading ? "Salvando..." : "Adicionar envelope"}
          </button>
        </form>
        {error && <p className="text-rose-400 text-sm">{error}</p>}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-50">Meus envelopes</h3>
            <select
              className="input max-w-[180px]"
              value={selectedCycle}
              onChange={(e) => {
                setSelectedCycle(e.target.value);
                setEnvelopeForm((prev) => ({ ...prev, payCycleId: e.target.value }));
              }}
            >
              <option value="all">Todos os ciclos</option>
              {payCycles.map((cycle) => (
                <option key={cycle.id} value={cycle.id.toString()}>
                  {cycle.name} (dia {cycle.payDay})
                </option>
              ))}
            </select>
          </div>
          {filteredEnvelopes.length === 0 ? (
            <p className="text-slate-300 text-sm">Nenhum envelope criado.</p>
          ) : (
            <ul className="list">
              {filteredEnvelopes.map((env) => (
                <li key={env.id} className="flex justify-between items-center gap-2">
                  <div>
                    <p className="description">{env.title}</p>
                    <p className="muted">
                      Reserva: R$ {env.budget.toFixed(2)}{" "}
                      {env.payCycleId && (
                        <span className="text-xs text-slate-400">• Ciclo {env.payCycleId}</span>
                      )}
                    </p>
                  </div>
                  <div className="row">
                    <button className="button-ghost" onClick={() => handleSelectEnvelope(env.id)}>
                      Ver
                    </button>
                    <button className="danger" onClick={() => handleDeleteEnvelope(env.id)}>
                      Excluir
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selected && (
          <div className="glass p-4 space-y-3 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="uppercase tracking-[0.08em] text-emerald-300 text-xs">Envelope selecionado</p>
                <h3 className="text-lg font-semibold text-slate-50">{selected.title}</h3>
                <p className="text-slate-300 text-sm">
                  Reserva: R$ {selected.budget.toFixed(2)} • Gasto: R$ {allocated.toFixed(2)} • Sobra: R${" "}
                  {remaining.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden flex">
              <div className="h-full bg-rose-400" style={{ width: `${Math.min(100, (allocated / (budget || 1)) * 100)}%` }} />
              <div className="h-full bg-emerald-300" style={{ width: `${Math.max(0, 100 - Math.min(100, (allocated / (budget || 1)) * 100))}%` }} />
            </div>

            <form onSubmit={handleAddAllocation} className="grid gap-3 md:grid-cols-3 items-end">
              <label className="space-y-1 text-sm text-slate-200">
                Descrição
                <input
                  type="text"
                  value={allocationForm.title}
                  onChange={(e) => setAllocationForm({ ...allocationForm, title: e.target.value })}
                  className="input"
                  placeholder="Pedido Ifood, Compra..."
                  required
                />
              </label>
              <label className="space-y-1 text-sm text-slate-200">
                Valor (R$)
                <input
                  type="number"
                  step="0.01"
                  value={allocationForm.amount}
                  onChange={(e) => setAllocationForm({ ...allocationForm, amount: e.target.value })}
                  className="input"
                  required
                />
              </label>
              <label className="space-y-1 text-sm text-slate-200">
                Data
                <input
                  type="date"
                  value={allocationForm.date}
                  onChange={(e) => setAllocationForm({ ...allocationForm, date: e.target.value })}
                  className="input"
                />
              </label>
              <button type="submit" className="button-primary md:col-span-3" disabled={loading}>
                {loading ? "Salvando..." : "Adicionar gasto ao envelope"}
              </button>
            </form>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-200">Gastos do envelope</h4>
              {selected.allocations && selected.allocations.length > 0 ? (
                <ul className="list">
                  {selected.allocations.map((alloc) => (
                    <li key={alloc.id}>
                      <div>
                        <p className="description">{alloc.title}</p>
                        <p className="muted">
                          R$ {alloc.amount.toFixed(2)} - {new Date(alloc.date).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="row">
                        <button className="danger" onClick={() => handleDeleteAllocation(selected.id, alloc.id)}>
                          Excluir
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-300 text-sm">Nenhum gasto registrado para este envelope.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
