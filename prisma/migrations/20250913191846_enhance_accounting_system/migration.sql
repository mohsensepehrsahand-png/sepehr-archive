/*
  Warnings:

  - Added the required column `code` to the `Account` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."BankTransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'RECONCILE');

-- AlterTable
ALTER TABLE "public"."Account" ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "parentId" TEXT;

-- CreateTable
CREATE TABLE "public"."Bank" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branch" TEXT,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BankTransaction" (
    "id" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "type" "public"."BankTransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "reference" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bank_projectId_idx" ON "public"."Bank"("projectId");

-- CreateIndex
CREATE INDEX "BankTransaction_bankId_idx" ON "public"."BankTransaction"("bankId");

-- CreateIndex
CREATE INDEX "BankTransaction_date_idx" ON "public"."BankTransaction"("date");

-- CreateIndex
CREATE INDEX "Account_projectId_code_idx" ON "public"."Account"("projectId", "code");

-- CreateIndex
CREATE INDEX "Account_parentId_idx" ON "public"."Account"("parentId");

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bank" ADD CONSTRAINT "Bank_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BankTransaction" ADD CONSTRAINT "BankTransaction_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "public"."Bank"("id") ON DELETE CASCADE ON UPDATE CASCADE;
