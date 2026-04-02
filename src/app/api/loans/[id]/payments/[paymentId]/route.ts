/**
 * @module api/loans/[id]/payments/[paymentId]
 * Manejador para actualizar y eliminar pagos de préstamos individuales. Mantiene sincronizada la transacción de balance asociada y actualiza automáticamente el estado del préstamo.
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { amountInputToCents, centsToAmount } from "@/lib/money";
import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

/**
 * PATCH /api/loans/[id]/payments/[paymentId]
 * Actualiza los detalles de un pago existente (monto, fecha, nota, cuenta). Sincroniza la transacción de balance y actualiza automáticamente el estado del préstamo (PAID/ACTIVE).
 * @param {NextRequest} req - Solicitud HTTP con body: { amount, date, note?, accountId }
 * @param {Object} params - Parámetros de ruta incluyendo loanId y paymentId
 * @returns {Object} Pago actualizado con monto convertido a formato decimal y datos de cuenta
 * @throws {401} Si no hay sesión de usuario autenticada
 * @throws {404} Si el préstamo o pago no existe
 * @throws {400} Si los datos requeridos son inválidos
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; paymentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const loan = await db.loan.findFirst({
      where: { id: params.id, userId: session.user.id },
      select: { id: true, type: true, amount: true, status: true, contactName: true },
    });
    if (!loan) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const payment = await db.loanPayment.findFirst({
      where: { id: params.paymentId, loanId: params.id },
    });
    if (!payment) return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });

    const body = await req.json();
    const { amount, date, note, accountId } = body;

    if (!amount || !date || !accountId) {
      return NextResponse.json({ error: "amount, date y accountId son requeridos" }, { status: 400 });
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "El monto debe ser mayor a 0" }, { status: 400 });
    }
    const account = await db.account.findFirst({
      where: { id: accountId, userId: session.user.id },
      select: { id: true, name: true },
    });
    if (!account) {
      return NextResponse.json({ error: "La cuenta seleccionada no existe" }, { status: 400 });
    }

    const amountInCents = amountInputToCents(amountNum);
    const paymentDate = new Date(date);
    const txType = loan.type === "OWED" ? "EXPENSE" : "INCOME";
    const description =
      loan.type === "OWED"
        ? `Pago de deuda a ${loan.contactName}`
        : `Cobro de préstamo a ${loan.contactName}`;

    const updated = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      const row = await tx.loanPayment.update({
        where: { id: payment.id },
        data: {
          amount: amountInCents,
          date: paymentDate,
          accountId,
          note:
            note === undefined
              ? payment.note
              : typeof note === "string"
                ? note.trim() || null
                : null,
        },
      });

      if (payment.balanceTransactionId) {
        await tx.transaction.updateMany({
          where: { id: payment.balanceTransactionId, userId: session.user.id },
          data: {
            amount: amountInCents,
            date: paymentDate,
            accountId,
            type: txType,
            description,
          },
        });
      }

      const agg = await tx.loanPayment.aggregate({
        where: { loanId: params.id },
        _sum: { amount: true },
      });
      const totalPaid: number = agg._sum.amount ?? 0;
      if (totalPaid >= loan.amount && loan.status !== "PAID") {
        await tx.loan.update({ where: { id: params.id }, data: { status: "PAID", updatedAt: new Date() } });
      } else if (totalPaid < loan.amount && loan.status === "PAID") {
        await tx.loan.update({ where: { id: params.id }, data: { status: "ACTIVE", updatedAt: new Date() } });
      }

      return row;
    });

    return NextResponse.json({
      data: { ...updated, amount: centsToAmount(updated.amount), account },
    });
  } catch (error) {
    console.error("PATCH /api/loans/[id]/payments/[paymentId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/loans/[id]/payments/[paymentId]
 * Elimina un pago y su transacción de balance asociada. Actualiza automáticamente el estado del préstamo si es necesario.
 * @param {NextRequest} _req - Solicitud HTTP (no se utiliza)
 * @param {Object} params - Parámetros de ruta incluyendo loanId y paymentId
 * @returns {Object} { success: true } si la eliminación fue exitosa
 * @throws {401} Si no hay sesión de usuario autenticada
 * @throws {404} Si el préstamo o pago no existe
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; paymentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const loan = await db.loan.findFirst({
      where: { id: params.id, userId: session.user.id },
    });
    if (!loan) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const payment = await db.loanPayment.findFirst({
      where: { id: params.paymentId, loanId: params.id },
    });
    if (!payment) return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });

    const balanceTxId = payment.balanceTransactionId;

    await db.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.loanPayment.delete({ where: { id: params.paymentId } });

      if (balanceTxId) {
        await tx.transaction.deleteMany({
          where: { id: balanceTxId, userId: session.user.id },
        });
      }

      // Re-check si el préstamo debe volver a ACTIVE
      const agg = await tx.loanPayment.aggregate({
        where: { loanId: params.id },
        _sum: { amount: true },
      });
      const totalPaid: number = agg._sum.amount ?? 0;
      if (totalPaid < loan.amount && loan.status === "PAID") {
        await tx.loan.update({ where: { id: params.id }, data: { status: "ACTIVE", updatedAt: new Date() } });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/loans/[id]/payments/[paymentId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
