/*
  Warnings:

  - You are about to drop the column `dailyPenaltyAmount` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `penaltyGraceDays` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."InstallmentDefinition" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "dailyPenaltyAmount",
DROP COLUMN "penaltyGraceDays";
