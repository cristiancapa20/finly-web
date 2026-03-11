import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { deleteBalanceTransaction } from "@/lib/loanBalance";
import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

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
      select: { balanceTransactionId: true },
    });
    if (!payment) return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });

    await db.$transaction(async (tx: typeof prisma) => {
      await tx.loanPayment.delete({ where: { id: params.paymentId } });
      await deleteBalanceTransaction(payment.balanceTransactionId, session.user.id, tx);
    });

    // Re-check if loan should go back to ACTIVE
    const agg = await db.loanPayment.aggregate({
      where: { loanId: params.id },
      _sum: { amount: true },
    });
    const totalPaid: number = agg._sum.amount ?? 0;
    if (totalPaid < loan.amount && loan.status === "PAID") {
      await db.loan.update({ where: { id: params.id }, data: { status: "ACTIVE", updatedAt: new Date() } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/loans/[id]/payments/[paymentId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
