"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EnvelopeSeparator } from "@/components/EnvelopeSeparator";
import { fetchExtraIncome, fetchPayCycles, fetchProfile } from "@/lib/clientApi";
import type { ExtraIncome, PayCycle } from "@/lib/types";

const getInitialToken = () => (typeof window === "undefined" ? null : localStorage.getItem("token"));

export default function SeparadorPage() {
  const [token] = useState<string | null>(getInitialToken);
  const [salary, setSalary] = useState<number>(0);
  const [payCycles, setPayCycles] = useState<PayCycle[]>([]);
  const [extras, setExtras] = useState<ExtraIncome[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const profile = await fetchProfile(token);
        setSalary(Number(profile.salary ?? 0));
        const cycles = await fetchPayCycles(token);
        setPayCycles(cycles);
        const extraItems = await fetchExtraIncome(token);
        setExtras(extraItems);
      } catch (err: any) {
        setError(err?.message || "Erro ao carregar dados");
      }
    })();
  }, [token]);

  if (!token) {
    return (
      <div className="page space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="uppercase tracking-[0.08em] text-emerald-300 text-xs">Separador de gastos</p>
            <h1 className="text-2xl font-bold text-slate-50">Você precisa estar logado</h1>
            <p className="text-slate-300 text-sm">Faça login na página inicial para usar o separador.</p>
          </div>
          <Link href="/" className="button-ghost">
            Voltar
          </Link>
        </div>
      </div>
    );
  }

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

      {error && <p className="text-rose-400 text-sm">{error}</p>}

      <EnvelopeSeparator token={token} payCycles={payCycles} salary={salary} extras={extras} />
    </div>
  );
}
