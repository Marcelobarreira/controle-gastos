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

  try {
    const items = await prisma.spendingEnvelope.findMany({
      where: { userId },
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

  const { title, budget } = await req.json();
  const parsedBudget = parseFloat(budget);

  if (!title || Number.isNaN(parsedBudget) || parsedBudget < 0) {
    return NextResponse.json({ message: "Título e valor válido são obrigatórios" }, { status: 400 });
  }

  try {
    const created = await prisma.spendingEnvelope.create({
      data: { title, budget: parsedBudget, userId },
    });
    return NextResponse.json(formatEnvelope(created), { status: 201 });
  } catch (error) {
    console.error("Erro ao criar envelope", error);
    return NextResponse.json({ message: "Erro interno ao criar envelope" }, { status: 500 });
  }
}
