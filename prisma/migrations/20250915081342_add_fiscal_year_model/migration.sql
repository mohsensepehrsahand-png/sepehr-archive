/*
  Warnings:

  - A unique constraint covering the columns `[fiscalYearId,groupId,code]` on the table `AccountClass` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[fiscalYearId,subClassId,code]` on the table `AccountDetail` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[fiscalYearId,code]` on the table `AccountGroup` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[fiscalYearId,classId,code]` on the table `AccountSubClass` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[fiscalYearId,accountId]` on the table `Ledger` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fiscalYearId` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fiscalYearId` to the `AccountClass` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fiscalYearId` to the `AccountDetail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fiscalYearId` to the `AccountGroup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fiscalYearId` to the `AccountSubClass` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fiscalYearId` to the `Bank` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fiscalYearId` to the `Bill` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fiscalYearId` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fiscalYearId` to the `Ledger` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fiscalYearId` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."AccountClass" DROP CONSTRAINT "AccountClass_groupId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AccountDetail" DROP CONSTRAINT "AccountDetail_subClassId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AccountSubClass" DROP CONSTRAINT "AccountSubClass_classId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Bill" DROP CONSTRAINT "Bill_accountId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Invoice" DROP CONSTRAINT "Invoice_accountId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Ledger" DROP CONSTRAINT "Ledger_accountId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_accountId_fkey";

-- DropIndex
DROP INDEX "public"."Account_projectId_code_idx";

-- DropIndex
DROP INDEX "public"."Account_projectId_type_idx";

-- DropIndex
DROP INDEX "public"."AccountClass_projectId_groupId_code_key";

-- DropIndex
DROP INDEX "public"."AccountClass_projectId_groupId_sortOrder_idx";

-- DropIndex
DROP INDEX "public"."AccountDetail_projectId_subClassId_code_key";

-- DropIndex
DROP INDEX "public"."AccountDetail_projectId_subClassId_sortOrder_idx";

-- DropIndex
DROP INDEX "public"."AccountGroup_projectId_code_key";

-- DropIndex
DROP INDEX "public"."AccountGroup_projectId_sortOrder_idx";

-- DropIndex
DROP INDEX "public"."AccountSubClass_projectId_classId_code_key";

-- DropIndex
DROP INDEX "public"."AccountSubClass_projectId_classId_sortOrder_idx";

-- DropIndex
DROP INDEX "public"."Bill_projectId_date_idx";

-- DropIndex
DROP INDEX "public"."Invoice_projectId_date_idx";

-- DropIndex
DROP INDEX "public"."Ledger_projectId_accountId_key";

-- DropIndex
DROP INDEX "public"."Transaction_projectId_date_idx";

-- AlterTable
ALTER TABLE "public"."Account" ADD COLUMN     "fiscalYearId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."AccountClass" ADD COLUMN     "fiscalYearId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."AccountDetail" ADD COLUMN     "fiscalYearId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."AccountGroup" ADD COLUMN     "fiscalYearId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."AccountSubClass" ADD COLUMN     "fiscalYearId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Bank" ADD COLUMN     "fiscalYearId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Bill" ADD COLUMN     "fiscalYearId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Invoice" ADD COLUMN     "fiscalYearId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Ledger" ADD COLUMN     "fiscalYearId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Transaction" ADD COLUMN     "fiscalYearId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."FiscalYear" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalYear_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FiscalYear_projectId_year_key" ON "public"."FiscalYear"("projectId", "year");

-- CreateIndex
CREATE INDEX "Account_fiscalYearId_type_idx" ON "public"."Account"("fiscalYearId", "type");

-- CreateIndex
CREATE INDEX "Account_fiscalYearId_code_idx" ON "public"."Account"("fiscalYearId", "code");

-- CreateIndex
CREATE INDEX "AccountClass_fiscalYearId_groupId_sortOrder_idx" ON "public"."AccountClass"("fiscalYearId", "groupId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "AccountClass_fiscalYearId_groupId_code_key" ON "public"."AccountClass"("fiscalYearId", "groupId", "code");

-- CreateIndex
CREATE INDEX "AccountDetail_fiscalYearId_subClassId_sortOrder_idx" ON "public"."AccountDetail"("fiscalYearId", "subClassId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "AccountDetail_fiscalYearId_subClassId_code_key" ON "public"."AccountDetail"("fiscalYearId", "subClassId", "code");

-- CreateIndex
CREATE INDEX "AccountGroup_fiscalYearId_sortOrder_idx" ON "public"."AccountGroup"("fiscalYearId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "AccountGroup_fiscalYearId_code_key" ON "public"."AccountGroup"("fiscalYearId", "code");

-- CreateIndex
CREATE INDEX "AccountSubClass_fiscalYearId_classId_sortOrder_idx" ON "public"."AccountSubClass"("fiscalYearId", "classId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "AccountSubClass_fiscalYearId_classId_code_key" ON "public"."AccountSubClass"("fiscalYearId", "classId", "code");

-- CreateIndex
CREATE INDEX "Bank_fiscalYearId_idx" ON "public"."Bank"("fiscalYearId");

-- CreateIndex
CREATE INDEX "Bill_fiscalYearId_date_idx" ON "public"."Bill"("fiscalYearId", "date");

-- CreateIndex
CREATE INDEX "Invoice_fiscalYearId_date_idx" ON "public"."Invoice"("fiscalYearId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Ledger_fiscalYearId_accountId_key" ON "public"."Ledger"("fiscalYearId", "accountId");

-- CreateIndex
CREATE INDEX "Transaction_fiscalYearId_date_idx" ON "public"."Transaction"("fiscalYearId", "date");

-- AddForeignKey
ALTER TABLE "public"."FiscalYear" ADD CONSTRAINT "FiscalYear_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountGroup" ADD CONSTRAINT "AccountGroup_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "public"."FiscalYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountClass" ADD CONSTRAINT "AccountClass_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "public"."FiscalYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountClass" ADD CONSTRAINT "AccountClass_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."AccountGroup"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountSubClass" ADD CONSTRAINT "AccountSubClass_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "public"."FiscalYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountSubClass" ADD CONSTRAINT "AccountSubClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."AccountClass"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountDetail" ADD CONSTRAINT "AccountDetail_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "public"."FiscalYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountDetail" ADD CONSTRAINT "AccountDetail_subClassId_fkey" FOREIGN KEY ("subClassId") REFERENCES "public"."AccountSubClass"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "public"."FiscalYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "public"."FiscalYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "public"."FiscalYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bill" ADD CONSTRAINT "Bill_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "public"."FiscalYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bill" ADD CONSTRAINT "Bill_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Ledger" ADD CONSTRAINT "Ledger_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "public"."FiscalYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Ledger" ADD CONSTRAINT "Ledger_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bank" ADD CONSTRAINT "Bank_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "public"."FiscalYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
