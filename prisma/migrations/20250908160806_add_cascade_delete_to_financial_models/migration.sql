-- DropForeignKey
ALTER TABLE "public"."Payment" DROP CONSTRAINT "Payment_userInstallmentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Penalty" DROP CONSTRAINT "Penalty_userInstallmentId_fkey";

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_userInstallmentId_fkey" FOREIGN KEY ("userInstallmentId") REFERENCES "public"."UserInstallment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Penalty" ADD CONSTRAINT "Penalty_userInstallmentId_fkey" FOREIGN KEY ("userInstallmentId") REFERENCES "public"."UserInstallment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
