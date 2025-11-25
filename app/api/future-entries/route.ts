import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { formatFutureEntry } from "@/lib/formatFutureEntry";

const VALID_TYPES = ["expense", "income"];

export async function GET(req: NextRequest) {
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  try {
    const items = await prisma.futureEntry.findMany({
      where: { userId },
      orderBy: { dueDate: "asc" },
    });
    return NextResponse.json(items.map(formatFutureEntry));
  } catch (error) {
    console.error("Erro ao listar lançamentos futuros", error);
    return NextResponse.json({ message: "Erro interno ao listar lançamentos futuros" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  const { title, amount, category, dueDate, type } = await req.json();

  if (!title || amount === undefined || amount === null || !dueDate) {
    return NextResponse.json({ message: "Título, valor e data são obrigatórios" }, { status: 400 });
  }

  const parsedAmount = parseFloat(amount);
  if (Number.isNaN(parsedAmount)) {
    return NextResponse.json({ message: "Valor inválido" }, { status: 400 });
  }

  const parsedDate = new Date(dueDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ message: "Data inválida" }, { status: 400 });
  }

  const typeToUse = type && VALID_TYPES.includes(type) ? type : "expense";

  try {
    const created = await prisma.futureEntry.create({
      data: {
        title,
        amount: parsedAmount,
        category: category || null,
        dueDate: parsedDate,
        type: typeToUse,
        userId,
      },
    });
    return NextResponse.json(formatFutureEntry(created), { status: 201 });
  } catch (error) {
    console.error("Erro ao criar lançamento futuro", error);
    return NextResponse.json({ message: "Erro interno ao criar lançamento futuro" }, { status: 500 });
  }
}
