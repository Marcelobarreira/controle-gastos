import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { formatEnvelope } from "@/lib/formatEnvelope";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  const payCycleParam = new URL(req.url).searchParams.get("payCycleId");
  const payCycleId = payCycleParam ? Number(payCycleParam) : undefined;
  const where: any = { userId };
  if (payCycleParam !== null) {
    if (payCycleParam === "" || payCycleParam === "all") {
      where.payCycleId = null;
    } else if (!Number.isNaN(payCycleId)) {
      where.payCycleId = payCycleId;
    }
  }

  try {
    const items = await prisma.spendingEnvelope.findMany({
      where,
      include: { allocations: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items.map(formatEnvelope));
  } catch (error) {
    console.error("Erro ao listar envelopes", error);
    return NextResponse.json({ message: "Erro interno ao listar envelopes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  const { title, budget, payCycleId } = await req.json();
  const parsedBudget = parseFloat(budget);

  if (!title || Number.isNaN(parsedBudget) || parsedBudget < 0) {
    return NextResponse.json({ message: "Título e valor válido são obrigatórios" }, { status: 400 });
  }

  try {
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

    const created = await prisma.spendingEnvelope.create({
      data: { title, budget: parsedBudget, userId, payCycleId: cycleToSet },
    });
    return NextResponse.json(formatEnvelope(created), { status: 201 });
  } catch (error) {
    console.error("Erro ao criar envelope", error);
    return NextResponse.json({ message: "Erro interno ao criar envelope" }, { status: 500 });
  }
}
