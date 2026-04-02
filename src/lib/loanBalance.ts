/**
 * @module loanBalance
 * Gestión de transacciones de balance para préstamos y deudas.
 * Cuando se crea un préstamo o se registra un pago, se genera automáticamente
 * una transacción contable que afecta el saldo de la cuenta asociada.
 */

import { prisma } from "@/lib/prisma";

const CATEGORY_PRESTAMO = "Préstamo";
const CATEGORY_DEUDA = "Deuda";
const CATEGORY_FALLBACK = "Otros";

/** Tipo de préstamo: `LENT` = dinero prestado, `OWED` = deuda contraída. */
export type LoanType = "LENT" | "OWED";

/** Subconjunto del cliente Prisma necesario para operaciones de balance. */
export type DbClient = Pick<typeof prisma, "category" | "transaction">;

/**
 * Determina el tipo de transacción al crear un préstamo.
 * - `OWED` (deuda) → INCOME (recibimos dinero).
 * - `LENT` (prestado) → EXPENSE (entregamos dinero).
 * @internal
 */
function getBalanceTypeForLoan(type: LoanType) {
  return type === "OWED" ? "INCOME" : "EXPENSE";
}

/**
 * Determina el tipo de transacción al registrar un pago.
 * - `OWED` (deuda) → EXPENSE (pagamos la deuda).
 * - `LENT` (prestado) → INCOME (nos devuelven).
 * @internal
 */
function getBalanceTypeForPayment(type: LoanType) {
  return type === "OWED" ? "EXPENSE" : "INCOME";
}

/**
 * Busca la categoría del sistema adecuada para la transacción de balance.
 * Intenta primero con la categoría específica ("Préstamo" o "Deuda"),
 * luego "Otros" como fallback, y finalmente cualquier categoría del sistema.
 *
 * @param type - Tipo de préstamo.
 * @param db - Cliente de base de datos.
 * @returns ID de la categoría encontrada.
 * @throws {Error} Si no existe ninguna categoría del sistema.
 * @internal
 */
async function getBalanceCategoryId(type: LoanType, db: DbClient) {
  const categoryName = type === "LENT" ? CATEGORY_PRESTAMO : CATEGORY_DEUDA;

  const specific = await db.category.findFirst({
    where: { isSystem: true, name: categoryName },
    select: { id: true },
  });
  if (specific) return specific.id;

  const fallback = await db.category.findFirst({
    where: { isSystem: true, name: CATEGORY_FALLBACK },
    select: { id: true },
  });
  if (fallback) return fallback.id;

  const any = await db.category.findFirst({
    where: { isSystem: true },
    select: { id: true },
  });
  if (!any) throw new Error("No category available for loan balance tracking");
  return any.id;
}

/**
 * Genera la descripción para la transacción al crear un préstamo.
 * @internal
 */
function buildLoanDescription(type: LoanType, contactName: string) {
  return type === "OWED"
    ? `Dinero recibido de ${contactName} (deuda)`
    : `Dinero prestado a ${contactName}`;
}

/**
 * Genera la descripción para la transacción al registrar un pago.
 * @internal
 */
function buildPaymentDescription(type: LoanType, contactName: string) {
  return type === "OWED"
    ? `Pago de deuda a ${contactName}`
    : `Cobro de préstamo a ${contactName}`;
}

/**
 * Crea la transacción de balance al dar de alta un préstamo o deuda.
 * Registra el movimiento en la cuenta seleccionada con el tipo y descripción apropiados.
 *
 * @param input - Datos del préstamo incluyendo usuario, cuenta, tipo, contacto y monto.
 * @param input.userId - ID del usuario propietario.
 * @param input.accountId - ID de la cuenta afectada.
 * @param input.type - `"LENT"` (prestamos dinero) o `"OWED"` (nos prestan).
 * @param input.contactName - Nombre del contacto del préstamo.
 * @param input.amountInCents - Monto en centavos.
 * @param input.date - Fecha de la transacción (por defecto: hoy).
 * @param input.db - Cliente Prisma opcional (útil para transacciones atómicas).
 * @returns Objeto con el `id` de la transacción creada.
 */
export async function createLoanBalanceTransaction(input: {
  userId: string;
  accountId: string;
  type: LoanType;
  contactName: string;
  amountInCents: number;
  date?: Date;
  db?: DbClient;
}) {
  const db = input.db ?? prisma;
  const categoryId = await getBalanceCategoryId(input.type, db);

  return db.transaction.create({
    data: {
      amount: input.amountInCents,
      type: getBalanceTypeForLoan(input.type),
      categoryId,
      accountId: input.accountId,
      userId: input.userId,
      description: buildLoanDescription(input.type, input.contactName),
      date: input.date ?? new Date(),
    },
    select: { id: true },
  });
}

/**
 * Crea la transacción de balance al registrar un pago de préstamo/deuda.
 *
 * @param input - Datos del pago incluyendo usuario, cuenta, tipo, contacto y monto.
 * @returns Objeto con el `id` de la transacción creada.
 */
export async function createLoanPaymentBalanceTransaction(input: {
  userId: string;
  accountId: string;
  type: LoanType;
  contactName: string;
  amountInCents: number;
  date: Date;
  db?: DbClient;
}) {
  const db = input.db ?? prisma;
  const categoryId = await getBalanceCategoryId(input.type, db);

  return db.transaction.create({
    data: {
      amount: input.amountInCents,
      type: getBalanceTypeForPayment(input.type),
      categoryId,
      accountId: input.accountId,
      userId: input.userId,
      description: buildPaymentDescription(input.type, input.contactName),
      date: input.date,
    },
    select: { id: true },
  });
}

/**
 * Elimina una transacción de balance asociada a un préstamo.
 * No-op si el `transactionId` es `null` o `undefined`.
 *
 * @param transactionId - ID de la transacción a eliminar (puede ser nulo).
 * @param userId - ID del usuario propietario (validación de seguridad).
 * @param db - Cliente Prisma opcional.
 */
export async function deleteBalanceTransaction(
  transactionId: string | null | undefined,
  userId: string,
  db: DbClient = prisma
) {
  if (!transactionId) return;

  await db.transaction.deleteMany({
    where: { id: transactionId, userId },
  });
}
