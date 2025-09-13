-- AlterTable
ALTER TABLE "public"."Project" ADD COLUMN     "dailyPenaltyAmount" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "penaltyGraceDays" INTEGER DEFAULT 0;
