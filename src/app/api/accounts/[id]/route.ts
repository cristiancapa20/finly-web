/**
 * @module api/accounts/[id]
 * Manejador para operaciones CRUD en cuentas individuales. Permite actualizar los detalles de una cuenta específica (nombre, color, saldo inicial) y eliminar cuentas que no tienen transacciones asociadas.
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

async function findAccountForBalanceEdit(id: string, userId: string) {
  try {
    return await prisma.account.findUnique({
      where: { id, userId },
      include: {
        transactions: {
          where: { isDeleted: false },
          select: { amount: true, type: true },
        },
      },
    });
  } catch (error) {
    if (!missingSoftDeleteColumn(error)) throw error;
    return prisma.account.findUnique({
      where: { id, userId },
      include: {
        transactions: { select: { amount: true, type: true } },
      },
    });
  }
}

/**
 * PATCH /api/accounts/[id]
 * Actualiza los detalles de una cuenta existente (nombre, color, saldo inicial). Si se actualiza el saldo, se recalcula automáticamente el saldo inicial basándose en las transacciones existentes.
 * @param {NextRequest} req - Solicitud HTTP con body: { name?, color?, balance? }
 * @param {Object} params - Parámetros de ruta incluyendo el ID de la cuenta
 * @returns {Object} Cuenta actualizada con id, name, type, color, initialBalance
 * @throws {401} Si no hay sesión de usuario autenticada
 * @throws {404} Si la cuenta no existe para este usuario
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, color, balance } = body;

  let newInitialBalance: number | undefined;

  if (balance !== undefined && balance !== "") {
    const existing = await findAccountForBalanceEdit(id, session.user.id);
    if (existing) {
      const txBalance = existing.transactions.reduce(
        (sum, t) => (t.type === "INCOME" ? sum + t.amount : sum - t.amount),
        0
      ) / 100;
      newInitialBalance = parseFloat(balance) - txBalance;
    }
  }

  const account = await prisma.account.update({
    where: { id, userId: session.user.id },
    data: {
      ...(name ? { name } : {}),
      ...(color ? { color } : {}),
      ...(newInitialBalance !== undefined ? { initialBalance: newInitialBalance } : {}),
    },
    select: { id: true, name: true, type: true, color: true, initialBalance: true },
  });

  return NextResponse.json({ data: account });
}

/**
 * DELETE /api/accounts/[id]
 * Elimina una cuenta existente. Solo se puede eliminar si no tiene transacciones asociadas.
 * @param {NextRequest} _req - Solicitud HTTP (no se utiliza)
 * @param {Object} params - Parámetros de ruta incluyendo el ID de la cuenta
 * @returns {Object} { success: true } si la eliminación fue exitosa
 * @throws {401} Si no hay sesión de usuario autenticada
 * @throws {404} Si la cuenta no existe para este usuario
 * @throws {409} Si la cuenta contiene transacciones asociadas (no puede ser eliminada)
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const txCount = await prisma.transaction.count({ where: { accountId: id, userId: session.user.id } });
  if (txCount > 0) {
    return NextResponse.json(
      { error: "No se puede eliminar una cuenta con transacciones asociadas" },
      { status: 409 }
    );
  }

  await prisma.account.delete({ where: { id, userId: session.user.id } });

  return NextResponse.json({ success: true });
}
