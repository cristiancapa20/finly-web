import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { amountInputToCents, centsToAmount } from "@/lib/money";
import { prisma } from "@/lib/prisma";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = prisma as any;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const existing = await db.subscription.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Suscripción no encontrada" }, { status: 404 });
    }

    const body = await req.json();
    const updates: Record<string, any> = {};

    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.amount !== undefined) {
      const amountNum = parseFloat(body.amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return NextResponse.json({ error: "El monto debe ser mayor a 0" }, { status: 400 });
      }
      updates.amount = amountInputToCents(amountNum);
    }
    if (body.dayOfMonth !== undefined) {
      const day = parseInt(body.dayOfMonth);
      if (isNaN(day) || day < 1 || day > 31) {
        return NextResponse.json({ error: "El día debe estar entre 1 y 31" }, { status: 400 });
      }
      updates.dayOfMonth = day;
    }
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);
    if (body.accountId !== undefined) {
      const account = await db.account.findFirst({
        where: { id: body.accountId, userId: session.user.id },
      });
      if (!account) {
        return NextResponse.json({ error: "La cuenta no existe" }, { status: 400 });
      }
      updates.accountId = body.accountId;
    }
    if (body.categoryId !== undefined) {
      if (body.categoryId === null) {
        updates.categoryId = null;
      } else {
        const category = await db.category.findFirst({
          where: {
            id: body.categoryId,
            OR: [{ userId: session.user.id }, { isSystem: true }],
          },
        });
        if (!category) {
          return NextResponse.json({ error: "La categoría no existe" }, { status: 400 });
        }
        updates.categoryId = body.categoryId;
      }
    }

    const updated = await db.subscription.update({
      where: { id },
      data: updates,
      include: {
        category: { select: { id: true, name: true, color: true } },
        account: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      data: { ...updated, amount: centsToAmount(updated.amount) },
    });
  } catch (error) {
    console.error("PATCH /api/subscriptions/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const existing = await db.subscription.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Suscripción no encontrada" }, { status: 404 });
    }

    await db.subscription.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/subscriptions/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
