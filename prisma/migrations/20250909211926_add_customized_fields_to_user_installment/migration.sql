-- AlterTable
ALTER TABLE "public"."UserInstallment" ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "isCustomized" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "title" TEXT;
