/**
 * @module api/cron/subscriptions
 * Manejador de cron job para procesar suscripciones activas. Crea transacciones automáticas en las fechas especificadas de suscripción. Se ejecuta con autenticación por token de secreto.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = prisma as any;

/**
 * GET /api/cron/subscriptions
 * Procesa todas las suscripciones activas cuya fecha de vencimiento es hoy. Crea una transacción por cada suscripción y previene duplicados. Usa zona horaria de Ecuador (UTC-5).
 * @param {NextRequest} req - Solicitud HTTP con header Authorization: Bearer {CRON_SECRET}
 * @returns {Object} { processed: number } - Cantidad de suscripciones procesadas
 * @throws {401} Si el token de autorización (CRON_SECRET) es inválido
 * @throws {500} Error interno del servidor
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Use Ecuador timezone (UTC-5) to determine the current date
    const nowUtc = new Date();
    const ecuadorOffset = -5 * 60 * 60 * 1000;
    const nowEcuador = new Date(nowUtc.getTime() + ecuadorOffset);
    const dayOfMonth = nowEcuador.getUTCDate();
    const lastDayOfMonth = new Date(
      nowEcuador.getUTCFullYear(),
      nowEcuador.getUTCMonth() + 1,
      0
    ).getUTCDate();

    // Find active subscriptions due today.
    // If today is the last day of the month, also process subscriptions
    // with dayOfMonth > lastDayOfMonth (e.g., day 31 in a 30-day month).
    const whereClause: any = {
      isActive: true,
      dayOfMonth: dayOfMonth,
    };

    if (dayOfMonth === lastDayOfMonth) {
      whereClause.dayOfMonth = undefined;
      whereClause.OR = [
        { dayOfMonth: dayOfMonth },
        { dayOfMonth: { gt: lastDayOfMonth } },
      ];
    }

    const subscriptions = await db.subscription.findMany({
      where: whereClause,
      include: { account: true },
    });

    let created = 0;
    // Store with T12:00:00 to match how normal transactions are stored
    const dateOnly = new Date(
      `${nowEcuador.getUTCFullYear()}-${String(nowEcuador.getUTCMonth() + 1).padStart(2, "0")}-${String(nowEcuador.getUTCDate()).padStart(2, "0")}T12:00:00`
    );

    for (const sub of subscriptions) {
      // categoryId is required for transactions; skip if not set.
      if (!sub.categoryId) {
        console.warn(`[cron/subscriptions] Skipping "${sub.name}" (no category)`);
        continue;
      }

      // Check if a transaction was already created today for this subscription
      // to prevent duplicates on cron retries.
      const existing = await db.transaction.findFirst({
        where: {
          userId: sub.userId,
          accountId: sub.accountId,
          amount: sub.amount,
          description: `Suscripción: ${sub.name}`,
          date: dateOnly,
          isDeleted: false,
        },
      });

      if (existing) continue;

      await db.transaction.create({
        data: {
          amount: sub.amount,
          type: "EXPENSE",
          categoryId: sub.categoryId,
          accountId: sub.accountId,
          userId: sub.userId,
          description: `Suscripción: ${sub.name}`,
          date: dateOnly,
        },
      });
      created++;
    }

    console.log(`[cron/subscriptions] Processed ${created} subscriptions`);
    return NextResponse.json({ processed: created });
  } catch (error) {
    console.error("[cron/subscriptions] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
