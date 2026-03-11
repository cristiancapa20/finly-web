import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { amountInputToCents, centsToAmount } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  const categoryId = searchParams.get("categoryId");
  const accountId = searchParams.get("accountId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);

  const where: Prisma.TransactionWhereInput = { userId: session.user.id };
  if (type) where.type = type;
  if (categoryId) where.categoryId = categoryId;
  if (accountId) where.accountId = accountId;
  if (dateFrom || dateTo) {
    where.date = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true, account: true },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  const data = transactions.map((t) => ({
    ...t,
    amount: centsToAmount(t.amount),
  }));

  return NextResponse.json({ data, total, page, limit });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { amount, type, categoryId, accountId, description, date } = body;

  if (!amount || !type || !categoryId || !accountId || !date) {
    return NextResponse.json(
      { error: "Missing required fields: amount, type, categoryId, accountId, date" },
      { status: 400 }
    );
  }

  const transaction = await prisma.transaction.create({
    data: {
      amount: amountInputToCents(amount),
      type,
      categoryId,
      accountId,
      userId: session.user.id,
      description: description ?? null,
      date: new Date(date),
    },
    include: { category: true, account: true },
  });

  return NextResponse.json({ data: { ...transaction, amount: centsToAmount(transaction.amount) } }, { status: 201 });
}
