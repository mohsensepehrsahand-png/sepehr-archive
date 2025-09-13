-- DropForeignKey
ALTER TABLE "public"."UserInstallment" DROP CONSTRAINT "UserInstallment_installmentDefinitionId_fkey";

-- DropIndex
DROP INDEX "public"."UserInstallment_userId_installmentDefinitionId_key";

-- AlterTable
ALTER TABLE "public"."UserInstallment" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "installmentDefinitionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."UserInstallment" ADD CONSTRAINT "UserInstallment_installmentDefinitionId_fkey" FOREIGN KEY ("installmentDefinitionId") REFERENCES "public"."InstallmentDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
