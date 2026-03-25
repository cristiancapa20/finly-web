import { prisma } from "@/lib/prisma";

const CATEGORY_PRESTAMO = "Préstamo";
const CATEGORY_DEUDA = "Deuda";
const CATEGORY_FALLBACK = "Otros";

type LoanType = "LENT" | "OWED";
type DbClient = Pick<typeof prisma, "category" | "transaction">;

function getBalanceTypeForLoan(type: LoanType) {
  return type === "OWED" ? "INCOME" : "EXPENSE";
}

function getBalanceTypeForPayment(type: LoanType) {
  return type === "OWED" ? "EXPENSE" : "INCOME";
}

async function getBalanceCategoryId(type: LoanType, db: DbClient) {
  const categoryName = type === "LENT" ? CATEGORY_PRESTAMO : CATEGORY_DEUDA;

  // Busca primero la categoría específica del tipo de préstamo
  const specific = await db.category.findFirst({
    where: { isSystem: true, name: categoryName },
    select: { id: true },
  });
  if (specific) return specific.id;

  // Si no existe, usa "Otros" como fallback
  const fallback = await db.category.findFirst({
    where: { isSystem: true, name: CATEGORY_FALLBACK },
    select: { id: true },
  });
  if (fallback) return fallback.id;

  // Último recurso: cualquier categoría del sistema
  const any = await db.category.findFirst({
    where: { isSystem: true },
    select: { id: true },
  });
  if (!any) throw new Error("No category available for loan balance tracking");
  return any.id;
}

function buildLoanDescription(type: LoanType, contactName: string) {
  return type === "OWED"
    ? `Dinero recibido de ${contactName} (deuda)`
    : `Dinero prestado a ${contactName}`;
}

function buildPaymentDescription(type: LoanType, contactName: string) {
  return type === "OWED"
    ? `Pago de deuda a ${contactName}`
    : `Cobro de préstamo a ${contactName}`;
}

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
