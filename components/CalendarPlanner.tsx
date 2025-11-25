type CalendarItem = {
  title: string;
  amount: number;
  category?: string | null;
  type: string;
};

type CalendarDay = {
  date: string;
  total: number;
  items: CalendarItem[];
};

type Range = { start: string; end: string };

type Props = {
  start: string;
  end: string;
  onChange: (range: Range) => void;
  days: CalendarDay[];
  summary: {
    total: number;
    average: number;
    highestDay?: CalendarDay | null;
  };
};

export function CalendarPlanner({ start, end, onChange, days, summary }: Props) {
  return (
    <section className="glass p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="uppercase tracking-[0.08em] text-emerald-300 text-xs">Calendário</p>
          <h3 className="text-lg font-semibold text-slate-50">Linha do tempo do mês</h3>
          <p className="text-slate-300 text-sm">Selecione início e fim para ver os gastos por dia e o resumo do período.</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="space-y-1 text-sm text-slate-200">
          Data inicial
          <input
            type="date"
            value={start}
            onChange={(e) => onChange({ start: e.target.value, end })}
            className="input"
          />
        </label>
        <label className="space-y-1 text-sm text-slate-200">
          Data final
          <input
            type="date"
            value={end}
            onChange={(e) => onChange({ start, end: e.target.value })}
            className="input"
          />
        </label>
        <div className="grid grid-cols-3 gap-2 text-sm text-slate-200">
          <div className="glass p-3 rounded-xl border border-white/10 bg-white/5">
            <p className="text-xs text-slate-400">Total no período</p>
            <p className="text-lg font-semibold text-rose-300">R$ {summary.total.toFixed(2)}</p>
          </div>
          <div className="glass p-3 rounded-xl border border-white/10 bg-white/5">
            <p className="text-xs text-slate-400">Média por dia</p>
            <p className="text-lg font-semibold text-slate-50">R$ {summary.average.toFixed(2)}</p>
          </div>
          <div className="glass p-3 rounded-xl border border-white/10 bg-white/5">
            <p className="text-xs text-slate-400">Dia mais alto</p>
            <p className="text-lg font-semibold text-emerald-300">
              {summary.highestDay ? `R$ ${summary.highestDay.total.toFixed(2)}` : "—"}
            </p>
          </div>
        </div>
      </div>

      {!start || !end ? (
        <p className="text-slate-300 text-sm">Informe a data inicial e final para ver o calendário.</p>
      ) : days.length === 0 ? (
        <p className="text-slate-300 text-sm">Nenhum gasto registrado no período.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {days.map((day) => (
            <div key={day.date} className="relative glass p-3 rounded-xl border border-white/10 bg-white/5 group">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-50">
                  {new Date(day.date).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
                </p>
                <span className="text-xs text-emerald-300 font-semibold">R$ {day.total.toFixed(2)}</span>
              </div>
              <p className="text-xs text-slate-400">Passe o mouse para ver detalhes</p>
              <div className="absolute inset-0 bg-slate-900/90 rounded-xl p-3 hidden group-hover:flex flex-col gap-2 overflow-auto">
                <p className="text-xs text-slate-300">Gastos do dia</p>
                {day.items.length === 0 ? (
                  <p className="text-xs text-slate-400">Nenhum gasto</p>
                ) : (
                  <ul className="space-y-1 text-xs text-slate-200">
                    {day.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between gap-2">
                        <span className="truncate">
                          {item.title} {item.category ? `• ${item.category}` : ""} ({item.type})
                        </span>
                        <span className="text-rose-300 font-semibold">R$ {item.amount.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
