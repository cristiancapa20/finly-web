import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { deleteBalanceTransaction } from "@/lib/loanBalance";
import { amountInputToCents, centsToAmount } from "@/lib/money";
import { prisma } from "@/lib/prisma";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = prisma as any;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const loan = await db.loan.findFirst({
      where: { id: params.id, userId: session.user.id },
    });
    if (!loan) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const { contactName, amount, description, dueDate, status, reminderDays } = body;

    const updated = await db.loan.update({
      where: { id: params.id },
      data: {
        ...(contactName !== undefined && { contactName: contactName.trim() }),
        ...(amount !== undefined && { amount: amountInputToCents(amount) }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(status !== undefined && { status }),
        ...(reminderDays !== undefined && { reminderDays: reminderDays ? parseInt(reminderDays) : null }),
        updatedAt: new Date(),
      },
      include: {
        payments: { orderBy: { date: "desc" }, select: { id: true, amount: true, date: true, note: true, createdAt: true } },
      },
    });

    const paid = updated.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
    const remaining = Math.max(0, updated.amount - paid);

    return NextResponse.json({
      data: {
        ...updated,
        amount: centsToAmount(updated.amount),
        remaining: centsToAmount(remaining),
        payments: updated.payments.map((p: any) => ({ ...p, amount: centsToAmount(p.amount) })),
      },
    });
  } catch (error) {
    console.error("PATCH /api/loans/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const loan = await db.loan.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: {
        payments: {
          select: { balanceTransactionId: true },
        },
      },
    });
    if (!loan) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.$transaction(async (tx: any) => {
      await tx.loan.delete({ where: { id: params.id } });
      await deleteBalanceTransaction(loan.balanceTransactionId, session.user.id, tx);
      await Promise.all(
        loan.payments.map((payment: { balanceTransactionId: string | null }) =>
          deleteBalanceTransaction(payment.balanceTransactionId, session.user.id, tx)
        )
      );
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/loans/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
