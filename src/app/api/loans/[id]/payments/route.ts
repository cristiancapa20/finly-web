import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

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
    const { amount, date, note } = body;

    if (!amount || !date) {
      return NextResponse.json({ error: "amount y date son requeridos" }, { status: 400 });
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "El monto debe ser mayor a 0" }, { status: 400 });
    }

    const payment = await db.loanPayment.create({
      data: {
        loanId: params.id,
        amount: Math.round(amountNum * 100),
        date: new Date(date),
        note: note?.trim() || null,
      },
    });

    // Auto-mark as PAID if fully covered
    const totalPaid = loan.payments.reduce((s: number, p: { amount: number }) => s + p.amount, 0) + Math.round(amountNum * 100);
    if (totalPaid >= loan.amount) {
      await db.loan.update({ where: { id: params.id }, data: { status: "PAID", updatedAt: new Date() } });
    }

    return NextResponse.json({ data: { ...payment, amount: payment.amount / 100 } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/loans/[id]/payments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
