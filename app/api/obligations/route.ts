import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { formatObligation } from "@/lib/formatObligation";

export async function GET(req: NextRequest) {
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  try {
    const obligations = await prisma.obligation.findMany({
      where: { userId },
      orderBy: { dueDay: "asc" },
    });
    return NextResponse.json(obligations.map(formatObligation));
  } catch (error) {
    console.error("Erro ao buscar obrigações", error);
    return NextResponse.json({ message: "Erro interno ao listar obrigações" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  const { title, amount, category, dueDay, payCycleId } = await req.json();

  const parsedAmount = parseFloat(amount);
  const parsedDay = Number(dueDay);

  if (!title || Number.isNaN(parsedAmount) || Number.isNaN(parsedDay)) {
    return NextResponse.json({ message: "Preencha título, valor e dia." }, { status: 400 });
  }

  let cycleToSet: number | null = null;
  if (payCycleId !== undefined && payCycleId !== null && payCycleId !== "") {
    const parsedCycle = Number(payCycleId);
    if (Number.isNaN(parsedCycle)) {
      return NextResponse.json({ message: "Ciclo de pagamento inválido" }, { status: 400 });
    }
    const cycle = await prisma.payCycle.findUnique({ where: { id: parsedCycle } });
    if (!cycle || cycle.userId !== userId) {
      return NextResponse.json({ message: "Ciclo de pagamento não encontrado" }, { status: 404 });
    }
    cycleToSet = parsedCycle;
  }

  try {
    const created = await prisma.obligation.create({
      data: {
        title,
        amount: parsedAmount,
        category: category || null,
        dueDay: parsedDay,
        payCycleId: cycleToSet,
        userId,
      },
    });
    return NextResponse.json(formatObligation(created), { status: 201 });
  } catch (error) {
    console.error("Erro ao criar obrigação", error);
    return NextResponse.json({ message: "Erro interno ao criar obrigação" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const url = new URL(req.url);
  const idParam = url.searchParams.get("id");
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  const obligationId = Number(idParam);
  if (Number.isNaN(obligationId)) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  const { title, amount, category, dueDay, payCycleId } = await req.json();

  const data: any = {};

  if (title !== undefined) data.title = title;
  if (category !== undefined) data.category = category || null;
  if (amount !== undefined) {
    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount)) {
      return NextResponse.json({ message: "Valor inválido" }, { status: 400 });
    }
    data.amount = parsedAmount;
  }
  if (dueDay !== undefined) {
    const parsedDay = Number(dueDay);
    if (Number.isNaN(parsedDay)) {
      return NextResponse.json({ message: "Dia inválido" }, { status: 400 });
    }
    data.dueDay = parsedDay;
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
    const existing = await prisma.obligation.findUnique({ where: { id: obligationId } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ message: "Obrigação não encontrada" }, { status: 404 });
    }

    const updated = await prisma.obligation.update({ where: { id: obligationId }, data });
    return NextResponse.json(formatObligation(updated));
  } catch (error) {
    console.error("Erro ao atualizar obrigação", error);
    return NextResponse.json({ message: "Erro interno ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const idParam = url.searchParams.get("id");
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  const obligationId = Number(idParam);
  if (Number.isNaN(obligationId)) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  try {
    const existing = await prisma.obligation.findUnique({ where: { id: obligationId } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ message: "Obrigação não encontrada" }, { status: 404 });
    }
    await prisma.obligation.delete({ where: { id: obligationId } });
    return NextResponse.json({}, { status: 204 });
  } catch (error) {
    console.error("Erro ao excluir obrigação", error);
    return NextResponse.json({ message: "Erro interno ao excluir obrigação" }, { status: 500 });
  }
}
