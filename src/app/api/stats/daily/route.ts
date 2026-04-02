/**
 * @module api/stats/daily
 * Manejador para estadísticas diarias de transacciones. Retorna ingresos y gastos agrupados por día de un mes específico.
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
 * GET /api/stats/daily
 * Obtiene estadísticas diarias de ingresos y gastos para un mes específico o el mes actual. Retorna un array con todos los días del mes, incluyendo días sin transacciones con valores cero.
 * @param {NextRequest} request - Solicitud HTTP con query params: ?month=YYYY-MM&accountId=id?
 * @returns {Array} Array con entries { day: "YYYY-MM-DD", income: number, expenses: number }
 * @throws {401} Si no hay sesión de usuario autenticada
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const monthParam = searchParams.get("month"); // e.g. "2026-03"
  const accountId = searchParams.get("accountId") ?? undefined;

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

  const startDate = new Date(refYear, refMonth, 1);
  const endDate = new Date(refYear, refMonth + 1, 1);
  const daysInMonth = new Date(refYear, refMonth + 1, 0).getDate();

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

  // Initialize all days
  const dayMap = new Map<string, { income: number; expenses: number }>();
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${refYear}-${String(refMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    dayMap.set(key, { income: 0, expenses: 0 });
  }

  for (const t of transactions) {
    const d = t.date;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const entry = dayMap.get(key);
    if (!entry) continue;
    const amount = t.amount / 100;
    if (t.type === "INCOME") {
      entry.income += amount;
    } else {
      entry.expenses += amount;
    }
  }

  const data = Array.from(dayMap.entries()).map(([day, { income, expenses }]) => ({
    day,
    income: Math.round(income * 100) / 100,
    expenses: Math.round(expenses * 100) / 100,
  }));

  return NextResponse.json({ data });
}
