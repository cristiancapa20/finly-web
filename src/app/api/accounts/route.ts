/**
 * @module api/accounts
 * Manejador para operaciones CRUD en cuentas. Permite listar todas las cuentas del usuario, crear nuevas cuentas y gestionar saldos totales.
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
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
 * GET /api/accounts
 * Obtiene todas las cuentas del usuario autenticado con sus saldos totales (saldo inicial + suma de transacciones).
 * @returns {Array} Array de cuentas con id, name, type, color, initialBalance y balance calculado
 * @throws {401} Si no hay sesión de usuario autenticada
 * @throws {500} Error interno del servidor
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const select = {
      id: true,
      name: true,
      type: true,
      color: true,
      initialBalance: true,
      transactions: {
        where: { isDeleted: false },
        select: { amount: true, type: true },
      },
    } as const;

    let accounts;
    try {
      accounts = await prisma.account.findMany({
        where: { userId },
        select,
        orderBy: { name: "asc" },
      });
    } catch (error) {
      if (!missingSoftDeleteColumn(error)) throw error;
      accounts = await prisma.account.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          type: true,
          color: true,
          initialBalance: true,
          transactions: { select: { amount: true, type: true } },
        },
        orderBy: { name: "asc" },
      });
    }

    const data = accounts.map(({ transactions, initialBalance, ...acc }) => {
      const txBalance = transactions.reduce((sum, t) =>
        t.type === "INCOME" ? sum + t.amount : sum - t.amount, 0) / 100;
      const balance = Math.round((initialBalance + txBalance) * 100) / 100;
      return { ...acc, balance, initialBalance };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/accounts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/accounts
 * Crea una nueva cuenta para el usuario. Requiere nombre, tipo, saldo inicial. El color es opcional.
 * @param {NextRequest} req - Solicitud HTTP con body: { name, type, color?, initialBalance }
 * @returns {Object} Cuenta creada con id, name, type, color, initialBalance (HTTP 201)
 * @throws {401} Si no hay sesión de usuario autenticada
 * @throws {400} Si faltan campos requeridos o el tipo de cuenta es inválido
 */
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
    data: {
      name,
      type,
      userId: session.user.id,
      initialBalance: parseFloat(initialBalance) || 0,
      ...(color ? { color } : {}),
    },
    select: { id: true, name: true, type: true, color: true, initialBalance: true },
  });

  return NextResponse.json({ data: account }, { status: 201 });
}
