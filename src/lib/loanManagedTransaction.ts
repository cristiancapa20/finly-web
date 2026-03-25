import { prisma } from "@/lib/prisma";

/** Transacción enlazada al alta de un préstamo/deuda o a un pago registrado en Préstamos. */
export async function getLoanManagedTransactionIds(
  userId: string,
  transactionIds: string[]
): Promise<Set<string>> {
  if (transactionIds.length === 0) return new Set();

  const [loans, payments] = await Promise.all([
    prisma.loan.findMany({
      where: { userId, balanceTransactionId: { in: transactionIds } },
      select: { balanceTransactionId: true },
    }),
    prisma.loanPayment.findMany({
      where: {
        balanceTransactionId: { in: transactionIds },
        loan: { userId },
      },
      select: { balanceTransactionId: true },
    }),
  ]);

  const out = new Set<string>();
  for (const l of loans) {
    if (l.balanceTransactionId) out.add(l.balanceTransactionId);
  }
  for (const p of payments) {
    if (p.balanceTransactionId) out.add(p.balanceTransactionId);
  }
  return out;
}

export async function isLoanManagedTransaction(
  transactionId: string,
  userId: string
): Promise<boolean> {
  const ids = await getLoanManagedTransactionIds(userId, [transactionId]);
  return ids.has(transactionId);
}
