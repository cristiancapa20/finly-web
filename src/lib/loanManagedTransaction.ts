/**
 * @module loanManagedTransaction
 * Utilidades para identificar transacciones que fueron creadas automáticamente
 * por el módulo de préstamos. Estas transacciones no deben ser editadas
 * ni eliminadas directamente por el usuario desde la vista de transacciones.
 */

import { prisma } from "@/lib/prisma";

/**
 * Obtiene los IDs de transacciones que están vinculadas a préstamos o pagos de préstamos.
 * Consulta tanto la tabla `Loan` como `LoanPayment` para encontrar coincidencias.
 *
 * @param userId - ID del usuario propietario de los préstamos.
 * @param transactionIds - Lista de IDs de transacciones a verificar.
 * @returns Set con los IDs de transacciones que son gestionadas por el módulo de préstamos.
 */
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

/**
 * Verifica si una transacción individual fue creada por el módulo de préstamos.
 *
 * @param transactionId - ID de la transacción a verificar.
 * @param userId - ID del usuario propietario.
 * @returns `true` si la transacción es gestionada por préstamos.
 */
export async function isLoanManagedTransaction(
  transactionId: string,
  userId: string
): Promise<boolean> {
  const ids = await getLoanManagedTransactionIds(userId, [transactionId]);
  return ids.has(transactionId);
}
