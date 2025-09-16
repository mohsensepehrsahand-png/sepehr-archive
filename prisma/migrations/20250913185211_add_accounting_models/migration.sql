-- CreateEnum
CREATE TYPE "public"."AccountType" AS ENUM ('CUSTOMER', 'CONTRACTOR', 'SUPPLIER', 'EXPENSE', 'INCOME', 'ASSET', 'LIABILITY', 'EQUITY');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "public"."JournalType" AS ENUM ('DAYBOOK', 'GENERAL_LEDGER', 'SUBSIDIARY');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('PAID', 'PARTIAL', 'UNPAID');

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."AccountType" NOT NULL,
    "contact" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Transaction" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "public"."TransactionType" NOT NULL,
    "journalType" "public"."JournalType" NOT NULL,
    "description" TEXT,
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'UNPAID',
    "description" TEXT,
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Bill" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'UNPAID',
    "description" TEXT,
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Ledger" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Account_projectId_idx" ON "public"."Account"("projectId");

-- CreateIndex
CREATE INDEX "Account_projectId_type_idx" ON "public"."Account"("projectId", "type");

-- CreateIndex
CREATE INDEX "Transaction_projectId_idx" ON "public"."Transaction"("projectId");

-- CreateIndex
CREATE INDEX "Transaction_projectId_date_idx" ON "public"."Transaction"("projectId", "date");

-- CreateIndex
CREATE INDEX "Transaction_accountId_idx" ON "public"."Transaction"("accountId");

-- CreateIndex
CREATE INDEX "Transaction_journalType_idx" ON "public"."Transaction"("journalType");

-- CreateIndex
CREATE INDEX "Invoice_projectId_idx" ON "public"."Invoice"("projectId");

-- CreateIndex
CREATE INDEX "Invoice_projectId_date_idx" ON "public"."Invoice"("projectId", "date");

-- CreateIndex
CREATE INDEX "Invoice_accountId_idx" ON "public"."Invoice"("accountId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "public"."Invoice"("status");

-- CreateIndex
CREATE INDEX "Bill_projectId_idx" ON "public"."Bill"("projectId");

-- CreateIndex
CREATE INDEX "Bill_projectId_date_idx" ON "public"."Bill"("projectId", "date");

-- CreateIndex
CREATE INDEX "Bill_accountId_idx" ON "public"."Bill"("accountId");

-- CreateIndex
CREATE INDEX "Bill_status_idx" ON "public"."Bill"("status");

-- CreateIndex
CREATE INDEX "Ledger_projectId_idx" ON "public"."Ledger"("projectId");

-- CreateIndex
CREATE INDEX "Ledger_accountId_idx" ON "public"."Ledger"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Ledger_projectId_accountId_key" ON "public"."Ledger"("projectId", "accountId");

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bill" ADD CONSTRAINT "Bill_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bill" ADD CONSTRAINT "Bill_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bill" ADD CONSTRAINT "Bill_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Ledger" ADD CONSTRAINT "Ledger_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Ledger" ADD CONSTRAINT "Ledger_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
