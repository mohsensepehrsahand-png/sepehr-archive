/*
  Warnings:

  - A unique constraint covering the columns `[projectId,fiscalYearId,groupId,code]` on the table `AccountClass` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,fiscalYearId,subClassId,code]` on the table `AccountDetail` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,fiscalYearId,code]` on the table `AccountGroup` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,fiscalYearId,classId,code]` on the table `AccountSubClass` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,fiscalYearId,accountId]` on the table `Ledger` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."AccountClass_projectId_groupId_code_key";

-- DropIndex
DROP INDEX "public"."AccountDetail_projectId_subClassId_code_key";

-- DropIndex
DROP INDEX "public"."AccountGroup_projectId_code_key";

-- DropIndex
DROP INDEX "public"."AccountSubClass_projectId_classId_code_key";

-- DropIndex
DROP INDEX "public"."Ledger_projectId_accountId_key";

-- AlterTable
ALTER TABLE "public"."Account" ADD COLUMN     "fiscalYearId" TEXT;

-- AlterTable
ALTER TABLE "public"."AccountClass" ADD COLUMN     "fiscalYearId" TEXT;

-- AlterTable
ALTER TABLE "public"."AccountDetail" ADD COLUMN     "fiscalYearId" TEXT;

-- AlterTable
ALTER TABLE "public"."AccountGroup" ADD COLUMN     "fiscalYearId" TEXT;

-- AlterTable
ALTER TABLE "public"."AccountSubClass" ADD COLUMN     "fiscalYearId" TEXT;

-- AlterTable
ALTER TABLE "public"."AccountingDocument" ADD COLUMN     "fiscalYearId" TEXT;

-- AlterTable
ALTER TABLE "public"."Bank" ADD COLUMN     "fiscalYearId" TEXT;

-- AlterTable
ALTER TABLE "public"."Bill" ADD COLUMN     "fiscalYearId" TEXT;

-- AlterTable
ALTER TABLE "public"."CommonDescription" ADD COLUMN     "fiscalYearId" TEXT;

-- AlterTable
ALTER TABLE "public"."Invoice" ADD COLUMN     "fiscalYearId" TEXT;

-- AlterTable
ALTER TABLE "public"."Ledger" ADD COLUMN     "fiscalYearId" TEXT;

-- AlterTable
ALTER TABLE "public"."Transaction" ADD COLUMN     "fiscalYearId" TEXT;

-- CreateIndex
CREATE INDEX "Account_fiscalYearId_idx" ON "public"."Account"("fiscalYearId");

-- CreateIndex
CREATE INDEX "AccountClass_fiscalYearId_idx" ON "public"."AccountClass"("fiscalYearId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountClass_projectId_fiscalYearId_groupId_code_key" ON "public"."AccountClass"("projectId", "fiscalYearId", "groupId", "code");

-- CreateIndex
CREATE INDEX "AccountDetail_fiscalYearId_idx" ON "public"."AccountDetail"("fiscalYearId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountDetail_projectId_fiscalYearId_subClassId_code_key" ON "public"."AccountDetail"("projectId", "fiscalYearId", "subClassId", "code");

-- CreateIndex
CREATE INDEX "AccountGroup_fiscalYearId_idx" ON "public"."AccountGroup"("fiscalYearId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountGroup_projectId_fiscalYearId_code_key" ON "public"."AccountGroup"("projectId", "fiscalYearId", "code");

-- CreateIndex
CREATE INDEX "AccountSubClass_fiscalYearId_idx" ON "public"."AccountSubClass"("fiscalYearId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountSubClass_projectId_fiscalYearId_classId_code_key" ON "public"."AccountSubClass"("projectId", "fiscalYearId", "classId", "code");

-- CreateIndex
CREATE INDEX "AccountingDocument_fiscalYearId_idx" ON "public"."AccountingDocument"("fiscalYearId");

-- CreateIndex
CREATE INDEX "Bank_fiscalYearId_idx" ON "public"."Bank"("fiscalYearId");

-- CreateIndex
CREATE INDEX "Bill_fiscalYearId_idx" ON "public"."Bill"("fiscalYearId");

-- CreateIndex
CREATE INDEX "CommonDescription_fiscalYearId_idx" ON "public"."CommonDescription"("fiscalYearId");

-- CreateIndex
CREATE INDEX "Invoice_fiscalYearId_idx" ON "public"."Invoice"("fiscalYearId");

-- CreateIndex
CREATE INDEX "Ledger_fiscalYearId_idx" ON "public"."Ledger"("fiscalYearId");

-- CreateIndex
CREATE UNIQUE INDEX "Ledger_projectId_fiscalYearId_accountId_key" ON "public"."Ledger"("projectId", "fiscalYearId", "accountId");

-- CreateIndex
CREATE INDEX "Transaction_fiscalYearId_idx" ON "public"."Transaction"("fiscalYearId");

-- AddForeignKey
ALTER TABLE "public"."AccountGroup" ADD CONSTRAINT "AccountGroup_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "public"."FiscalYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountClass" ADD CONSTRAINT "AccountClass_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "public"."FiscalYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountSubClass" ADD CONSTRAINT "AccountSubClass_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "public"."FiscalYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountDetail" ADD CONSTRAINT "AccountDetail_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "public"."FiscalYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "public"."FiscalYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "public"."FiscalYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "public"."FiscalYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bill" ADD CONSTRAINT "Bill_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "public"."FiscalYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Ledger" ADD CONSTRAINT "Ledger_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "public"."FiscalYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bank" ADD CONSTRAINT "Bank_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "public"."FiscalYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountingDocument" ADD CONSTRAINT "AccountingDocument_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "public"."FiscalYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommonDescription" ADD CONSTRAINT "CommonDescription_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "public"."FiscalYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
