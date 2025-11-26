import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { formatExpense } from "@/lib/formatExpense";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  const expenseId = Number(params.id);
  if (Number.isNaN(expenseId)) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  const { description, amount, category, date, payCycleId } = await req.json();
  const data: any = {};

  if (description !== undefined) data.description = description;
  if (category !== undefined) data.category = category || null;
  if (amount !== undefined) {
    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount)) {
      return NextResponse.json({ message: "Valor inválido" }, { status: 400 });
    }
    data.amount = parsedAmount;
  }
  if (date !== undefined) {
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ message: "Data inválida" }, { status: 400 });
    }
    data.date = parsedDate;
  }

  if (payCycleId !== undefined) {
    if (payCycleId === null || payCycleId === "") {
      data.payCycleId = null;
    } else {
      const parsedCycle = Number(payCycleId);
      if (Number.isNaN(parsedCycle)) {
        return NextResponse.json({ message: "Ciclo de pagamento inválido" }, { status: 400 });
      }
      const cycle = await prisma.payCycle.findUnique({ where: { id: parsedCycle } });
      if (!cycle || cycle.userId !== userId) {
        return NextResponse.json({ message: "Ciclo de pagamento não encontrado" }, { status: 404 });
      }
      data.payCycleId = parsedCycle;
    }
  }

  try {
    const existing = await prisma.expense.findUnique({ where: { id: expenseId } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ message: "Despesa não encontrada" }, { status: 404 });
    }

    const updated = await prisma.expense.update({ where: { id: expenseId }, data });
    return NextResponse.json(formatExpense(updated));
  } catch (error) {
    console.error("Erro ao atualizar despesa", error);
    return NextResponse.json({ message: "Erro interno ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  const expenseId = Number(params.id);
  if (Number.isNaN(expenseId)) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  try {
    const existing = await prisma.expense.findUnique({ where: { id: expenseId } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ message: "Despesa não encontrada" }, { status: 404 });
    }

    await prisma.expense.delete({ where: { id: expenseId } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Erro ao excluir despesa", error);
    return NextResponse.json({ message: "Erro interno ao excluir despesa" }, { status: 500 });
  }
}
