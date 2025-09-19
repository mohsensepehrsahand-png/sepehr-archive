-- AlterTable
ALTER TABLE "public"."Transaction" ADD COLUMN     "detailedAccountId" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_detailedAccountId_idx" ON "public"."Transaction"("detailedAccountId");

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_detailedAccountId_fkey" FOREIGN KEY ("detailedAccountId") REFERENCES "public"."AccountDetail"("id") ON DELETE SET NULL ON UPDATE CASCADE;
