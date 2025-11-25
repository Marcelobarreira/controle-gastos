import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { formatEnvelope } from "@/lib/formatEnvelope";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function DELETE(req: NextRequest, { params }: { params: { id: string; allocationId: string } }) {
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  const envelopeId = Number(params.id);
  const allocationId = Number(params.allocationId);
  if (Number.isNaN(envelopeId) || Number.isNaN(allocationId)) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  try {
    const envelope = await prisma.spendingEnvelope.findFirst({ where: { id: envelopeId, userId } });
    if (!envelope) return NextResponse.json({ message: "Envelope não encontrado" }, { status: 404 });

    await prisma.spendingAllocation.deleteMany({ where: { id: allocationId, envelopeId } });

    const updated = await prisma.spendingEnvelope.findFirst({
      where: { id: envelopeId, userId },
      include: { allocations: { orderBy: { date: "desc" } } },
    });
    if (!updated) return NextResponse.json({ message: "Envelope não encontrado" }, { status: 404 });
    return NextResponse.json(formatEnvelope(updated));
  } catch (error) {
    console.error("Erro ao excluir gasto do envelope", error);
    return NextResponse.json({ message: "Erro interno ao excluir gasto" }, { status: 500 });
  }
}
