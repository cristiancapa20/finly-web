-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Loan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "reminderDays" INTEGER,
    "accountId" TEXT,
    "balanceTransactionId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Loan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Loan_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Loan" ("amount", "contactName", "createdAt", "description", "dueDate", "id", "reminderDays", "status", "type", "updatedAt", "userId") SELECT "amount", "contactName", "createdAt", "description", "dueDate", "id", "reminderDays", "status", "type", "updatedAt", "userId" FROM "Loan";
DROP TABLE "Loan";
ALTER TABLE "new_Loan" RENAME TO "Loan";
CREATE UNIQUE INDEX "Loan_balanceTransactionId_key" ON "Loan"("balanceTransactionId");

CREATE TABLE "new_LoanPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "loanId" TEXT NOT NULL,
    "accountId" TEXT,
    "balanceTransactionId" TEXT,
    "amount" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoanPayment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LoanPayment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_LoanPayment" ("amount", "createdAt", "date", "id", "loanId", "note") SELECT "amount", "createdAt", "date", "id", "loanId", "note" FROM "LoanPayment";
DROP TABLE "LoanPayment";
ALTER TABLE "new_LoanPayment" RENAME TO "LoanPayment";
CREATE UNIQUE INDEX "LoanPayment_balanceTransactionId_key" ON "LoanPayment"("balanceTransactionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
