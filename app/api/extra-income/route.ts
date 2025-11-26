import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const formatExtra = (item: any) => ({
  id: item.id,
  title: item.title,
  amount:
    item.amount && typeof item.amount.toNumber === "function" ? item.amount.toNumber() : Number(item.amount),
  date: item.date,
  userId: item.userId,
  payCycleId: item.payCycleId ?? null,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

export async function GET(req: NextRequest) {
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  const payCycleParam = new URL(req.url).searchParams.get("payCycleId");
  const where: any = { userId };

  if (payCycleParam !== null) {
    if (payCycleParam === "" || payCycleParam === "all") {
      // sem filtro específico
    } else if (payCycleParam === "null") {
      where.payCycleId = null;
    } else {
      const parsed = Number(payCycleParam);
      if (!Number.isNaN(parsed)) {
        where.payCycleId = parsed;
      }
    }
  }

  try {
    const items = await prisma.extraIncome.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(items.map(formatExtra));
  } catch (error) {
    console.error("Erro ao listar rendas extras", error);
    return NextResponse.json({ message: "Erro interno ao listar rendas extras" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  const { title, amount, date, payCycleId } = await req.json();
  const parsedAmount = parseFloat(amount);
  if (!title || Number.isNaN(parsedAmount) || parsedAmount < 0) {
    return NextResponse.json({ message: "Título e valor válido são obrigatórios" }, { status: 400 });
  }

  let cycleToSet: number | null = null;
  if (payCycleId !== undefined && payCycleId !== null && payCycleId !== "") {
    const parsedCycle = Number(payCycleId);
    if (Number.isNaN(parsedCycle)) {
      return NextResponse.json({ message: "Ciclo inválido" }, { status: 400 });
    }
    const cycle = await prisma.payCycle.findUnique({ where: { id: parsedCycle } });
    if (!cycle || cycle.userId !== userId) {
      return NextResponse.json({ message: "Ciclo não encontrado" }, { status: 404 });
    }
    cycleToSet = parsedCycle;
  }

  const dateValue = date ? new Date(date) : new Date();
  if (Number.isNaN(dateValue.getTime())) {
    return NextResponse.json({ message: "Data inválida" }, { status: 400 });
  }

  try {
    const created = await prisma.extraIncome.create({
      data: { title, amount: parsedAmount, date: dateValue, userId, payCycleId: cycleToSet },
    });
    return NextResponse.json(formatExtra(created), { status: 201 });
  } catch (error) {
    console.error("Erro ao criar renda extra", error);
    return NextResponse.json({ message: "Erro interno ao criar renda extra" }, { status: 500 });
  }
}
