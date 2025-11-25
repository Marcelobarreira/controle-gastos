import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { formatEnvelope } from "@/lib/formatEnvelope";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  const envelopeId = Number(params.id);
  if (Number.isNaN(envelopeId)) return NextResponse.json({ message: "ID inválido" }, { status: 400 });

  const { title, amount, date } = await req.json();
  const parsedAmount = parseFloat(amount);

  if (!title || Number.isNaN(parsedAmount)) {
    return NextResponse.json({ message: "Título e valor válidos são obrigatórios" }, { status: 400 });
  }

  let parsedDate = new Date();
  if (date) {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ message: "Data inválida" }, { status: 400 });
    }
    parsedDate = d;
  }

  try {
    const envelope = await prisma.spendingEnvelope.findFirst({ where: { id: envelopeId, userId } });
    if (!envelope) return NextResponse.json({ message: "Envelope não encontrado" }, { status: 404 });

    await prisma.spendingAllocation.create({
      data: {
        envelopeId,
        title,
        amount: parsedAmount,
        date: parsedDate,
      },
    });

    const updated = await prisma.spendingEnvelope.findFirst({
      where: { id: envelopeId, userId },
      include: { allocations: { orderBy: { date: "desc" } } },
    });
    if (!updated) return NextResponse.json({ message: "Envelope não encontrado" }, { status: 404 });
    return NextResponse.json(formatEnvelope(updated), { status: 201 });
  } catch (error) {
    console.error("Erro ao adicionar gasto no envelope", error);
    return NextResponse.json({ message: "Erro interno ao adicionar gasto" }, { status: 500 });
  }
}
