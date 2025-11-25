"use client";

import Link from "next/link";
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
import { fetchProfile } from "@/lib/clientApi";

const getInitialToken = () => (typeof window === "undefined" ? null : localStorage.getItem("token"));

export default function SeparadorPage() {
  const [token, setToken] = useState<string | null>(getInitialToken);
  const [envelopes, setEnvelopes] = useState<EnvelopeDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [envelopeForm, setEnvelopeForm] = useState({ title: "", budget: "" });
  const [allocationForm, setAllocationForm] = useState({ title: "", amount: "", date: "" });
  const [activeEnvelopeId, setActiveEnvelopeId] = useState<number | null>(null);
  const [salary, setSalary] = useState<number>(0);

  const toNumber = (value: any) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const profile = await fetchProfile(token);
        setSalary(toNumber(profile.salary || 0));
      } catch (_err) {
        setSalary(0);
      }
    })();
    loadEnvelopes();
  }, [token]);

  async function loadEnvelopes() {
    setError("");
    try {
      const items = await fetchEnvelopes(token!);
      setEnvelopes(items);
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
      const created = await createEnvelope(token, { title: envelopeForm.title.trim(), budget });
      setEnvelopes((prev) => [created, ...prev]);
      setEnvelopeForm({ title: "", budget: "" });
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
    if (!token || !activeEnvelopeId) return;
    const amount = parseFloat(allocationForm.amount);
    if (Number.isNaN(amount) || !allocationForm.title.trim()) {
      setError("Título e valor são obrigatórios.");
      return;
    }
    setLoading(true);
    try {
      const updated = await addAllocation(token, activeEnvelopeId, {
        title: allocationForm.title.trim(),
        amount,
        date: allocationForm.date || undefined,
      });
      setEnvelopes((prev) => prev.map((env) => (env.id === activeEnvelopeId ? updated : env)));
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
      // revalida estado com dados atualizados
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

  const allocated = selected?.allocations?.reduce((sum, a) => sum + a.amount, 0) || 0;
  const budget = selected?.budget || 0;
  const remaining = budget - allocated;
  const allocatedTotal = envelopes.reduce(
    (sum, env) => sum + (env.allocations?.reduce((s, a) => s + a.amount, 0) || 0),
    0
  );
  const salaryRemaining = salary - allocatedTotal;

  return (
    <div className="page space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="uppercase tracking-[0.08em] text-emerald-300 text-xs">Separador de gastos</p>
          <h1 className="text-2xl font-bold text-slate-50">Envelopes de despesas</h1>
          <p className="text-slate-300 text-sm">
            Crie envelopes (ex: Ifood, Lazer) para reservar parte do salário e registrar gastos separados.
          </p>
        </div>
        <Link href="/" className="button-ghost">
          Voltar
        </Link>
      </div>

      <div className="glass p-4 rounded-xl border border-white/10 bg-white/5 grid gap-3 md:grid-cols-3">
        <div>
          <p className="text-xs text-slate-400 uppercase">Salário</p>
          <p className="text-lg font-semibold text-slate-50">R$ {salary.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase">Gastos em envelopes</p>
          <p className="text-lg font-semibold text-rose-300">R$ {allocatedTotal.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase">Sobra geral</p>
          <p className="text-lg font-semibold text-emerald-300">R$ {salaryRemaining.toFixed(2)}</p>
        </div>
        <div className="md:col-span-3">
          <div
            className="mx-auto w-full max-w-[320px] h-[320px] rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative"
            style={{
              background: `conic-gradient(#22c55e ${Math.max(0, Math.min(100, (salaryRemaining / (salary || 1)) * 100))}% , #f43f5e 0)`,
            }}
          >
            <div className="absolute inset-[18%] rounded-full bg-slate-950 border border-white/10 flex flex-col items-center justify-center text-center px-4">
              <p className="text-xs text-slate-400">Disponível</p>
              <p className="text-xl font-bold text-emerald-300">R$ {salaryRemaining.toFixed(2)}</p>
              <p className="text-xs text-slate-400">de R$ {salary.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass p-4 space-y-3">
        <h2 className="text-lg font-semibold text-slate-50">Criar novo envelope</h2>
        <form onSubmit={handleCreateEnvelope} className="grid gap-3 md:grid-cols-3 items-end">
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
          <button type="submit" className="button-primary" disabled={loading}>
            {loading ? "Salvando..." : "Adicionar envelope"}
          </button>
        </form>
        {error && <p className="text-rose-400 text-sm">{error}</p>}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass p-4 space-y-2">
          <h3 className="text-lg font-semibold text-slate-50">Meus envelopes</h3>
          {envelopes.length === 0 ? (
            <p className="text-slate-300 text-sm">Nenhum envelope criado.</p>
          ) : (
            <ul className="list">
              {envelopes.map((env) => (
                <li key={env.id} className="flex justify-between items-center gap-2">
                  <div>
                    <p className="description">{env.title}</p>
                    <p className="muted">Reserva: R$ {env.budget.toFixed(2)}</p>
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
    </div>
  );
}
