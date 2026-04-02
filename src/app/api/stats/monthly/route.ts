/**
 * @module api/stats/monthly
 * Manejador para estadísticas mensuales de transacciones. Retorna ingresos y gastos agrupados por mes en un rango temporal.
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function missingSoftDeleteColumn(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return (
    message.includes("Unknown argument `isDeleted`") ||
    message.includes("no such column: main.Transaction.isDeleted")
  );
}

/**
 * GET /api/stats/monthly
 * Obtiene estadísticas mensuales de ingresos y gastos para los últimos N meses. Retorna un array con todos los meses en el rango solicitado, incluyendo meses sin transacciones.
 * @param {NextRequest} request - Solicitud HTTP con query params: ?months=6&month=YYYY-MM&accountId=id?
 * @returns {Array} Array con entries { month: "YYYY-MM", income: number, expenses: number }
 * @throws {401} Si no hay sesión de usuario autenticada
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const monthsParam = parseInt(searchParams.get("months") ?? "6", 10);
  const months = isNaN(monthsParam) || monthsParam < 1 ? 6 : monthsParam;
  const accountId = searchParams.get("accountId") ?? undefined;
  const monthParam = searchParams.get("month"); // e.g. "2026-03"

  let refYear: number, refMonth: number;
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    refYear = y;
    refMonth = m - 1;
  } else {
    const now = new Date();
    refYear = now.getFullYear();
    refMonth = now.getMonth();
  }

  const startDate = new Date(refYear, refMonth - months + 1, 1);
  const endDate = new Date(refYear, refMonth + 1, 1);

  const baseWhere: Prisma.TransactionWhereInput = {
    userId: session.user.id,
    date: { gte: startDate, lt: endDate },
    ...(accountId ? { accountId } : {}),
  };

  const select = { amount: true, type: true, date: true } as const;

  let transactions: Awaited<ReturnType<typeof prisma.transaction.findMany<{ select: typeof select }>>>;
  try {
    transactions = await prisma.transaction.findMany({
      where: { ...baseWhere, isDeleted: false },
      select,
    });
  } catch (error) {
    if (!missingSoftDeleteColumn(error)) throw error;
    transactions = await prisma.transaction.findMany({
      where: baseWhere,
      select,
    });
  }

  const monthMap = new Map<string, { income: number; expenses: number }>();

  // Initialize all months with zero values
  for (let i = 0; i < months; i++) {
    const d = new Date(refYear, refMonth - months + 1 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, { income: 0, expenses: 0 });
  }

  for (const t of transactions) {
    const d = t.date;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const entry = monthMap.get(key);
    if (!entry) continue;
    const amount = t.amount / 100;
    if (t.type === "INCOME") {
      entry.income += amount;
    } else {
      entry.expenses += amount;
    }
  }

  const data = Array.from(monthMap.entries()).map(([month, { income, expenses }]) => ({
    month,
    income: Math.round(income * 100) / 100,
    expenses: Math.round(expenses * 100) / 100,
  }));

  return NextResponse.json({ data });
}
