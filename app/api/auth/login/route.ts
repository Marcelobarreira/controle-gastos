import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ message: "Use POST para autenticar" }, { status: 405, headers: { Allow: "POST" } });
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ message: "E-mail e senha são obrigatórios" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: "Credenciais inválidas" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ message: "Credenciais inválidas" }, { status: 401 });
    }

    const token = generateToken(user.id);
    return NextResponse.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Erro ao autenticar usuário", error);
    return NextResponse.json({ message: "Erro interno ao autenticar" }, { status: 500 });
  }
}
