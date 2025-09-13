-- DropForeignKey
ALTER TABLE "public"."Unit" DROP CONSTRAINT "Unit_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserInstallment" DROP CONSTRAINT "UserInstallment_userId_fkey";

-- AddForeignKey
ALTER TABLE "public"."Unit" ADD CONSTRAINT "Unit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserInstallment" ADD CONSTRAINT "UserInstallment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
