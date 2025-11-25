import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const userId = verifyToken(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ message: "Não autorizado" }, { status: 401 });

  try {
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, salary: true },
    });
    if (!profile) {
      return NextResponse.json({ message: "Perfil não encontrado" }, { status: 404 });
    }
    return NextResponse.json(profile);
  } catch (error) {
    console.error("Erro ao buscar perfil", error);
    return NextResponse.json({ message: "Erro ao buscar perfil" }, { status: 500 });
  }
}
