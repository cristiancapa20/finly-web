import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const monthParam = searchParams.get("month");
  const accountId = searchParams.get("accountId") ?? undefined;

  let year: number;
  let month: number;

  if (monthParam) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m;
  } else {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth() + 1;
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const transactions = await prisma.transaction.findMany({
    where: {
      date: { gte: startDate, lt: endDate },
      ...(accountId ? { accountId } : {}),
    },
    include: { category: true },
  });

  let totalIncome = 0;
  let totalExpenses = 0;
  const categoryMap = new Map<string, { categoryId: string; categoryName: string; color: string; total: number }>();

  for (const t of transactions) {
    const amount = t.amount / 100;
    if (t.type === "INCOME") {
      totalIncome += amount;
    } else {
      totalExpenses += amount;
      const existing = categoryMap.get(t.categoryId);
      if (existing) {
        existing.total += amount;
      } else {
        categoryMap.set(t.categoryId, {
          categoryId: t.categoryId,
          categoryName: t.category.name,
          color: t.category.color,
          total: amount,
        });
      }
    }
  }

  const expensesByCategory = Array.from(categoryMap.values()).map((c) => ({
    ...c,
    total: Math.round(c.total * 100) / 100,
  }));

  return NextResponse.json({
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    balance: Math.round((totalIncome - totalExpenses) * 100) / 100,
    expensesByCategory,
  });
}
