import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

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

  const { name, payDay, salaryAmount } = await req.json();
  const day = Number(payDay);
  if (!name || Number.isNaN(day) || day < 1 || day > 31) {
    return NextResponse.json({ message: "Informe nome e dia entre 1 e 31" }, { status: 400 });
  }

  const parsedSalary = salaryAmount !== undefined && salaryAmount !== null ? parseFloat(salaryAmount) : null;
  if (salaryAmount !== undefined && (parsedSalary === null || Number.isNaN(parsedSalary) || parsedSalary < 0)) {
    return NextResponse.json({ message: "Salário do ciclo inválido" }, { status: 400 });
  }

  try {
    const created = await prisma.payCycle.create({
      data: { name, payDay: day, userId, salaryAmount: parsedSalary },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar ciclo", error);
    return NextResponse.json({ message: "Erro ao criar ciclo" }, { status: 500 });
  }
}
