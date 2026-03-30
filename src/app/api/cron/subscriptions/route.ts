import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = prisma as any;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    const dayOfMonth = today.getDate();
    const lastDayOfMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).getDate();

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
    const dateOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
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
