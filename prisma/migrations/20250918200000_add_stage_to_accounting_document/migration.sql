-- AlterTable
ALTER TABLE "public"."AccountingDocument" ADD COLUMN "stageId" TEXT;

-- CreateIndex
CREATE INDEX "AccountingDocument_stageId_idx" ON "public"."AccountingDocument"("stageId");

-- AddForeignKey
ALTER TABLE "public"."AccountingDocument" ADD CONSTRAINT "AccountingDocument_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "public"."InstallmentDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
