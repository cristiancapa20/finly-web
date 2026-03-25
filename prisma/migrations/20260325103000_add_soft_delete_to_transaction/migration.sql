-- Add soft-delete fields for transactions
ALTER TABLE "Transaction" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Transaction" ADD COLUMN "deletedAt" DATETIME;
