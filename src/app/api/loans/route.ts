import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { amountInputToCents, centsToAmount } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { createLoanBalanceTransaction } from "@/lib/loanBalance";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = prisma as any;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const loans = await db.loan.findMany({
      where: { userId: session.user.id },
      include: {
        account: {
          select: { id: true, name: true },
        },
        payments: {
          orderBy: { date: "desc" },
          select: {
            id: true,
            amount: true,
            date: true,
            note: true,
            createdAt: true,
            account: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = loans.map((loan: any) => {
      const paid = loan.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
      const remaining = Math.max(0, loan.amount - paid);
      return {
        ...loan,
        amount: centsToAmount(loan.amount),
        remaining: centsToAmount(remaining),
        payments: loan.payments.map((p: any) => ({ ...p, amount: centsToAmount(p.amount) })),
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/loans error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { type, contactName, amount, description, dueDate, reminderDays, accountId } = body;

    if (!type || !contactName || amount === undefined || !accountId) {
      return NextResponse.json({ error: "type, contactName, amount y accountId son requeridos" }, { status: 400 });
    }
    if (!["LENT", "OWED"].includes(type)) {
      return NextResponse.json({ error: "type debe ser LENT u OWED" }, { status: 400 });
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
    const loan = await db.$transaction(async (tx: any) => {
      const balanceTx = await createLoanBalanceTransaction({
        userId: session.user.id,
        accountId,
        type,
        contactName: contactName.trim(),
        amountInCents,
        db: tx,
      });

      return tx.loan.create({
        data: {
          type,
          contactName: contactName.trim(),
          amount: amountInCents,
          description: description?.trim() || null,
          dueDate: dueDate ? new Date(dueDate) : null,
          reminderDays: reminderDays ? parseInt(reminderDays) : null,
          status: "ACTIVE",
          accountId,
          balanceTransactionId: balanceTx.id,
          userId: session.user.id,
        },
        select: {
          id: true,
          type: true,
          contactName: true,
          amount: true,
          description: true,
          dueDate: true,
          status: true,
          reminderDays: true,
          createdAt: true,
        },
      });
    });

    return NextResponse.json({
      data: { ...loan, amount: centsToAmount(loan.amount), remaining: centsToAmount(loan.amount), payments: [], account },
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/loans error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
