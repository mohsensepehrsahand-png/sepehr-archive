-- DropForeignKey
ALTER TABLE "public"."UserInstallment" DROP CONSTRAINT "UserInstallment_unitId_fkey";

-- AddForeignKey
ALTER TABLE "public"."UserInstallment" ADD CONSTRAINT "UserInstallment_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "public"."Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
