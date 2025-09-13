-- AlterTable
ALTER TABLE "public"."InstallmentDefinition" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "InstallmentDefinition_projectId_order_idx" ON "public"."InstallmentDefinition"("projectId", "order");
