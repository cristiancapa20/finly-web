import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { amountInputToCents, centsToAmount } from "@/lib/money";
import { getLoanManagedTransactionIds } from "@/lib/loanManagedTransaction";
import { prisma } from "@/lib/prisma";

type TransactionListRow = {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  date: Date;
  createdAt: Date;
  category: { id: string; name: string; color: string };
  account: { id: string; name: string };
};

const listSelect = {
  id: true,
  amount: true,
  type: true,
  description: true,
  date: true,
  createdAt: true,
  category: { select: { id: true, name: true, color: true } },
  account: { select: { id: true, name: true } },
} as const;

function totalsFromGroupBy(grouped: { type: string; _sum: { amount: bigint | number | null } }[]) {
  let incomeCents = 0;
  let expenseCents = 0;
  for (const g of grouped) {
    const raw = g._sum.amount;
    const s = typeof raw === "bigint" ? Number(raw) : Number(raw ?? 0);
    if (g.type === "INCOME") incomeCents += s;
    else if (g.type === "EXPENSE") expenseCents += s;
  }
  const totalIncome = incomeCents / 100;
  const totalExpenses = expenseCents / 100;
  return {
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    net: Math.round((totalIncome - totalExpenses) * 100) / 100,
  };
}

async function loadTransactionsPageAndTotals(
  where: Prisma.TransactionWhereInput,
  page: number,
  limit: number
) {
  return Promise.all([
    prisma.transaction.findMany({
      where,
      select: listSelect,
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
    prisma.transaction.groupBy({
      by: ["type"],
      where,
      _sum: { amount: true },
    }),
  ]);
}

export async function GET(request: NextRequest) {
  try {
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

    const baseWhere: Prisma.TransactionWhereInput = { userId: session.user.id };
    if (type) baseWhere.type = type;
    if (categoryId) baseWhere.categoryId = categoryId;
    if (accountId) baseWhere.accountId = accountId;
    if (dateFrom || dateTo) {
      baseWhere.date = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    }

    const whereWithSoftDelete: Prisma.TransactionWhereInput = {
      ...baseWhere,
      isDeleted: false,
    };

    let transactions: TransactionListRow[] = [];
    let total: number;
    let grouped: { type: string; _sum: { amount: bigint | number | null } }[];

    try {
      [transactions, total, grouped] = await loadTransactionsPageAndTotals(whereWithSoftDelete, page, limit);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const missingSoftDeleteSupport =
        message.includes("Unknown argument `isDeleted`") ||
        message.includes("no such column: main.Transaction.isDeleted");
      if (!missingSoftDeleteSupport) throw error;

      [transactions, total, grouped] = await loadTransactionsPageAndTotals(baseWhere, page, limit);
    }

    const loanManagedIds = await getLoanManagedTransactionIds(
      session.user.id,
      transactions.map((t) => t.id)
    );

    const data = transactions.map((t) => ({
      ...t,
      amount: centsToAmount(t.amount),
      managedViaLoans: loanManagedIds.has(t.id),
    }));

    const totals = totalsFromGroupBy(grouped);

    return NextResponse.json({ data, total, page, limit, totals });
  } catch (error) {
    console.error("GET /api/transactions error:", error);
    return NextResponse.json({ error: "Error al cargar transacciones" }, { status: 500 });
  }
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

  // Validar saldo suficiente si es un gasto
  if (type === "EXPENSE") {
    const account = await prisma.account.findUnique({
      where: { id: accountId, userId: session.user.id },
      include: { transactions: { select: { amount: true, type: true } } },
    });

    if (!account) {
      return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
    }

    const txBalance = account.transactions.reduce(
      (sum, t) => (t.type === "INCOME" ? sum + t.amount : sum - t.amount),
      0
    );
    const currentBalance = account.initialBalance + txBalance / 100;

    if (amount > currentBalance) {
      return NextResponse.json(
        { error: `Saldo insuficiente. Tu saldo actual es ${new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(currentBalance)}.` },
        { status: 422 }
      );
    }
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
