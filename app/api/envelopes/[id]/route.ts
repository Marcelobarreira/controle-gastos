import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { formatEnvelope } from "@/lib/formatEnvelope";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  const envelopeId = Number(params.id);
  if (Number.isNaN(envelopeId)) return NextResponse.json({ message: "ID inválido" }, { status: 400 });

  try {
    const envelope = await prisma.spendingEnvelope.findFirst({
      where: { id: envelopeId, userId },
      include: { allocations: { orderBy: { date: "desc" } } },
    });
    if (!envelope) return NextResponse.json({ message: "Envelope não encontrado" }, { status: 404 });
    return NextResponse.json(formatEnvelope(envelope));
  } catch (error) {
    console.error("Erro ao buscar envelope", error);
    return NextResponse.json({ message: "Erro interno ao buscar envelope" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  const envelopeId = Number(params.id);
  if (Number.isNaN(envelopeId)) return NextResponse.json({ message: "ID inválido" }, { status: 400 });

  const { title, budget } = await req.json();
  const data: any = {};
  if (title !== undefined) data.title = title;
  if (budget !== undefined) {
    const parsedBudget = parseFloat(budget);
    if (Number.isNaN(parsedBudget) || parsedBudget < 0) {
      return NextResponse.json({ message: "Valor inválido" }, { status: 400 });
    }
    data.budget = parsedBudget;
  }

  try {
    const existing = await prisma.spendingEnvelope.findFirst({ where: { id: envelopeId, userId } });
    if (!existing) return NextResponse.json({ message: "Envelope não encontrado" }, { status: 404 });

    const updated = await prisma.spendingEnvelope.update({ where: { id: envelopeId }, data });
    return NextResponse.json(formatEnvelope(updated));
  } catch (error) {
    console.error("Erro ao atualizar envelope", error);
    return NextResponse.json({ message: "Erro interno ao atualizar envelope" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  const envelopeId = Number(params.id);
  if (Number.isNaN(envelopeId)) return NextResponse.json({ message: "ID inválido" }, { status: 400 });

  try {
    const existing = await prisma.spendingEnvelope.findFirst({ where: { id: envelopeId, userId } });
    if (!existing) return NextResponse.json({ message: "Envelope não encontrado" }, { status: 404 });
    await prisma.spendingAllocation.deleteMany({ where: { envelopeId } });
    await prisma.spendingEnvelope.delete({ where: { id: envelopeId } });
    return NextResponse.json({}, { status: 204 });
  } catch (error) {
    console.error("Erro ao excluir envelope", error);
    return NextResponse.json({ message: "Erro interno ao excluir envelope" }, { status: 500 });
  }
}
