/**
 * @module api/subscriptions
 * Manejador para operaciones CRUD en suscripciones. Permite listar y crear suscripciones recurrentes.
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { amountInputToCents, centsToAmount } from "@/lib/money";
import { prisma } from "@/lib/prisma";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = prisma as any;

/**
 * GET /api/subscriptions
 * Obtiene todas las suscripciones del usuario con información de categoría y cuenta. Montos se convierten de centavos a formato decimal.
 * @returns {Array} Array de suscripciones con id, name, amount, dayOfMonth, categoryId, accountId, category, account
 * @throws {401} Si no hay sesión de usuario autenticada
 * @throws {500} Error interno del servidor
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const subscriptions = await db.subscription.findMany({
      where: { userId: session.user.id },
      include: {
        category: { select: { id: true, name: true, color: true } },
        account: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = subscriptions.map((s: any) => ({
      ...s,
      amount: centsToAmount(s.amount),
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/subscriptions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/subscriptions
 * Crea una nueva suscripción recurrente. Requiere nombre, monto, día del mes (1-31) y cuenta. La categoría es opcional.
 * @param {NextRequest} req - Solicitud HTTP con body: { name, amount, dayOfMonth, accountId, categoryId? }
 * @returns {Object} Suscripción creada con monto convertido a formato decimal, información de categoría y cuenta (HTTP 201)
 * @throws {401} Si no hay sesión de usuario autenticada
 * @throws {400} Si los datos requeridos son inválidos
 * @throws {500} Error interno del servidor
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, amount, dayOfMonth, categoryId, accountId } = body;

    if (!name?.trim() || amount === undefined || !dayOfMonth || !accountId) {
      return NextResponse.json({ error: "name, amount, dayOfMonth y accountId son requeridos" }, { status: 400 });
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "El monto debe ser mayor a 0" }, { status: 400 });
    }

    const day = parseInt(dayOfMonth);
    if (isNaN(day) || day < 1 || day > 31) {
      return NextResponse.json({ error: "El día debe estar entre 1 y 31" }, { status: 400 });
    }

    const account = await db.account.findFirst({
      where: { id: accountId, userId: session.user.id },
      select: { id: true, name: true },
    });
    if (!account) {
      return NextResponse.json({ error: "La cuenta seleccionada no existe" }, { status: 400 });
    }

    let category = null;
    if (categoryId) {
      category = await db.category.findFirst({
        where: {
          id: categoryId,
          OR: [{ userId: session.user.id }, { isSystem: true }],
        },
        select: { id: true, name: true, color: true },
      });
      if (!category) {
        return NextResponse.json({ error: "La categoría no existe" }, { status: 400 });
      }
    }

    const subscription = await db.subscription.create({
      data: {
        name: name.trim(),
        amount: amountInputToCents(amountNum),
        dayOfMonth: day,
        categoryId: categoryId || null,
        accountId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      data: {
        ...subscription,
        amount: centsToAmount(subscription.amount),
        category,
        account,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/subscriptions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
