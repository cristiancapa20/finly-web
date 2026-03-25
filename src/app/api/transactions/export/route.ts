import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function escapeCsvField(value: string): string {
  if (value.includes('"') || value.includes(",") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const exportSelect = {
  amount: true,
  type: true,
  description: true,
  date: true,
  category: { select: { name: true } },
  account: { select: { name: true } },
} satisfies Prisma.TransactionSelect;

type ExportTransactionRow = Prisma.TransactionGetPayload<{ select: typeof exportSelect }>;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type");
    const categoryId = searchParams.get("categoryId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const baseWhere: Prisma.TransactionWhereInput = { userId: session.user.id };
    if (type) baseWhere.type = type;
    if (categoryId) baseWhere.categoryId = categoryId;
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

    let transactions: ExportTransactionRow[];
    try {
      transactions = await prisma.transaction.findMany({
        where: whereWithSoftDelete,
        select: exportSelect,
        orderBy: { date: "desc" },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const missingSoftDeleteSupport =
        message.includes("Unknown argument `isDeleted`") ||
        message.includes("no such column: main.Transaction.isDeleted");
      if (!missingSoftDeleteSupport) throw error;

      transactions = await prisma.transaction.findMany({
        where: baseWhere,
        select: exportSelect,
        orderBy: { date: "desc" },
      });
    }

    // Determine filename month
    let fileMonth: string;
    if (dateFrom) {
      const d = new Date(dateFrom);
      fileMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    } else {
      const now = new Date();
      fileMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    }
    const filename = `transacciones-${fileMonth}.csv`;

    const headers = ["Fecha", "Descripción", "Categoría", "Cuenta", "Tipo", "Monto"];
    const rows = transactions.map((t) => [
      new Date(t.date).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      t.description ?? "",
      t.category.name,
      t.account.name,
      t.type === "INCOME" ? "Ingreso" : "Gasto",
      (t.amount / 100).toFixed(2),
    ]);

    const csvLines = [
      headers.map(escapeCsvField).join(","),
      ...rows.map((row) => row.map(escapeCsvField).join(",")),
    ];

    // UTF-8 BOM for Excel compatibility
    const BOM = "\uFEFF";
    const csvContent = BOM + csvLines.join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("GET /api/transactions/export error:", error);
    return NextResponse.json({ error: "Error al exportar transacciones" }, { status: 500 });
  }
}
