-- AlterTable
ALTER TABLE "Expense" ADD COLUMN "approvedAt" DATETIME;
ALTER TABLE "Expense" ADD COLUMN "approvedBy" TEXT;
ALTER TABLE "Expense" ADD COLUMN "rejectedAt" DATETIME;
ALTER TABLE "Expense" ADD COLUMN "rejectedBy" TEXT;
