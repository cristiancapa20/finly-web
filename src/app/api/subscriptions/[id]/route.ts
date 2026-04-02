/**
 * @module api/subscriptions/[id]
 * Manejador para actualizar y eliminar suscripciones individuales. Permite modificar detalles de la suscripción o desactivarla completamente.
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { amountInputToCents, centsToAmount } from "@/lib/money";
import { prisma } from "@/lib/prisma";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = prisma as any;

/**
 * PATCH /api/subscriptions/[id]
 * Actualiza los detalles de una suscripción existente (nombre, monto, día del mes, estado activo, cuenta, categoría).
 * @param {NextRequest} req - Solicitud HTTP con body: { name?, amount?, dayOfMonth?, isActive?, accountId?, categoryId? }
 * @param {Object} params - Parámetros de ruta incluyendo el ID de la suscripción
 * @returns {Object} Suscripción actualizada con monto convertido a formato decimal
 * @throws {401} Si no hay sesión de usuario autenticada
 * @throws {404} Si la suscripción no existe
 * @throws {400} Si los datos de entrada son inválidos
 */
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

/**
 * DELETE /api/subscriptions/[id]
 * Elimina una suscripción existente.
 * @param {NextRequest} _req - Solicitud HTTP (no se utiliza)
 * @param {Object} params - Parámetros de ruta incluyendo el ID de la suscripción
 * @returns {Object} { success: true } si la eliminación fue exitosa
 * @throws {401} Si no hay sesión de usuario autenticada
 * @throws {404} Si la suscripción no existe
 */
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
