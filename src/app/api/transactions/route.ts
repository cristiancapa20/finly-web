/**
 * @module api/transactions
 * Manejador para operaciones CRUD en transacciones. Permite listar, crear y gestionar transacciones financieras con paginación y filtros. Valida saldo disponible para gastos.
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { amountInputToCents, centsToAmount } from "@/lib/money";
import { formatCurrency } from "@/lib/currency";
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

/**
 * GET /api/transactions
 * Obtiene transacciones del usuario con paginación, filtros opcionales y cálculo de totales. Excluye transacciones marcadas como eliminadas. Identifica transacciones vinculadas a préstamos.
 * @param {NextRequest} request - Solicitud HTTP con query params: ?type=INCOME|EXPENSE&categoryId=id&accountId=id&dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&page=1&limit=20
 * @returns {Object} { data: [...], total: number, page: number, limit: number, totals: { totalIncome, totalExpenses, net } }
 * @throws {401} Si no hay sesión de usuario autenticada
 * @throws {500} Error interno del servidor
 */
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
        ...(dateFrom ? { gte: new Date(`${dateFrom}T00:00:00`) } : {}),
        ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59`) } : {}),
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

/**
 * POST /api/transactions
 * Crea una nueva transacción. Valida que existan los campos requeridos. Para gastos, verifica que haya saldo suficiente en la cuenta.
 * @param {NextRequest} request - Solicitud HTTP con body: { amount, type, categoryId, accountId, description?, date }
 * @returns {Object} Transacción creada con monto convertido a formato decimal (HTTP 201)
 * @throws {401} Si no hay sesión de usuario autenticada
 * @throws {400} Si faltan campos requeridos
 * @throws {404} Si la cuenta no existe
 * @throws {422} Si no hay saldo suficiente (para gastos)
 */
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
    const [account, userRecord] = await Promise.all([
      prisma.account.findUnique({
        where: { id: accountId, userId: session.user.id },
        include: { transactions: { select: { amount: true, type: true } } },
      }),
      prisma.user.findUnique({ where: { id: session.user.id }, select: { currency: true } }),
    ]);

    if (!account) {
      return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
    }

    const txBalance = account.transactions.reduce(
      (sum, t) => (t.type === "INCOME" ? sum + t.amount : sum - t.amount),
      0
    );
    const currentBalance = account.initialBalance + txBalance / 100;

    if (amount > currentBalance) {
      const currency = userRecord?.currency ?? "USD";
      return NextResponse.json(
        { error: `Saldo insuficiente. Tu saldo actual es ${formatCurrency(currentBalance, currency)}.` },
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
      date: new Date(`${date}T12:00:00`),
    },
    include: { category: true, account: true },
  });

  return NextResponse.json({ data: { ...transaction, amount: centsToAmount(transaction.amount) } }, { status: 201 });
}
