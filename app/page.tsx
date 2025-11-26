/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EnvelopeSeparator } from "@/components/EnvelopeSeparator";
import {
  createPayCycle,
  deletePayCycle,
  fetchPayCycles,
  fetchExtraIncome,
  fetchProfile,
  login,
  register,
  updatePayCycle,
  createExtraIncome,
  deleteExtraIncome,
  updateSalary,
} from "@/lib/clientApi";
import type { PayCycle, User, ExtraIncome } from "@/lib/types";

type ViewMode = "login" | "register";

const initialForm = { name: "", email: "", password: "" };
const initialPayCycle = { name: "", payDay: "1", salaryAmount: "" };

const getInitialToken = () => (typeof window === "undefined" ? null : localStorage.getItem("token"));

export default function App() {
  const [mode, setMode] = useState<ViewMode>("login");
  const [authForm, setAuthForm] = useState(initialForm);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getInitialToken);

  const [salaryInput, setSalaryInput] = useState("");
  const [savingSalary, setSavingSalary] = useState(false);

  const [payCycles, setPayCycles] = useState<PayCycle[]>([]);
  const [payCycleForm, setPayCycleForm] = useState(initialPayCycle);
  const [savingPayCycle, setSavingPayCycle] = useState(false);
  const [payCycleError, setPayCycleError] = useState("");
  const [extraIncomes, setExtraIncomes] = useState<ExtraIncome[]>([]);
  const [extraForm, setExtraForm] = useState({ title: "", amount: "", date: "", payCycleId: "" });
  const [savingExtra, setSavingExtra] = useState(false);
  const [extraError, setExtraError] = useState("");

  const isAuthenticated = useMemo(() => Boolean(token), [token]);
  const salaryFromUser = Number(user?.salary ?? 0);
  const salaryFromCycles = payCycles.reduce(
    (sum, cycle) => sum + (cycle.salaryAmount ? Number(cycle.salaryAmount) : 0),
    0
  );
  const salaryBase = salaryFromCycles > 0 ? salaryFromCycles : salaryFromUser;

  useEffect(() => {
    if (!token) return;
    loadProfileFromStorage();
    loadProfile();
    loadPayCycles();
    loadExtraIncome();
  }, [token]);

  function loadProfileFromStorage() {
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.warn("Erro ao ler usuário salvo", error);
      }
    }
  }

  async function loadProfile() {
    if (!token) return;
    try {
      const profile = await fetchProfile(token);
      setUser(profile);
      setSalaryInput(profile.salary != null ? profile.salary.toString() : "");
      localStorage.setItem("user", JSON.stringify(profile));
    } catch (error) {
      console.error("Erro ao buscar perfil", error);
    }
  }

  async function loadPayCycles() {
    if (!token) return;
    setPayCycleError("");
    try {
      const items = await fetchPayCycles(token);
      setPayCycles(items);
    } catch (error) {
      console.error(error);
      setPayCycleError("Não foi possível carregar os ciclos");
    }
  }

  async function loadExtraIncome() {
    if (!token) return;
    setExtraError("");
    try {
      const items = await fetchExtraIncome(token);
      setExtraIncomes(items);
    } catch (error) {
      console.error(error);
      setExtraError("Não foi possível carregar rendas extras");
    }
  }

  async function handleAuthSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoadingAuth(true);
    setAuthError("");
    try {
      const action = mode === "login" ? login : register;
      const response = await action(authForm);
      setToken(response.token);
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      setUser(response.user);
      setAuthForm(initialForm);
    } catch (error: any) {
      const message = error?.message || "Erro ao autenticar";
      setAuthError(message);
    } finally {
      setLoadingAuth(false);
    }
  }

  async function handleSalarySave(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return;
    const parsed = parseFloat(salaryInput);
    if (Number.isNaN(parsed) || parsed < 0) {
      setPayCycleError("Salário inválido");
      return;
    }
    setSavingSalary(true);
    try {
      const updated = await updateSalary(token, parsed);
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
    } catch (error) {
      console.error(error);
      setPayCycleError("Erro ao salvar salário");
    } finally {
      setSavingSalary(false);
    }
  }

  async function handlePayCycleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return;
    setSavingPayCycle(true);
    setPayCycleError("");
    const day = Number(payCycleForm.payDay);
    if (!payCycleForm.name || Number.isNaN(day) || day < 1 || day > 31) {
      setPayCycleError("Informe nome e dia entre 1 e 31");
      setSavingPayCycle(false);
      return;
    }
    try {
      const salaryAmount =
        payCycleForm.salaryAmount !== "" && payCycleForm.salaryAmount !== null
          ? parseFloat(payCycleForm.salaryAmount)
          : undefined;
      if (salaryAmount !== undefined && (Number.isNaN(salaryAmount) || salaryAmount < 0)) {
        setPayCycleError("Salário do ciclo inválido");
        setSavingPayCycle(false);
        return;
      }
      const created = await createPayCycle(token, { name: payCycleForm.name, payDay: day, salaryAmount });
      setPayCycles((prev) => [...prev, created].sort((a, b) => a.payDay - b.payDay));
      setPayCycleForm(initialPayCycle);
    } catch (error: any) {
      const message = error?.message || "Erro ao criar ciclo";
      setPayCycleError(message);
    } finally {
      setSavingPayCycle(false);
    }
  }

  async function handleUpdateCycleSalary(id: number) {
    if (!token) return;
    const value = prompt("Informe o salário deste ciclo (deixe vazio para remover):");
    if (value === null) return;
    const parsed = value.trim() === "" ? null : parseFloat(value);
    if (parsed !== null && (Number.isNaN(parsed) || parsed < 0)) {
      setPayCycleError("Valor inválido");
      return;
    }
    try {
      const updated = await updatePayCycle(token, id, { salaryAmount: parsed === null ? null : parsed });
      setPayCycles((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (error: any) {
      const message = error?.message || "Erro ao atualizar salário do ciclo";
      setPayCycleError(message);
    }
  }

  async function handleDeletePayCycle(id: number) {
    if (!token) return;
    const confirmed = confirm("Excluir ciclo de pagamento? Itens associados perderão a vinculação.");
    if (!confirmed) return;
    try {
      await deletePayCycle(token, id);
      setPayCycles((prev) => prev.filter((c) => c.id !== id));
    } catch (error: any) {
      const message = error?.message || "Erro ao excluir ciclo";
      setPayCycleError(message);
    }
  }

  async function handleExtraSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return;
    setSavingExtra(true);
    setExtraError("");
    const parsedAmount = parseFloat(extraForm.amount);
    if (!extraForm.title.trim() || Number.isNaN(parsedAmount) || parsedAmount < 0) {
      setExtraError("Informe título e valor válido");
      setSavingExtra(false);
      return;
    }
    const payload = {
      title: extraForm.title.trim(),
      amount: parsedAmount,
      date: extraForm.date || undefined,
      payCycleId: extraForm.payCycleId ? Number(extraForm.payCycleId) : null,
    };
    try {
      const created = await createExtraIncome(token, payload);
      setExtraIncomes((prev) => [created, ...prev]);
      setExtraForm({ title: "", amount: "", date: "", payCycleId: "" });
    } catch (error: any) {
      const message = error?.message || "Erro ao salvar renda extra";
      setExtraError(message);
    } finally {
      setSavingExtra(false);
    }
  }

  async function handleDeleteExtra(id: number) {
    if (!token) return;
    const confirmed = confirm("Excluir esta renda extra?");
    if (!confirmed) return;
    try {
      await deleteExtraIncome(token, id);
      setExtraIncomes((prev) => prev.filter((item) => item.id !== id));
    } catch (error: any) {
      const message = error?.message || "Erro ao excluir renda extra";
      setExtraError(message);
    }
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    setPayCycles([]);
    setExtraIncomes([]);
  }

  return (
    <div id="painel" className="max-w-7xl mx-auto px-4 pb-10 pt-8 space-y-6">
      <div className="glass p-6 md:p-8 space-y-3">
        <p className="uppercase tracking-[0.08em] text-emerald-300 text-xs">Controle de Gastos</p>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-50">
          Veja para onde seu dinheiro vai e planeje o mês sem sustos.
        </h1>
        <p className="text-slate-300 max-w-3xl">
          Cadastre seus salários, organize ciclos de pagamento e use o separador para reservar valores.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="#painel" className="button-ghost">
            Ir para painel
          </Link>
          <Link href="/separador" className="button-ghost">
            Separador de gastos
          </Link>
        </div>
      </div>

      {!isAuthenticated ? (
        <section className="glass p-6 space-y-4 max-w-3xl mx-auto">
          <div className="grid grid-cols-2 border border-white/10 rounded-xl overflow-hidden">
            <button
              className={`py-3 text-sm font-semibold ${mode === "login" ? "bg-emerald-300 text-slate-900" : "text-slate-100"}`}
              onClick={() => setMode("login")}
            >
              Entrar
            </button>
            <button
              className={`py-3 text-sm font-semibold ${mode === "register" ? "bg-emerald-300 text-slate-900" : "text-slate-100"}`}
              onClick={() => setMode("register")}
            >
              Criar conta
            </button>
          </div>
          <form onSubmit={handleAuthSubmit} className="space-y-3">
            {mode === "register" && (
              <label className="space-y-1 text-sm text-slate-200">
                Nome
                <input
                  type="text"
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  className="input"
                  placeholder="Seu nome"
                  required
                />
              </label>
            )}
            <label className="space-y-1 text-sm text-slate-200">
              E-mail
              <input
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                className="input"
                placeholder="voce@email.com"
                required
              />
            </label>
            <label className="space-y-1 text-sm text-slate-200">
              Senha
              <input
                type="password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                className="input"
                placeholder="•••••••"
                required
              />
            </label>
            {authError && <p className="text-rose-400 text-sm">{authError}</p>}
            <button type="submit" className="button-primary w-full" disabled={loadingAuth}>
              {loadingAuth ? "Enviando..." : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>
        </section>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <section className="glass p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="uppercase tracking-[0.08em] text-emerald-300 text-xs">Bem-vindo(a)</p>
                  <h2 className="text-xl font-semibold text-slate-50">{user?.name}</h2>
                  <p className="text-slate-300 text-sm">{user?.email}</p>
                </div>
                <button className="button-ghost" onClick={handleLogout}>
                  Sair
                </button>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-4 space-y-1">
                <p className="text-xs text-slate-400 uppercase">Ciclos configurados</p>
                <p className="text-lg font-semibold text-slate-50">{payCycles.length} ciclo(s)</p>
                <p className="text-xs text-slate-400">
                  Soma salarial: R$ {salaryFromCycles.toFixed(2)} • Salário base: R$ {salaryBase.toFixed(2)}
                </p>
              </div>
            </section>

            <section className="glass p-5 space-y-3">
              <p className="uppercase tracking-[0.08em] text-emerald-300 text-xs">Salário e meta do mês</p>
              <h3 className="text-lg font-semibold text-slate-50">Defina seu salário líquido</h3>
              <form onSubmit={handleSalarySave} className="space-y-2">
                <label className="space-y-1 text-sm text-slate-200">
                  Salário líquido (R$)
                  <input
                    type="number"
                    step="0.01"
                    value={salaryInput}
                    onChange={(e) => setSalaryInput(e.target.value)}
                    placeholder="Ex: 4000"
                    className="input"
                  />
                </label>
                <button type="submit" className="button-primary w-full" disabled={savingSalary}>
                  {savingSalary ? "Salvando..." : "Salvar salário"}
                </button>
              </form>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-xs text-slate-400 uppercase">Salário atual</p>
                <p className="text-lg font-semibold text-emerald-300">R$ {salaryFromUser.toFixed(2)}</p>
              </div>
            </section>

            <section className="glass p-5 space-y-3">
              <p className="uppercase tracking-[0.08em] text-emerald-300 text-xs">Ciclos ativos</p>
              <h3 className="text-lg font-semibold text-slate-50">Resumo rápido</h3>
              <div className="space-y-2 text-sm text-slate-200">
                <p>Salário base (somando ciclos): R$ {salaryBase.toFixed(2)}</p>
                <p>Salário do usuário: R$ {salaryFromUser.toFixed(2)}</p>
              </div>
            </section>
          </div>

          <section className="glass p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="uppercase tracking-[0.08em] text-emerald-300 text-xs">Ciclos de pagamento</p>
                <h3 className="text-lg font-semibold text-slate-50">Mapeie seus salários</h3>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="button-ghost"
                  onClick={() => setPayCycleForm({ name: "Salário 25", payDay: "25", salaryAmount: payCycleForm.salaryAmount })}
                >
                  Usar dia 25
                </button>
                <button
                  type="button"
                  className="button-ghost"
                  onClick={() => setPayCycleForm({ name: "Salário 1-10", payDay: "5", salaryAmount: payCycleForm.salaryAmount })}
                >
                  Usar dia 1-10
                </button>
              </div>
            </div>
            <form onSubmit={handlePayCycleSubmit} className="grid gap-3 md:grid-cols-3 items-end">
              <label className="space-y-1 text-sm text-slate-200">
                Nome do ciclo
                <input
                  type="text"
                  value={payCycleForm.name}
                  onChange={(e) => setPayCycleForm({ ...payCycleForm, name: e.target.value })}
                  placeholder="Ex: Salário 25"
                  required
                  className="input"
                />
              </label>
              <label className="space-y-1 text-sm text-slate-200">
                Salário deste ciclo (R$)
                <input
                  type="number"
                  step="0.01"
                  value={payCycleForm.salaryAmount}
                  onChange={(e) => setPayCycleForm({ ...payCycleForm, salaryAmount: e.target.value })}
                  placeholder="Ex: 4000"
                  className="input"
                />
              </label>
              <label className="space-y-1 text-sm text-slate-200">
                Dia do mês
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={payCycleForm.payDay}
                  onChange={(e) => setPayCycleForm({ ...payCycleForm, payDay: e.target.value })}
                  required
                  className="input"
                />
              </label>
              {payCycleError && <p className="text-rose-400 text-sm md:col-span-3">{payCycleError}</p>}
              <button type="submit" className="button-primary md:col-span-3" disabled={savingPayCycle}>
                {savingPayCycle ? "Salvando..." : "Salvar ciclo"}
              </button>
            </form>
            {payCycles.length > 0 && (
              <ul className="list mt-2">
                {payCycles.map((cycle) => (
                  <li key={cycle.id}>
                    <div>
                      <p className="description">
                        {cycle.name} <span className="muted">- dia {cycle.payDay}</span>
                      </p>
                      {cycle.salaryAmount != null && (
                        <p className="muted">Salário deste ciclo: R$ {Number(cycle.salaryAmount).toFixed(2)}</p>
                      )}
                    </div>
                    <div className="row">
                      <button className="button-ghost" onClick={() => handleUpdateCycleSalary(cycle.id)}>
                        Editar salário
                      </button>
                      <button className="danger" onClick={() => handleDeletePayCycle(cycle.id)}>
                        Excluir
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="glass p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="uppercase tracking-[0.08em] text-emerald-300 text-xs">Renda extra</p>
                <h3 className="text-lg font-semibold text-slate-50">Adicionar saldo extra</h3>
                <p className="text-slate-300 text-sm">Use para registrar ganhos avulsos (ex: Uber, vendas, bônus).</p>
              </div>
              <button className="button-ghost" onClick={loadExtraIncome}>
                Atualizar
              </button>
            </div>
            <form onSubmit={handleExtraSubmit} className="grid gap-3 md:grid-cols-4 items-end">
              <label className="space-y-1 text-sm text-slate-200">
                Título
                <input
                  type="text"
                  value={extraForm.title}
                  onChange={(e) => setExtraForm({ ...extraForm, title: e.target.value })}
                  className="input"
                  placeholder="Ex: Uber, Freelancer..."
                  required
                />
              </label>
              <label className="space-y-1 text-sm text-slate-200">
                Valor (R$)
                <input
                  type="number"
                  step="0.01"
                  value={extraForm.amount}
                  onChange={(e) => setExtraForm({ ...extraForm, amount: e.target.value })}
                  className="input"
                  required
                />
              </label>
              <label className="space-y-1 text-sm text-slate-200">
                Data
                <input
                  type="date"
                  value={extraForm.date}
                  onChange={(e) => setExtraForm({ ...extraForm, date: e.target.value })}
                  className="input"
                />
              </label>
              <label className="space-y-1 text-sm text-slate-200">
                Salário / Ciclo
                <select
                  className="input"
                  value={extraForm.payCycleId}
                  onChange={(e) => setExtraForm({ ...extraForm, payCycleId: e.target.value })}
                >
                  <option value="">Sem ciclo</option>
                  {payCycles.map((cycle) => (
                    <option key={cycle.id} value={cycle.id.toString()}>
                      {cycle.name} (dia {cycle.payDay})
                    </option>
                  ))}
                </select>
              </label>
              {extraError && <p className="text-rose-400 text-sm md:col-span-4">{extraError}</p>}
              <button type="submit" className="button-primary md:col-span-4" disabled={savingExtra}>
                {savingExtra ? "Salvando..." : "Adicionar renda extra"}
              </button>
            </form>
            {extraIncomes.length > 0 ? (
              <ul className="list">
                {extraIncomes.map((item) => (
                  <li key={item.id}>
                    <div>
                      <p className="description">{item.title}</p>
                      <p className="muted">
                        R$ {item.amount.toFixed(2)} • {new Date(item.date).toLocaleDateString("pt-BR")}{" "}
                        {item.payCycleId ? `• Ciclo ${item.payCycleId}` : "• Sem ciclo"}
                      </p>
                    </div>
                    <div className="row">
                      <button className="danger" onClick={() => handleDeleteExtra(item.id)}>
                        Excluir
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-300 text-sm">Nenhuma renda extra registrada.</p>
            )}
          </section>

          {token && (
            <div className="space-y-4">
              <EnvelopeSeparator token={token} payCycles={payCycles} salary={salaryFromUser} extras={extraIncomes} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
