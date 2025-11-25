import { useEffect, useMemo, useState } from "react";
import {
  login,
  register,
  fetchExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  fetchObligations,
  createObligation,
  updateObligation,
  deleteObligation,
  fetchProfile,
  updateSalary,
  fetchPayCycles,
  createPayCycle,
  deletePayCycle,
  fetchFutureEntries,
  createFutureEntry,
  updateFutureEntry,
  deleteFutureEntry,
} from "./api";
import type { Expense, FutureEntry, Obligation, PayCycle, User } from "./types";

import { FutureEntries } from "./components/FutureEntries";
import { CalendarPlanner } from "./components/CalendarPlanner";
type ViewMode = "login" | "register";
const initialForm = { name: "", email: "", password: "" };
const initialExpense = { description: "", amount: "", category: "", date: "", payCycleId: "" };
const initialObligation = { title: "", amount: "", category: "", dueDay: "1", payCycleId: "" };
const initialPayCycle = { name: "", payDay: "1" };

type FutureEntryFormState = { title: string; amount: string; category: string; dueDate: string; type: "expense" | "income" };
const initialFutureEntry: FutureEntryFormState = { title: "", amount: "", category: "", dueDate: "", type: "expense" };
const EXPENSE_CATEGORIES = [
  "Alimentação",
  "Supermercado/Feira",
  "Transporte",
  "Apps/Uber",
  "Combustível",
  "Lazer",
  "Viagem",
  "Educação",
  "Saúde",
  "Casa",
  "Pets",
  "Roupas",
  "Emergências",
  "Outros",
];
const OBLIGATION_CATEGORIES = [
  "Aluguel/Condomínio",
  "Energia",
  "Água",
  "Internet",
  "Celular",
  "Plano de saúde",
  "Seguro",
  "Financiamento",
  "Streaming",
  "Academia",
  "Escola/Faculdade",
  "Outros",
];
const getCurrentMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { start, end };
};
export default function App() {
  const [mode, setMode] = useState<ViewMode>("login");
  const [authForm, setAuthForm] = useState(initialForm);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseForm, setExpenseForm] = useState(initialExpense);
  const [savingExpense, setSavingExpense] = useState(false);
  const [expensesError, setExpensesError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [obligationForm, setObligationForm] = useState(initialObligation);
  const [savingObligation, setSavingObligation] = useState(false);
  const [obligationError, setObligationError] = useState("");
  const [editingObligationId, setEditingObligationId] = useState<number | null>(null);
  const [salaryInput, setSalaryInput] = useState("");
  const [savingSalary, setSavingSalary] = useState(false);
  const [payCycles, setPayCycles] = useState<PayCycle[]>([]);
  const [payCycleForm, setPayCycleForm] = useState(initialPayCycle);
  const [savingPayCycle, setSavingPayCycle] = useState(false);
  const [payCycleError, setPayCycleError] = useState("");

  const [futureEntries, setFutureEntries] = useState<FutureEntry[]>([]);

  const [futureForm, setFutureForm] = useState<FutureEntryFormState>(initialFutureEntry);

  const [editingFutureId, setEditingFutureId] = useState<number | null>(null);

  const [savingFuture, setSavingFuture] = useState(false);

  const [futureError, setFutureError] = useState("");
  const [calendarRange, setCalendarRange] = useState(getCurrentMonthRange);
  const isAuthenticated = useMemo(() => Boolean(token), [token]);
  useEffect(() => {
    if (!token) return;
    loadProfileFromStorage();
    loadProfile();
    loadExpenses();
    loadObligations();
    loadPayCycles();
    loadFutureEntries();
  }, [token]);
  function loadProfileFromStorage() {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.warn("Unable to read stored user", error);
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
  async function loadExpenses() {
    if (!token) return;
    setExpensesError("");
    try {
      const items = await fetchExpenses(token);
      setExpenses(items);
    } catch (error) {
      console.error(error);
      setExpensesError("Não foi possível carregar as despesas agora.");
    }
  }
  async function loadObligations() {
    if (!token) return;
    setObligationError("");
    try {
      const items = await fetchObligations(token);
      setObligations(items);
    } catch (error) {
      console.error(error);
      setObligationError("Não foi possível carregar as obrigações agora.");
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
  async function loadFutureEntries() {

    if (!token) return;

    setFutureError("");

    try {

      const items = await fetchFutureEntries(token);

      setFutureEntries(items);

    } catch (error) {

      console.error(error);

      setFutureError("Não foi possível carregar lançamentos futuros.");

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
  async function handleExpenseSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return;
    setSavingExpense(true);
    setExpensesError("");
    try {
      const payload = {
        description: expenseForm.description.trim(),
        amount: Number(expenseForm.amount),
        category: expenseForm.category.trim() || undefined,
        date: expenseForm.date ? expenseForm.date : undefined,
        payCycleId: expenseForm.payCycleId ? Number(expenseForm.payCycleId) : null,
      };
      if (!payload.description || Number.isNaN(payload.amount)) {
        setExpensesError("Descrição e valor são obrigatórios.");
        setSavingExpense(false);
        return;
      }
      if (editingId) {
        const updated = await updateExpense(token, editingId, payload);
        setExpenses((prev) => prev.map((exp) => (exp.id === updated.id ? updated : exp)));
      } else {
        const created = await createExpense(token, payload);
        setExpenses((prev) => [created, ...prev]);
      }
      setExpenseForm(initialExpense);
      setEditingId(null);
    } catch (error: any) {
      const message = error?.message || "Erro ao salvar despesa";
      setExpensesError(message);
    } finally {
      setSavingExpense(false);
    }
  }
  async function handleDelete(id: number) {
    if (!token) return;
    const confirmed = confirm("Deseja excluir esta despesa?");
    if (!confirmed) return;
    try {
      await deleteExpense(token, id);
      setExpenses((prev) => prev.filter((exp) => exp.id !== id));
    } catch (error: any) {
      const message = error?.message || "Erro ao excluir despesa";
      setExpensesError(message);
    }
  }
  function handleEdit(expense: Expense) {
    setExpenseForm({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category || "",
      date: expense.date ? expense.date.slice(0, 10) : "",
      payCycleId: expense.payCycleId ? expense.payCycleId.toString() : "",
    });
    setEditingId(expense.id);
  }
  function handleLogout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setExpenses([]);
    setObligations([]);
    setPayCycles([]);
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
      const created = await createPayCycle(token, { name: payCycleForm.name, payDay: day });
      setPayCycles((prev) => [...prev, created].sort((a, b) => a.payDay - b.payDay));
      setPayCycleForm(initialPayCycle);
    } catch (error: any) {
      const message = error?.message || "Erro ao criar ciclo";
      setPayCycleError(message);
    } finally {
      setSavingPayCycle(false);
    }
  }
  async function handleDeletePayCycle(id: number) {
    if (!token) return;
    const confirmed = confirm("Excluir ciclo de pagamento? Itens associados perderão a vinculação.");
    if (!confirmed) return;
    try {
      await deletePayCycle(token, id);
      setPayCycles((prev) => prev.filter((c) => c.id !== id));
      setObligations((prev) => prev.map((o) => (o.payCycleId === id ? { ...o, payCycleId: null } : o)));
      setExpenses((prev) => prev.map((e) => (e.payCycleId === id ? { ...e, payCycleId: null } : e)));
    } catch (error: any) {
      const message = error?.message || "Erro ao excluir ciclo";
      setPayCycleError(message);
    }
  }
  async function handleSalarySave(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return;
    const parsed = parseFloat(salaryInput);
    if (Number.isNaN(parsed) || parsed < 0) {
      setObligationError("Salário inválido");
      return;
    }
    setSavingSalary(true);
    try {
      const updated = await updateSalary(token, parsed);
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
    } catch (error) {
      console.error(error);
      setObligationError("Erro ao salvar salário");
    } finally {
      setSavingSalary(false);
    }
  }
  async function handleObligationSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return;
    setSavingObligation(true);
    setObligationError("");
    const payload = {
      title: obligationForm.title.trim(),
      amount: Number(obligationForm.amount),
      category: obligationForm.category.trim() || undefined,
      dueDay: Number(obligationForm.dueDay),
      payCycleId: obligationForm.payCycleId ? Number(obligationForm.payCycleId) : null,
    };
    if (!payload.title || Number.isNaN(payload.amount) || Number.isNaN(payload.dueDay)) {
      setObligationError("Preencha título, valor e dia.");
      setSavingObligation(false);
      return;
    }
    try {
      if (editingObligationId) {
        const updated = await updateObligation(token, editingObligationId, payload);
        setObligations((prev) => prev.map((ob) => (ob.id === updated.id ? updated : ob)));
      } else {
        const created = await createObligation(token, payload);
        setObligations((prev) => [...prev, created].sort((a, b) => a.dueDay - b.dueDay));
      }
      setObligationForm(initialObligation);
      setEditingObligationId(null);
    } catch (error: any) {
      const message = error?.message || "Erro ao salvar obrigação";
      setObligationError(message);
    } finally {
      setSavingObligation(false);
    }
  }
  async function handleDeleteObligation(id: number) {
    if (!token) return;
    const confirmed = confirm("Deseja excluir esta obrigação fixa?");
    if (!confirmed) return;
    try {
      await deleteObligation(token, id);
      setObligations((prev) => prev.filter((ob) => ob.id !== id));
    } catch (error: any) {
      const message = error?.message || "Erro ao excluir obrigação";
      setObligationError(message);
    }
  }
  function handleEditObligation(obligation: Obligation) {
    setObligationForm({
      title: obligation.title,
      amount: obligation.amount.toString(),
      category: obligation.category || "",
      dueDay: obligation.dueDay.toString(),
      payCycleId: obligation.payCycleId ? obligation.payCycleId.toString() : "",
    });
    setEditingObligationId(obligation.id);
  }
  function handleFutureEdit(entry: FutureEntry) {

    setFutureForm({

      title: entry.title,

      amount: entry.amount.toString(),

      category: entry.category || "",

      dueDate: entry.dueDate.slice(0, 10),

      type: entry.type === "income" ? "income" : "expense",

    });

    setEditingFutureId(entry.id);

  }



  async function handleFutureSubmit(event: React.FormEvent) {

    event.preventDefault();

    if (!token) return;

    setSavingFuture(true);

    setFutureError("");



    const payload = {

      title: futureForm.title.trim(),

      amount: Number(futureForm.amount),

      category: futureForm.category.trim() || undefined,

      dueDate: futureForm.dueDate,

      type: futureForm.type,

    };



    if (!payload.title || Number.isNaN(payload.amount) || !payload.dueDate) {

      setFutureError("Preencha título, valor e data.");

      setSavingFuture(false);

      return;

    }



    try {

      if (editingFutureId) {

        const updated = await updateFutureEntry(token, editingFutureId, payload);

        setFutureEntries((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));

      } else {

        const created = await createFutureEntry(token, payload);

        setFutureEntries((prev) => [...prev, created].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));

      }

      setFutureForm(initialFutureEntry);

      setEditingFutureId(null);

    } catch (error: any) {

      const message = error?.message || "Erro ao salvar lançamento futuro";

      setFutureError(message);

    } finally {

      setSavingFuture(false);

    }

  }



  async function handleDeleteFuture(id: number) {

    if (!token) return;

    const confirmed = confirm("Deseja excluir este lançamento futuro?");

    if (!confirmed) return;



    try {

      await deleteFutureEntry(token, id);

      setFutureEntries((prev) => prev.filter((item) => item.id !== id));

    } catch (error: any) {

      const message = error?.message || "Erro ao excluir lançamento futuro";

      setFutureError(message);

    }

  }



  const salary = user?.salary ?? 0;
  const totalObligations = obligations.reduce((sum, ob) => sum + ob.amount, 0);

  const totalFutureExpenses = futureEntries.filter((f) => f.type === "expense").reduce((sum, f) => sum + f.amount, 0);

  const totalFutureIncomes = futureEntries.filter((f) => f.type === "income").reduce((sum, f) => sum + f.amount, 0);


  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remaining = salary - totalObligations - totalExpenses;

  const projectedRemaining = remaining - totalFutureExpenses + totalFutureIncomes;
  const futureSummary = { totalExpenses: totalFutureExpenses, totalIncomes: totalFutureIncomes, net: projectedRemaining };
  const totalUsed = totalObligations + totalExpenses;
  const deficit = Math.max(0, totalUsed - salary);
  const fixedPercent = salary > 0 ? Math.min(100, (totalObligations / salary) * 100) : 0;
  const variablePercent = salary > 0 ? Math.min(100 - fixedPercent, (totalExpenses / salary) * 100) : 0;
  const remainingPercent = salary > 0 ? Math.max(0, 100 - fixedPercent - variablePercent) : 0;

  const calendarData = useMemo(() => {
    if (!calendarRange.start || !calendarRange.end) return { days: [], total: 0, average: 0, highestDay: null as any };
    const startDate = new Date(calendarRange.start);
    const endDate = new Date(calendarRange.end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) {
      return { days: [], total: 0, average: 0, highestDay: null as any };
    }

    const itemsByDay: Record<string, { title: string; amount: number; category?: string | null; type: string }[]> = {};

    const addItem = (dateStr: string, entry: { title: string; amount: number; category?: string | null; type: string }) => {
      if (!itemsByDay[dateStr]) itemsByDay[dateStr] = [];
      itemsByDay[dateStr].push(entry);
    };

    expenses.forEach((exp) => {
      if (!exp.date) return;
      const dateOnly = exp.date.slice(0, 10);
      const current = new Date(dateOnly);
      if (current >= startDate && current <= endDate) {
        addItem(dateOnly, { title: exp.description, amount: exp.amount, category: exp.category, type: "Despesa" });
      }
    });

    futureEntries
      .filter((f) => f.type === "expense")
      .forEach((f) => {
        const dateOnly = f.dueDate.slice(0, 10);
        const current = new Date(dateOnly);
        if (current >= startDate && current <= endDate) {
          addItem(dateOnly, { title: f.title, amount: f.amount, category: f.category, type: "Futuro" });
        }
      });

    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const day = cursor.getDate();
      const dateOnly = cursor.toISOString().slice(0, 10);
      obligations.forEach((ob) => {
        if (ob.dueDay === day) {
          addItem(dateOnly, { title: ob.title, amount: ob.amount, category: ob.category, type: "Obrigação" });
        }
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    const days = [];
    const iter = new Date(startDate);
    while (iter <= endDate) {
      const dateOnly = iter.toISOString().slice(0, 10);
      const dayItems = itemsByDay[dateOnly] || [];
      const total = dayItems.reduce((sum, item) => sum + item.amount, 0);
      days.push({ date: dateOnly, total, items: dayItems });
      iter.setDate(iter.getDate() + 1);
    }

    const total = days.reduce((sum, d) => sum + d.total, 0);
    const average = days.length ? total / days.length : 0;
    const highestDay = days.reduce((max, d) => (max && max.total >= d.total ? max : d), days[0] || null);

    return { days, total, average, highestDay };
  }, [calendarRange, expenses, obligations, futureEntries]);



  const totalsByCycle = payCycles.map((cycle) => {
    const fixed = obligations
      .filter((o) => o.payCycleId === cycle.id)
      .reduce((sum, o) => sum + o.amount, 0);
    const variable = expenses.filter((e) => e.payCycleId === cycle.id).reduce((sum, e) => sum + e.amount, 0);
    return { cycle, fixed, variable, total: fixed + variable };
  });
  return (
    <div className="max-w-7xl mx-auto px-4 pb-10 pt-8 space-y-6">
      <div className="glass p-6 md:p-8 space-y-3">
        <p className="uppercase tracking-[0.08em] text-emerald-300 text-xs">Controle de Gastos</p>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-50">
          Veja para onde seu dinheiro vai e planeje o mês sem sustos.
        </h1>
        <p className="text-slate-300 max-w-3xl">
          Cadastre suas despesas, obrigações fixas e defina seu salário para ter clareza do que sobra.
        </p>
      </div>
      {!isAuthenticated ? (
        <section className="glass p-6 space-y-4 max-w-3xl mx-auto">
          <div className="grid grid-cols-2 border border-white/10 rounded-xl overflow-hidden">
            <button
              className={`py-3 text-sm font-semibold ${mode === "login" ? "bg-emerald-300 text-slate-900" : "text-slate-100"}`}
              onClick={() => {
                setMode("login");
                setAuthError("");
              }}
            >
              Entrar
            </button>
            <button
              className={`py-3 text-sm font-semibold ${mode === "register" ? "bg-emerald-300 text-slate-900" : "text-slate-100"}`}
              onClick={() => {
                setMode("register");
                setAuthError("");
              }}
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
                  placeholder="Seu nome"
                  required
                  className="input"
                />
              </label>
            )}
            <label className="space-y-1 text-sm text-slate-200">
              E-mail
              <input
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                placeholder="voce@email.com"
                required
                className="input"
              />
            </label>
            <label className="space-y-1 text-sm text-slate-200">
              Senha
              <input
                type="password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                placeholder="******"
                required
                className="input"
              />
            </label>
            {authError && <p className="text-rose-400 text-sm">{authError}</p>}
            <button type="submit" className="button-primary" disabled={loadingAuth}>
              {loadingAuth ? "Carregando..." : mode === "login" ? "Entrar" : "Registrar"}
            </button>
          </form>
        </section>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <section className="glass p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="uppercase tracking-[0.08em] text-emerald-300 text-xs">Bem-vindo(a)</p>
                  <h2 className="text-xl font-semibold text-slate-50">{user?.name}</h2>
                  <p className="text-slate-300">{user?.email}</p>
                </div>
                <button className="button-ghost" onClick={handleLogout}>
                  Sair
                </button>
              </div>
            </section>
            <section className="glass p-5 space-y-3">
              <h3 className="text-lg font-semibold text-slate-50">Salário e meta do mês</h3>
              <form onSubmit={handleSalarySave} className="space-y-2">
                <label className="space-y-1 text-sm text-slate-200">
                  Salário líquido (R$)
                  <input
                    type="number"
                    step="0.01"
                    value={salaryInput}
                    onChange={(e) => setSalaryInput(e.target.value)}
                    placeholder="Ex: 4500"
                    className="input"
                  />
                </label>
                <button type="submit" className="button-primary" disabled={savingSalary}>
                  {savingSalary ? "Salvando..." : "Salvar salário"}
                </button>
              </form>
              <div className="space-y-3">
                {salary > 0 ? (
                  <>
                    <div className="space-y-1 text-sm text-slate-200">
                      <p>Obrigações: R$ {totalObligations.toFixed(2)}</p>
                      <p>Variáveis: R$ {totalExpenses.toFixed(2)}</p>
                      <p>Sobra: R$ {remaining.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>Distribuição do salário</span>
                        {deficit > 0 ? (
                          <span className="text-rose-300">Déficit: R$ {deficit.toFixed(2)}</span>
                        ) : (
                          <span className="text-emerald-300">Sobra: R$ {remaining.toFixed(2)}</span>
                        )}
                      </div>
                      <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden flex">
                        <div className="h-full bg-rose-400" style={{ width: `${fixedPercent}%` }} />
                        <div className="h-full bg-sky-400" style={{ width: `${variablePercent}%` }} />
                        <div className="h-full bg-emerald-300" style={{ width: `${remainingPercent}%` }} />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Fixas: R$ {totalObligations.toFixed(2)}</span>
                        <span>Variáveis: R$ {totalExpenses.toFixed(2)}</span>
                        <span>Sobra: R$ {Math.max(0, remaining).toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-slate-300 text-sm">Defina seu salário para ver a divisão do mês.</p>
                )}
              </div>
            </section>
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
                    onClick={() => setPayCycleForm({ name: "Salário 25", payDay: "25" })}
                  >
                    Usar dia 25
                  </button>
                  <button
                    type="button"
                    className="button-ghost"
                    onClick={() => setPayCycleForm({ name: "Salário 1-10", payDay: "5" })}
                  >
                    Usar dia 1-10
                  </button>
                </div>
              </div>
              <form onSubmit={handlePayCycleSubmit} className="space-y-2">
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
                {payCycleError && <p className="text-rose-400 text-sm">{payCycleError}</p>}
                <button type="submit" className="button-primary" disabled={savingPayCycle}>
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
                      </div>
                      <div className="row">
                        <button className="danger" onClick={() => handleDeletePayCycle(cycle.id)}>
                          Excluir
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
          {payCycles.length > 0 && (
            <section className="glass p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="uppercase tracking-[0.08em] text-emerald-300 text-xs">Alocação por salário</p>
                  <h3 className="text-lg font-semibold text-slate-50">Quanto cada ciclo já pagou</h3>
                </div>
              </div>
              <ul className="list">
                {totalsByCycle.map(({ cycle, fixed, variable, total }) => (
                  <li key={cycle.id}>
                    <div>
                      <p className="description">
                        {cycle.name} <span className="muted">- dia {cycle.payDay}</span>
                      </p>
                      <p className="muted">
                        Fixas: R$ {fixed.toFixed(2)} - Variáveis: R$ {variable.toFixed(2)} - Total: R$ {total.toFixed(2)}
                      </p>
                    </div>
                    {salary > 0 && (
                      <div>
                        <p className="muted">Cobertura: {Math.min(100, (total / salary) * 100).toFixed(0)}%</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <FutureEntries
            entries={futureEntries}
            form={futureForm}
            editingId={editingFutureId}
            error={futureError}
            saving={savingFuture}
            onChange={setFutureForm}
            onSubmit={handleFutureSubmit}
            onEdit={handleFutureEdit}
            onCancelEdit={() => {
              setFutureForm(initialFutureEntry);
              setEditingFutureId(null);
              setFutureError("");
            }}
            onDelete={handleDeleteFuture}
            summary={futureSummary}
          />
          <CalendarPlanner
            start={calendarRange.start}
            end={calendarRange.end}
            onChange={setCalendarRange}
            days={calendarData.days}
            summary={{ total: calendarData.total, average: calendarData.average, highestDay: calendarData.highestDay }}
          />
          <div className="grid gap-4 xl:grid-cols-3">
            <section className="glass p-5 space-y-3">
              <h3 className="text-lg font-semibold text-slate-50">
                {editingObligationId ? "Editar obrigação fixa" : "Adicionar obrigação fixa"}
              </h3>
              <form onSubmit={handleObligationSubmit} className="space-y-2">
                <label className="space-y-1 text-sm text-slate-200">
                  Nome
                  <input
                    type="text"
                    value={obligationForm.title}
                    onChange={(e) => setObligationForm({ ...obligationForm, title: e.target.value })}
                    placeholder="Aluguel, Internet, Escola..."
                    required
                    className="input"
                  />
                </label>
                <div className="grid gap-2 md:grid-cols-2">
                  <label className="space-y-1 text-sm text-slate-200">
                    Valor (R$)
                    <input
                      type="number"
                      step="0.01"
                      value={obligationForm.amount}
                      onChange={(e) => setObligationForm({ ...obligationForm, amount: e.target.value })}
                      required
                      className="input"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-200">
                    Categoria
                    <input
                      type="text"
                      value={obligationForm.category}
                      onChange={(e) => setObligationForm({ ...obligationForm, category: e.target.value })}
                      list="obligation-categories"
                      placeholder="Moradia, Contas..."
                      className="input"
                    />
                    <datalist id="obligation-categories">
                      {OBLIGATION_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </label>
                  <label className="space-y-1 text-sm text-slate-200">
                    Salário / Ciclo
                    <select
                      value={obligationForm.payCycleId}
                      onChange={(e) => setObligationForm({ ...obligationForm, payCycleId: e.target.value })}
                      className="input"
                    >
                      <option value="">Sem ciclo</option>
                      {payCycles.map((cycle) => (
                        <option key={cycle.id} value={cycle.id}>
                          {cycle.name} (dia {cycle.payDay})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm text-slate-200">
                    Dia de vencimento
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={obligationForm.dueDay}
                      onChange={(e) => setObligationForm({ ...obligationForm, dueDay: e.target.value })}
                      required
                      className="input"
                    />
                  </label>
                </div>
                {obligationError && <p className="text-rose-400 text-sm">{obligationError}</p>}
                <div className="flex justify-end gap-2">
                  {editingObligationId && (
                    <button
                      type="button"
                      className="button-ghost"
                      onClick={() => {
                        setObligationForm(initialObligation);
                        setEditingObligationId(null);
                      }}
                    >
                      Cancelar
                    </button>
                  )}
                  <button type="submit" className="button-primary" disabled={savingObligation}>
                    {savingObligation ? "Salvando..." : editingObligationId ? "Atualizar" : "Adicionar"}
                  </button>
                </div>
              </form>
            </section>
            <section className="glass p-5 space-y-3">
              <h3 className="text-lg font-semibold text-slate-50">Visão rápida</h3>
              <p className="text-slate-300 text-sm">Distribuição do mês entre fixas, variáveis e sobra.</p>
              <div className="space-y-1 text-sm text-slate-200">
                <p>Fixas: R$ {totalObligations.toFixed(2)}</p>
                <p>Variáveis: R$ {totalExpenses.toFixed(2)}</p>
                <p>Sobra: R$ {remaining.toFixed(2)}</p>
              </div>
              {payCycles.length > 0 && (
                <ul className="space-y-2">
                  {totalsByCycle.map(({ cycle, total }) => (
                    <li key={cycle.id} className="border border-white/10 rounded-lg px-3 py-2 bg-white/5">
                      <p className="description">{cycle.name}</p>
                      <p className="muted">Dia {cycle.payDay} - Alocado: R$ {total.toFixed(2)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="glass p-5 space-y-3">
              <h3 className="text-lg font-semibold text-slate-50">
                {editingId ? "Editar despesa" : "Adicionar despesa variável"}
              </h3>
              <form onSubmit={handleExpenseSubmit} className="space-y-2">
                <label className="space-y-1 text-sm text-slate-200">
                  Descrição
                  <input
                    type="text"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    placeholder="Ex: Almoço, Uber..."
                    required
                    className="input"
                  />
                </label>
                <div className="grid gap-2 md:grid-cols-2">
                  <label className="space-y-1 text-sm text-slate-200">
                    Valor (R$)
                    <input
                      type="number"
                      step="0.01"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      placeholder="0,00"
                      required
                      className="input"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-200">
                    Categoria
                    <input
                      type="text"
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                      list="expense-categories"
                      placeholder="Transporte, Lazer..."
                      className="input"
                    />
                    <datalist id="expense-categories">
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </label>
                  <label className="space-y-1 text-sm text-slate-200">
                    Salário / Ciclo
                    <select
                      value={expenseForm.payCycleId}
                      onChange={(e) => setExpenseForm({ ...expenseForm, payCycleId: e.target.value })}
                      className="input"
                    >
                      <option value="">Sem ciclo</option>
                      {payCycles.map((cycle) => (
                        <option key={cycle.id} value={cycle.id}>
                          {cycle.name} (dia {cycle.payDay})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm text-slate-200">
                    Data
                    <input
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                      className="input"
                    />
                  </label>
                </div>
                {expensesError && <p className="text-rose-400 text-sm">{expensesError}</p>}
                <div className="flex justify-end gap-2">
                  {editingId && (
                    <button
                      type="button"
                      className="button-ghost"
                      onClick={() => {
                        setExpenseForm(initialExpense);
                        setEditingId(null);
                      }}
                    >
                      Cancelar
                    </button>
                  )}
                  <button type="submit" className="button-primary" disabled={savingExpense}>
                    {savingExpense ? "Salvando..." : editingId ? "Atualizar" : "Adicionar"}
                  </button>
                </div>
              </form>
            </section>
          </div>
          <section className="glass p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="uppercase tracking-[0.08em] text-emerald-300 text-xs">Obrigações fixas</p>
                <h3 className="text-lg font-semibold text-slate-50">Resumo do mês</h3>
              </div>
              <button className="button-ghost" onClick={loadObligations}>
                Atualizar
              </button>
            </div>
            {obligations.length === 0 ? (
              <p className="text-slate-300 text-sm">Nenhuma obrigação cadastrada ainda.</p>
            ) : (
              <ul className="list">
                {obligations.map((obligation) => (
                  <li key={obligation.id}>
                    <div>
                      <p className="description">
                        {obligation.title} <span className="muted">- dia {obligation.dueDay}</span>
                      </p>
                      <p className="muted">
                        R$ {obligation.amount.toFixed(2)} {obligation.category && ` - ${obligation.category}`}
                      </p>
                    </div>
                    <div className="row">
                      <button className="button-ghost" onClick={() => handleEditObligation(obligation)}>
                        Editar
                      </button>
                      <button className="danger" onClick={() => handleDeleteObligation(obligation.id)}>
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
                <p className="uppercase tracking-[0.08em] text-emerald-300 text-xs">Despesas variáveis</p>
                <h3 className="text-lg font-semibold text-slate-50">Controle rápido</h3>
              </div>
              <button className="button-ghost" onClick={loadExpenses}>
                Atualizar
              </button>
            </div>
            {expenses.length === 0 ? (
              <p className="text-slate-300 text-sm">Nenhuma despesa cadastrada ainda.</p>
            ) : (
              <ul className="list">
                {expenses.map((expense) => (
                  <li key={expense.id}>
                    <div>
                      <p className="description">{expense.description}</p>
                      <p className="muted">
                        R$ {expense.amount.toFixed(2)} {expense.category && ` - ${expense.category}`} - {new Date(expense.date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="row">
                      <button className="button-ghost" onClick={() => handleEdit(expense)}>
                        Editar
                      </button>
                      <button className="danger" onClick={() => handleDelete(expense.id)}>
                        Excluir
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
