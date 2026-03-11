import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { amountInputToCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const accounts = await prisma.account.findMany({
      where: { userId: session.user.id },
      select: {
        id: true, name: true, type: true, color: true,
        transactions: { select: { amount: true, type: true } },
      },
      orderBy: { name: "asc" },
    });

    const data = accounts.map(({ transactions, ...acc }) => {
      const balance = transactions.reduce((sum, t) =>
        t.type === "INCOME" ? sum + t.amount : sum - t.amount, 0) / 100;
      return { ...acc, balance: Math.round(balance * 100) / 100 };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/accounts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, type, color, initialBalance } = body;

  if (!name || !type) {
    return NextResponse.json({ error: "Name and type are required" }, { status: 400 });
  }

  if (initialBalance === undefined || initialBalance === null || isNaN(Number(initialBalance))) {
    return NextResponse.json({ error: "El saldo inicial es requerido" }, { status: 400 });
  }

  const validTypes = ["CASH", "BANK", "CREDIT_CARD", "OTHER"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid account type" }, { status: 400 });
  }

  const account = await prisma.account.create({
    data: { name, type, userId: session.user.id, ...(color ? { color } : {}) },
    select: { id: true, name: true, type: true, color: true },
  });

  const balance = Number(initialBalance);
  if (balance > 0) {
    const category = await prisma.category.findFirst({
      where: { OR: [{ userId: session.user.id }, { isSystem: true }] },
      select: { id: true },
    });
    if (category) {
      await prisma.transaction.create({
        data: {
          amount: amountInputToCents(balance),
          type: "INCOME",
          categoryId: category.id,
          accountId: account.id,
          userId: session.user.id,
          description: "Saldo inicial",
          date: new Date(),
        },
      });
    }
  }

  return NextResponse.json({ data: account }, { status: 201 });
}
