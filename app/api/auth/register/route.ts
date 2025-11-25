import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ message: "Use POST para registrar" }, { status: 405, headers: { Allow: "POST" } });
}

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ message: "Nome, e-mail e senha são obrigatórios" }, { status: 400 });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ message: "E-mail já cadastrado" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    const token = generateToken(user.id);
    return NextResponse.json(
      {
        token,
        user: { id: user.id, name: user.name, email: user.email },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao registrar usuário", error);
    return NextResponse.json({ message: "Erro interno ao registrar" }, { status: 500 });
  }
}
