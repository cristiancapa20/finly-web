/**
 * @module prisma
 * Tipos derivados del esquema Prisma para uso en la aplicación.
 */

/**
 * Tipos de transacción soportados
 * @typedef {"INCOME" | "EXPENSE"} TransactionType
 */
export type TransactionType = 'INCOME' | 'EXPENSE'

/**
 * Tipos de cuenta bancaria o de efectivo
 * - CASH: Efectivo en mano
 * - BANK: Cuenta de ahorro o corriente
 * - CREDIT_CARD: Tarjeta de crédito
 * - OTHER: Otro tipo de cuenta
 * @typedef {"CASH" | "BANK" | "CREDIT_CARD" | "OTHER"} AccountType
 */
export type AccountType = 'CASH' | 'BANK' | 'CREDIT_CARD' | 'OTHER'
