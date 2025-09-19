-- AlterTable
ALTER TABLE "public"."AccountDetail" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "AccountDetail_userId_idx" ON "public"."AccountDetail"("userId");

-- AddForeignKey
ALTER TABLE "public"."AccountDetail" ADD CONSTRAINT "AccountDetail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
