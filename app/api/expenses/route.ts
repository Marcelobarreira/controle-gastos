import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { formatExpense } from "@/lib/formatExpense";

export async function GET(req: NextRequest) {
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  try {
    const expenses = await prisma.expense.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(expenses.map(formatExpense));
  } catch (error) {
    console.error("Erro ao buscar despesas", error);
    return NextResponse.json({ message: "Erro interno ao listar despesas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  const { description, amount, category, date, payCycleId } = await req.json();

  if (!description || amount === undefined || amount === null) {
    return NextResponse.json({ message: "Descrição e valor são obrigatórios" }, { status: 400 });
  }

  const parsedAmount = parseFloat(amount);
  if (Number.isNaN(parsedAmount)) {
    return NextResponse.json({ message: "Valor inválido" }, { status: 400 });
  }

  let parsedDate = new Date();
  if (date) {
    parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ message: "Data inválida" }, { status: 400 });
    }
  }

  try {
    let payCycleToSet: number | null = null;
    if (payCycleId !== undefined && payCycleId !== null && payCycleId !== "") {
      const parsedCycle = Number(payCycleId);
      if (Number.isNaN(parsedCycle)) {
        return NextResponse.json({ message: "Ciclo de pagamento inválido" }, { status: 400 });
      }
      const cycle = await prisma.payCycle.findUnique({ where: { id: parsedCycle } });
      if (!cycle || cycle.userId !== userId) {
        return NextResponse.json({ message: "Ciclo de pagamento não encontrado" }, { status: 404 });
      }
      payCycleToSet = parsedCycle;
    }

    const expense = await prisma.expense.create({
      data: {
        description,
        amount: parsedAmount,
        category: category || null,
        date: parsedDate,
        userId,
        payCycleId: payCycleToSet,
      },
    });

    return NextResponse.json(formatExpense(expense), { status: 201 });
  } catch (error) {
    console.error("Erro ao criar despesa", error);
    return NextResponse.json({ message: "Erro interno ao criar despesa" }, { status: 500 });
  }
}
