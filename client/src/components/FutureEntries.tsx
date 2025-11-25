import type React from "react";
import type { FutureEntry } from "../types";

type FutureEntryForm = {
  title: string;
  amount: string;
  category: string;
  dueDate: string;
  type: "expense" | "income";
};

type Props = {
  entries: FutureEntry[];
  form: FutureEntryForm;
  editingId: number | null;
  error: string;
  saving: boolean;
  onChange: (form: FutureEntryForm) => void;
  onSubmit: (event: React.FormEvent) => void;
  onEdit: (entry: FutureEntry) => void;
  onCancelEdit: () => void;
  onDelete: (id: number) => void;
  summary: { totalExpenses: number; totalIncomes: number; net: number };
};

export function FutureEntries({ entries, form, editingId, error, saving, onChange, onSubmit, onEdit, onCancelEdit, onDelete, summary }: Props) {
  return (
    <section className="glass p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="uppercase tracking-[0.08em] text-emerald-300 text-xs">Projeção</p>
          <h3 className="text-lg font-semibold text-slate-50">Lançamentos futuros</h3>
          <p className="text-slate-300 text-sm">Cadastre entradas e saídas previstas para enxergar o impacto no mês.</p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="space-y-2">
        <div className="grid gap-2 md:grid-cols-2">
          <label className="space-y-1 text-sm text-slate-200">
            Título
            <input
              type="text"
              value={form.title}
              onChange={(e) => onChange({ ...form, title: e.target.value })}
              placeholder="Ex: IPVA, Bônus, 13º"
              required
              className="input"
            />
          </label>
          <label className="space-y-1 text-sm text-slate-200">
            Valor (R$)
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => onChange({ ...form, amount: e.target.value })}
              required
              className="input"
            />
          </label>
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          <label className="space-y-1 text-sm text-slate-200">
            Categoria
            <input
              type="text"
              value={form.category}
              onChange={(e) => onChange({ ...form, category: e.target.value })}
              placeholder="Ex: imposto, extra..."
              className="input"
            />
          </label>
          <label className="space-y-1 text-sm text-slate-200">
            Data prevista
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => onChange({ ...form, dueDate: e.target.value })}
              required
              className="input"
            />
          </label>
          <label className="space-y-1 text-sm text-slate-200">
            Tipo
            <select
              value={form.type}
              onChange={(e) => onChange({ ...form, type: e.target.value as "expense" | "income" })}
              className="input"
            >
              <option value="expense">Saída</option>
              <option value="income">Entrada</option>
            </select>
          </label>
        </div>
        {error && <p className="text-rose-400 text-sm">{error}</p>}
        <div className="flex justify-end gap-2">
          {editingId && (
            <button type="button" className="button-ghost" onClick={onCancelEdit}>
              Cancelar
            </button>
          )}
          <button type="submit" className="button-primary" disabled={saving}>
            {saving ? "Salvando..." : editingId ? "Atualizar" : "Adicionar"}
          </button>
        </div>
      </form>

      <div className="glass p-4 rounded-xl border border-white/10 bg-white/5 grid gap-1 md:grid-cols-3">
        <div>
          <p className="text-xs text-slate-300 uppercase tracking-[0.08em]">Entradas previstas</p>
          <p className="text-lg font-semibold text-emerald-300">R$ {summary.totalIncomes.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-300 uppercase tracking-[0.08em]">Saídas previstas</p>
          <p className="text-lg font-semibold text-rose-300">R$ {summary.totalExpenses.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-300 uppercase tracking-[0.08em]">Saldo projetado</p>
          <p className="text-lg font-semibold text-slate-50">R$ {summary.net.toFixed(2)}</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="text-slate-300 text-sm">Nenhum lançamento futuro ainda.</p>
      ) : (
        <ul className="list">
          {entries.map((entry) => (
            <li key={entry.id}>
              <div>
                <p className="description">
                  {entry.title}{" "}
                  <span className="muted">
                    • {entry.type === "income" ? "Entrada" : "Saída"} • {new Date(entry.dueDate).toLocaleDateString("pt-BR")}
                  </span>
                </p>
                <p className="muted">
                  R$ {entry.amount.toFixed(2)} {entry.category && ` • ${entry.category}`}
                </p>
              </div>
              <div className="row">
                <button className="button-ghost" onClick={() => onEdit(entry)}>
                  Editar
                </button>
                <button className="danger" onClick={() => onDelete(entry.id)}>
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
