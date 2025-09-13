-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "dailyPenaltyAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "penaltyGraceDays" INTEGER NOT NULL DEFAULT 0;
