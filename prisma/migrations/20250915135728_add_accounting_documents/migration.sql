/*
  Warnings:

  - You are about to drop the column `fiscalYearId` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `fiscalYearId` on the `AccountClass` table. All the data in the column will be lost.
  - You are about to drop the column `fiscalYearId` on the `AccountDetail` table. All the data in the column will be lost.
  - You are about to drop the column `fiscalYearId` on the `AccountGroup` table. All the data in the column will be lost.
  - You are about to drop the column `fiscalYearId` on the `AccountSubClass` table. All the data in the column will be lost.
  - You are about to drop the column `fiscalYearId` on the `Bank` table. All the data in the column will be lost.
  - You are about to drop the column `fiscalYearId` on the `Bill` table. All the data in the column will be lost.
  - You are about to drop the column `fiscalYearId` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `fiscalYearId` on the `Ledger` table. All the data in the column will be lost.
  - You are about to drop the column `fiscalYearId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `FiscalYear` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[projectId,groupId,code]` on the table `AccountClass` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,subClassId,code]` on the table `AccountDetail` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,code]` on the table `AccountGroup` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,classId,code]` on the table `AccountSubClass` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,accountId]` on the table `Ledger` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."Account" DROP CONSTRAINT "Account_fiscalYearId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AccountClass" DROP CONSTRAINT "AccountClass_fiscalYearId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AccountClass" DROP CONSTRAINT "AccountClass_groupId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AccountDetail" DROP CONSTRAINT "AccountDetail_fiscalYearId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AccountDetail" DROP CONSTRAINT "AccountDetail_subClassId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AccountGroup" DROP CONSTRAINT "AccountGroup_fiscalYearId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AccountSubClass" DROP CONSTRAINT "AccountSubClass_classId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AccountSubClass" DROP CONSTRAINT "AccountSubClass_fiscalYearId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Bank" DROP CONSTRAINT "Bank_fiscalYearId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Bill" DROP CONSTRAINT "Bill_accountId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Bill" DROP CONSTRAINT "Bill_fiscalYearId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FiscalYear" DROP CONSTRAINT "FiscalYear_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Invoice" DROP CONSTRAINT "Invoice_accountId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Invoice" DROP CONSTRAINT "Invoice_fiscalYearId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Ledger" DROP CONSTRAINT "Ledger_accountId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Ledger" DROP CONSTRAINT "Ledger_fiscalYearId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_accountId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_fiscalYearId_fkey";

-- DropIndex
DROP INDEX "public"."Account_fiscalYearId_code_idx";

-- DropIndex
DROP INDEX "public"."Account_fiscalYearId_type_idx";

-- DropIndex
DROP INDEX "public"."AccountClass_fiscalYearId_groupId_code_key";

-- DropIndex
DROP INDEX "public"."AccountClass_fiscalYearId_groupId_sortOrder_idx";

-- DropIndex
DROP INDEX "public"."AccountDetail_fiscalYearId_subClassId_code_key";

-- DropIndex
DROP INDEX "public"."AccountDetail_fiscalYearId_subClassId_sortOrder_idx";

-- DropIndex
DROP INDEX "public"."AccountGroup_fiscalYearId_code_key";

-- DropIndex
DROP INDEX "public"."AccountGroup_fiscalYearId_sortOrder_idx";

-- DropIndex
DROP INDEX "public"."AccountSubClass_fiscalYearId_classId_code_key";

-- DropIndex
DROP INDEX "public"."AccountSubClass_fiscalYearId_classId_sortOrder_idx";

-- DropIndex
DROP INDEX "public"."Bank_fiscalYearId_idx";

-- DropIndex
DROP INDEX "public"."Bill_fiscalYearId_date_idx";

-- DropIndex
DROP INDEX "public"."Invoice_fiscalYearId_date_idx";

-- DropIndex
DROP INDEX "public"."Ledger_fiscalYearId_accountId_key";

-- DropIndex
DROP INDEX "public"."Transaction_fiscalYearId_date_idx";

-- AlterTable
ALTER TABLE "public"."Account" DROP COLUMN "fiscalYearId";

-- AlterTable
ALTER TABLE "public"."AccountClass" DROP COLUMN "fiscalYearId";

-- AlterTable
ALTER TABLE "public"."AccountDetail" DROP COLUMN "fiscalYearId";

-- AlterTable
ALTER TABLE "public"."AccountGroup" DROP COLUMN "fiscalYearId";

-- AlterTable
ALTER TABLE "public"."AccountSubClass" DROP COLUMN "fiscalYearId";

-- AlterTable
ALTER TABLE "public"."Bank" DROP COLUMN "fiscalYearId";

-- AlterTable
ALTER TABLE "public"."Bill" DROP COLUMN "fiscalYearId";

-- AlterTable
ALTER TABLE "public"."Invoice" DROP COLUMN "fiscalYearId";

-- AlterTable
ALTER TABLE "public"."Ledger" DROP COLUMN "fiscalYearId";

-- AlterTable
ALTER TABLE "public"."Transaction" DROP COLUMN "fiscalYearId";

-- DropTable
DROP TABLE "public"."FiscalYear";

-- CreateTable
CREATE TABLE "public"."AccountingDocument" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "documentDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "totalDebit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCredit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AccountingEntry" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "accountCode" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "description" TEXT,
    "debit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "credit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accountNature" "public"."AccountNature",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountingDocument_projectId_idx" ON "public"."AccountingDocument"("projectId");

-- CreateIndex
CREATE INDEX "AccountingDocument_projectId_documentNumber_idx" ON "public"."AccountingDocument"("projectId", "documentNumber");

-- CreateIndex
CREATE INDEX "AccountingDocument_documentDate_idx" ON "public"."AccountingDocument"("documentDate");

-- CreateIndex
CREATE INDEX "AccountingEntry_documentId_idx" ON "public"."AccountingEntry"("documentId");

-- CreateIndex
CREATE INDEX "AccountingEntry_accountCode_idx" ON "public"."AccountingEntry"("accountCode");

-- CreateIndex
CREATE INDEX "Account_projectId_type_idx" ON "public"."Account"("projectId", "type");

-- CreateIndex
CREATE INDEX "Account_projectId_code_idx" ON "public"."Account"("projectId", "code");

-- CreateIndex
CREATE INDEX "AccountClass_projectId_groupId_sortOrder_idx" ON "public"."AccountClass"("projectId", "groupId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "AccountClass_projectId_groupId_code_key" ON "public"."AccountClass"("projectId", "groupId", "code");

-- CreateIndex
CREATE INDEX "AccountDetail_projectId_subClassId_sortOrder_idx" ON "public"."AccountDetail"("projectId", "subClassId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "AccountDetail_projectId_subClassId_code_key" ON "public"."AccountDetail"("projectId", "subClassId", "code");

-- CreateIndex
CREATE INDEX "AccountGroup_projectId_sortOrder_idx" ON "public"."AccountGroup"("projectId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "AccountGroup_projectId_code_key" ON "public"."AccountGroup"("projectId", "code");

-- CreateIndex
CREATE INDEX "AccountSubClass_projectId_classId_sortOrder_idx" ON "public"."AccountSubClass"("projectId", "classId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "AccountSubClass_projectId_classId_code_key" ON "public"."AccountSubClass"("projectId", "classId", "code");

-- CreateIndex
CREATE INDEX "Bill_projectId_date_idx" ON "public"."Bill"("projectId", "date");

-- CreateIndex
CREATE INDEX "Invoice_projectId_date_idx" ON "public"."Invoice"("projectId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Ledger_projectId_accountId_key" ON "public"."Ledger"("projectId", "accountId");

-- CreateIndex
CREATE INDEX "Transaction_projectId_date_idx" ON "public"."Transaction"("projectId", "date");

-- AddForeignKey
ALTER TABLE "public"."AccountClass" ADD CONSTRAINT "AccountClass_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."AccountGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountSubClass" ADD CONSTRAINT "AccountSubClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."AccountClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountDetail" ADD CONSTRAINT "AccountDetail_subClassId_fkey" FOREIGN KEY ("subClassId") REFERENCES "public"."AccountSubClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bill" ADD CONSTRAINT "Bill_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Ledger" ADD CONSTRAINT "Ledger_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountingDocument" ADD CONSTRAINT "AccountingDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountingEntry" ADD CONSTRAINT "AccountingEntry_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."AccountingDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
