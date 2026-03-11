import { prisma } from "@/lib/prisma";

const SYSTEM_CATEGORY_FALLBACK = "Otros";

type LoanType = "LENT" | "OWED";
type DbClient = typeof prisma;

function getBalanceTypeForLoan(type: LoanType) {
  return type === "OWED" ? "INCOME" : "EXPENSE";
}

function getBalanceTypeForPayment(type: LoanType) {
  return type === "OWED" ? "EXPENSE" : "INCOME";
}

async function getBalanceCategoryId(userId: string, db: DbClient) {
  const category = await db.category.findFirst({
    where: {
      OR: [
        { userId, name: SYSTEM_CATEGORY_FALLBACK },
        { isSystem: true, name: SYSTEM_CATEGORY_FALLBACK },
        { userId },
        { isSystem: true },
      ],
    },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    select: { id: true },
  });

  if (!category) {
    throw new Error("No category available for loan balance tracking");
  }

  return category.id;
}

function buildLoanDescription(type: LoanType, contactName: string) {
  return type === "OWED"
    ? `Ingreso por deuda con ${contactName}`
    : `Prestamo entregado a ${contactName}`;
}

function buildPaymentDescription(type: LoanType, contactName: string) {
  return type === "OWED"
    ? `Pago de deuda a ${contactName}`
    : `Cobro de prestamo a ${contactName}`;
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
  const categoryId = await getBalanceCategoryId(input.userId, db);

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
  const categoryId = await getBalanceCategoryId(input.userId, db);

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
