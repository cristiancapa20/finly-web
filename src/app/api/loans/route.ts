import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = prisma as any;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const loans = await db.loan.findMany({
      where: { userId: session.user.id },
      include: {
        payments: {
          orderBy: { date: "desc" },
          select: { id: true, amount: true, date: true, note: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = loans.map((loan: any) => {
      const paid = loan.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
      const remaining = Math.max(0, loan.amount - paid);
      return {
        ...loan,
        amount: loan.amount / 100,
        remaining: remaining / 100,
        payments: loan.payments.map((p: any) => ({ ...p, amount: p.amount / 100 })),
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
    const { type, contactName, amount, description, dueDate, reminderDays } = body;

    if (!type || !contactName || amount === undefined) {
      return NextResponse.json({ error: "type, contactName y amount son requeridos" }, { status: 400 });
    }
    if (!["LENT", "OWED"].includes(type)) {
      return NextResponse.json({ error: "type debe ser LENT u OWED" }, { status: 400 });
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "El monto debe ser mayor a 0" }, { status: 400 });
    }

    const loan = await db.loan.create({
      data: {
        type,
        contactName: contactName.trim(),
        amount: Math.round(amountNum * 100),
        description: description?.trim() || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        reminderDays: reminderDays ? parseInt(reminderDays) : null,
        status: "ACTIVE",
        userId: session.user.id,
      },
      select: { id: true, type: true, contactName: true, amount: true, description: true, dueDate: true, status: true, reminderDays: true, createdAt: true },
    });

    return NextResponse.json({
      data: { ...loan, amount: loan.amount / 100, remaining: loan.amount / 100, payments: [] },
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/loans error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
