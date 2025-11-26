import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  const incomeId = Number(params.id);
  if (Number.isNaN(incomeId)) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  try {
    const existing = await prisma.extraIncome.findUnique({ where: { id: incomeId } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ message: "Renda extra não encontrada" }, { status: 404 });
    }
    await prisma.extraIncome.delete({ where: { id: incomeId } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Erro ao excluir renda extra", error);
    return NextResponse.json({ message: "Erro interno ao excluir renda extra" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  const incomeId = Number(params.id);
  if (Number.isNaN(incomeId)) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  const { title, amount, date, payCycleId } = await req.json();
  const data: any = {};

  if (title !== undefined) data.title = title;
  if (amount !== undefined) {
    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
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
        return NextResponse.json({ message: "Ciclo inválido" }, { status: 400 });
      }
      const cycle = await prisma.payCycle.findUnique({ where: { id: parsedCycle } });
      if (!cycle || cycle.userId !== userId) {
        return NextResponse.json({ message: "Ciclo não encontrado" }, { status: 404 });
      }
      data.payCycleId = parsedCycle;
    }
  }

  try {
    const existing = await prisma.extraIncome.findUnique({ where: { id: incomeId } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ message: "Renda extra não encontrada" }, { status: 404 });
    }
    const updated = await prisma.extraIncome.update({ where: { id: incomeId }, data });
    return NextResponse.json({
      ...updated,
      amount:
        updated.amount && typeof (updated.amount as any).toNumber === "function"
          ? // @ts-ignore
            (updated.amount as any).toNumber()
          : Number(updated.amount),
    });
  } catch (error) {
    console.error("Erro ao atualizar renda extra", error);
    return NextResponse.json({ message: "Erro interno ao atualizar renda extra" }, { status: 500 });
  }
}
