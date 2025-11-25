import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  try {
    const cycles = await prisma.payCycle.findMany({ where: { userId }, orderBy: { payDay: "asc" } });
    return NextResponse.json(cycles);
  } catch (error) {
    console.error("Erro ao listar ciclos", error);
    return NextResponse.json({ message: "Erro interno ao listar ciclos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  const { name, payDay } = await req.json();
  const day = Number(payDay);
  if (!name || Number.isNaN(day) || day < 1 || day > 31) {
    return NextResponse.json({ message: "Informe nome e dia entre 1 e 31" }, { status: 400 });
  }

  try {
    const created = await prisma.payCycle.create({
      data: { name, payDay: day, userId },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar ciclo", error);
    return NextResponse.json({ message: "Erro ao criar ciclo" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const idParam = url.searchParams.get("id");
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  const cycleId = Number(idParam);
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
