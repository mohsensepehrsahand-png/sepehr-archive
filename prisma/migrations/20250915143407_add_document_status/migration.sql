-- CreateEnum
CREATE TYPE "public"."DocumentStatus" AS ENUM ('TEMPORARY', 'PERMANENT');

-- AlterTable
ALTER TABLE "public"."AccountingDocument" ADD COLUMN     "status" "public"."DocumentStatus" NOT NULL DEFAULT 'TEMPORARY';

-- CreateIndex
CREATE INDEX "AccountingDocument_status_idx" ON "public"."AccountingDocument"("status");
