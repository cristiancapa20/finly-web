import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { amountInputToCents, centsToAmount } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  const existing = await prisma.transaction.findUnique({ where: { id, userId: session.user.id } });
  if (!existing) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  const body = await request.json();
  const { amount, type, categoryId, accountId, description, date } = body;

  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      ...(amount !== undefined     ? { amount: amountInputToCents(amount) } : {}),
      ...(type !== undefined        ? { type } : {}),
      ...(categoryId !== undefined  ? { categoryId } : {}),
      ...(accountId !== undefined   ? { accountId } : {}),
      ...(description !== undefined ? { description: description || null } : {}),
      ...(date !== undefined        ? { date: new Date(date) } : {}),
    },
    select: {
      id: true, amount: true, type: true, description: true, date: true,
      category: { select: { id: true, name: true, color: true } },
      account:  { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    data: {
      ...updated,
      amount: centsToAmount(updated.amount),
    },
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  const existing = await prisma.transaction.findUnique({ where: { id, userId: session.user.id } });
  if (!existing) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  await prisma.transaction.delete({ where: { id } });

  return NextResponse.json({ data: { id } });
}
