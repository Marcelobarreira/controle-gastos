import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  const cycleId = Number(params.id);
  if (Number.isNaN(cycleId)) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  try {
    const existing = await prisma.payCycle.findUnique({ where: { id: cycleId } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ message: "Ciclo de pagamento não encontrado" }, { status: 404 });
    }
    await prisma.payCycle.delete({ where: { id: cycleId } });
    return NextResponse.json({}, { status: 204 });
  } catch (error) {
    console.error("Erro ao excluir ciclo", error);
    return NextResponse.json({ message: "Erro ao excluir ciclo" }, { status: 500 });
  }
}
