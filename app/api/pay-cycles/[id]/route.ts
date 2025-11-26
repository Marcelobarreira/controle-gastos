import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  const payCycleId = Number(params.id);
  if (Number.isNaN(payCycleId)) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  const { name, payDay, salaryAmount } = await req.json();
  const data: any = {};

  if (name !== undefined) data.name = name;

  if (payDay !== undefined) {
    const parsedDay = Number(payDay);
    if (Number.isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31) {
      return NextResponse.json({ message: "Dia inválido" }, { status: 400 });
    }
    data.payDay = parsedDay;
  }

  if (salaryAmount !== undefined) {
    if (salaryAmount === null || salaryAmount === "") {
      data.salaryAmount = null;
    } else {
      const parsedSalary = parseFloat(salaryAmount);
      if (Number.isNaN(parsedSalary) || parsedSalary < 0) {
        return NextResponse.json({ message: "Salário do ciclo inválido" }, { status: 400 });
      }
      data.salaryAmount = parsedSalary;
    }
  }

  try {
    const existing = await prisma.payCycle.findUnique({ where: { id: payCycleId } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ message: "Ciclo não encontrado" }, { status: 404 });
    }

    const updated = await prisma.payCycle.update({ where: { id: payCycleId }, data });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar ciclo", error);
    return NextResponse.json({ message: "Erro interno ao atualizar ciclo" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  const payCycleId = Number(params.id);
  if (Number.isNaN(payCycleId)) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  try {
    const existing = await prisma.payCycle.findUnique({ where: { id: payCycleId } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ message: "Ciclo não encontrado" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.expense.updateMany({ where: { payCycleId, userId }, data: { payCycleId: null } }),
      prisma.obligation.updateMany({ where: { payCycleId, userId }, data: { payCycleId: null } }),
      prisma.spendingEnvelope.updateMany({ where: { payCycleId, userId }, data: { payCycleId: null } }),
      prisma.payCycle.delete({ where: { id: payCycleId } }),
    ]);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Erro ao excluir ciclo", error);
    return NextResponse.json({ message: "Erro interno ao excluir ciclo" }, { status: 500 });
  }
}
