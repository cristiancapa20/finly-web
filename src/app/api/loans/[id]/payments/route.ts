/**
 * @module api/loans/[id]/payments
 * Manejador para crear pagos de préstamos. Crea automáticamente una transacción de balance y marca el préstamo como PAID si se cubre completamente.
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { amountInputToCents, centsToAmount } from "@/lib/money";
import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;
const CATEGORY_PRESTAMO = "Préstamo";
const CATEGORY_DEUDA = "Deuda";
const CATEGORY_FALLBACK = "Otros";

/**
 * POST /api/loans/[id]/payments
 * Registra un nuevo pago para un préstamo. Crea automáticamente una transacción de balance en la cuenta especificada y actualiza el estado del préstamo a PAID si se cubre completamente.
 * @param {NextRequest} req - Solicitud HTTP con body: { amount, date, note?, accountId }
 * @param {Object} params - Parámetros de ruta incluyendo el ID del préstamo
 * @returns {Object} Pago creado con monto convertido a formato decimal, datos de cuenta (HTTP 201)
 * @throws {401} Si no hay sesión de usuario autenticada
 * @throws {404} Si el préstamo no existe
 * @throws {400} Si los datos requeridos son inválidos
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const loan = await db.loan.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: { payments: { select: { amount: true } } },
    });
    if (!loan) return NextResponse.json({ error: "Not found" }, { status: 404 });

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

    const payment = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      const categoryName = loan.type === "LENT" ? CATEGORY_PRESTAMO : CATEGORY_DEUDA;
      const category =
        await tx.category.findFirst({ where: { isSystem: true, name: categoryName }, select: { id: true } }) ??
        await tx.category.findFirst({ where: { isSystem: true, name: CATEGORY_FALLBACK }, select: { id: true } }) ??
        await tx.category.findFirst({ where: { isSystem: true }, select: { id: true } });
      if (!category) throw new Error("No category available for loan payment balance tracking");

      const balanceTx = await tx.transaction.create({
        data: {
          amount: amountInCents,
          type: loan.type === "OWED" ? "EXPENSE" : "INCOME",
          categoryId: category.id,
          accountId,
          userId: session.user.id,
          description: loan.type === "OWED"
            ? `Pago de deuda a ${loan.contactName}`
            : `Cobro de préstamo a ${loan.contactName}`,
          date: paymentDate,
        },
        select: { id: true },
      });

      const createdPayment = await tx.loanPayment.create({
        data: {
          loanId: params.id,
          accountId,
          balanceTransactionId: balanceTx.id,
          amount: amountInCents,
          date: paymentDate,
          note: note?.trim() || null,
        },
      });

      // Auto-mark as PAID if fully covered
      const totalPaid = loan.payments.reduce((s: number, p: { amount: number }) => s + p.amount, 0) + amountInCents;
      if (totalPaid >= loan.amount) {
        await tx.loan.update({ where: { id: params.id }, data: { status: "PAID", updatedAt: new Date() } });
      }

      return createdPayment;
    });

    return NextResponse.json({ data: { ...payment, amount: centsToAmount(payment.amount), account } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/loans/[id]/payments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
