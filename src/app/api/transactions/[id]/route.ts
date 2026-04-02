/**
 * @module api/transactions/[id]
 * Manejador para actualizar y eliminar transacciones individuales. No permite editar transacciones vinculadas a préstamos.
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { amountInputToCents, centsToAmount } from "@/lib/money";
import { isLoanManagedTransaction } from "@/lib/loanManagedTransaction";
import { prisma } from "@/lib/prisma";

const LOAN_MANAGED_MSG =
  "Esta transacción está vinculada a Préstamos. Editá o eliminá el préstamo o el pago desde la sección Préstamos.";

/**
 * PATCH /api/transactions/[id]
 * Actualiza una transacción existente (monto, tipo, categoría, cuenta, descripción, fecha). No se pueden editar transacciones vinculadas a préstamos.
 * @param {NextRequest} request - Solicitud HTTP con body: { amount?, type?, categoryId?, accountId?, description?, date? }
 * @param {Object} params - Parámetros de ruta incluyendo el ID de la transacción
 * @returns {Object} Transacción actualizada con monto convertido a formato decimal
 * @throws {401} Si no hay sesión de usuario autenticada
 * @throws {404} Si la transacción no existe
 * @throws {409} Si la transacción está vinculada a préstamos
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  const existing = await prisma.transaction.findUnique({
    where: { id, userId: session.user.id, isDeleted: false },
  });
  if (!existing) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  if (await isLoanManagedTransaction(id, session.user.id)) {
    return NextResponse.json({ error: LOAN_MANAGED_MSG }, { status: 409 });
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
      ...(date !== undefined        ? { date: new Date(`${date}T12:00:00`) } : {}),
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

/**
 * DELETE /api/transactions/[id]
 * Elimina (soft delete) una transacción existente. No se pueden eliminar transacciones vinculadas a préstamos.
 * @param {NextRequest} _request - Solicitud HTTP (no se utiliza)
 * @param {Object} params - Parámetros de ruta incluyendo el ID de la transacción
 * @returns {Object} { data: { id } } si la eliminación fue exitosa
 * @throws {401} Si no hay sesión de usuario autenticada
 * @throws {404} Si la transacción no existe
 * @throws {409} Si la transacción está vinculada a préstamos
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  const existing = await prisma.transaction.findUnique({
    where: { id, userId: session.user.id, isDeleted: false },
  });
  if (!existing) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  if (await isLoanManagedTransaction(id, session.user.id)) {
    return NextResponse.json({ error: LOAN_MANAGED_MSG }, { status: 409 });
  }

  await prisma.transaction.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });

  return NextResponse.json({ data: { id } });
}
