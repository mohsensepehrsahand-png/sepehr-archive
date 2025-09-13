/*
  Warnings:

  - You are about to drop the column `dailyPenaltyAmount` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `penaltyGraceDays` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Project" DROP COLUMN "dailyPenaltyAmount",
DROP COLUMN "penaltyGraceDays";

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "dailyPenaltyAmount" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "penaltyGraceDays" INTEGER DEFAULT 0;
