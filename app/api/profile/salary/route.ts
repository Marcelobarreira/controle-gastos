import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PUT(req: NextRequest) {
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  const { salary } = await req.json();
  const parsed = parseFloat(salary);
  if (Number.isNaN(parsed) || parsed < 0) {
    return NextResponse.json({ message: "Salário inválido" }, { status: 400 });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { salary: parsed },
      select: { id: true, name: true, email: true, salary: true },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao salvar salário", error);
    return NextResponse.json({ message: "Erro ao salvar salário" }, { status: 500 });
  }
}
