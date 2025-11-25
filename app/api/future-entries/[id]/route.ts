import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { formatFutureEntry } from "@/lib/formatFutureEntry";

const VALID_TYPES = ["expense", "income"];

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  const entryId = Number(params.id);
  if (Number.isNaN(entryId)) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  const data: any = {};
  const { title, amount, category, dueDate, type } = await req.json();

  if (title !== undefined) data.title = title;
  if (category !== undefined) data.category = category || null;
  if (amount !== undefined) {
    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount)) {
      return NextResponse.json({ message: "Valor inválido" }, { status: 400 });
    }
    data.amount = parsedAmount;
  }
  if (dueDate !== undefined) {
    const parsedDate = new Date(dueDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ message: "Data inválida" }, { status: 400 });
    }
    data.dueDate = parsedDate;
  }
  if (type !== undefined) {
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ message: "Tipo inválido" }, { status: 400 });
    }
    data.type = type;
  }

  try {
    const existing = await prisma.futureEntry.findUnique({ where: { id: entryId } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ message: "Lançamento futuro não encontrado" }, { status: 404 });
    }

    const updated = await prisma.futureEntry.update({ where: { id: entryId }, data });
    return NextResponse.json(formatFutureEntry(updated));
  } catch (error) {
    console.error("Erro ao atualizar lançamento futuro", error);
    return NextResponse.json({ message: "Erro interno ao atualizar lançamento futuro" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  const entryId = Number(params.id);
  if (Number.isNaN(entryId)) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  try {
    const existing = await prisma.futureEntry.findUnique({ where: { id: entryId } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ message: "Lançamento futuro não encontrado" }, { status: 404 });
    }

    await prisma.futureEntry.delete({ where: { id: entryId } });
    return NextResponse.json({}, { status: 204 });
  } catch (error) {
    console.error("Erro ao excluir lançamento futuro", error);
    return NextResponse.json({ message: "Erro interno ao excluir lançamento futuro" }, { status: 500 });
  }
}
