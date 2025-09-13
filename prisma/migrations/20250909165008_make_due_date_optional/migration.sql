/*
  Warnings:

  - You are about to drop the `ArchivedDocument` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ArchivedFolder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ArchivedPayment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ArchivedPenalty` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ArchivedProject` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ArchivedProjectInstallmentDefinition` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ArchivedProjectUnit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ArchivedUnit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ArchivedUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ArchivedUserInstallment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ActivityLog" DROP CONSTRAINT "ActivityLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ArchivedDocument" DROP CONSTRAINT "ArchivedDocument_archivedFolderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ArchivedDocument" DROP CONSTRAINT "ArchivedDocument_archivedProjectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ArchivedFolder" DROP CONSTRAINT "ArchivedFolder_archivedProjectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ArchivedPayment" DROP CONSTRAINT "ArchivedPayment_archivedUserInstallmentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ArchivedPenalty" DROP CONSTRAINT "ArchivedPenalty_archivedUserInstallmentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ArchivedProjectInstallmentDefinition" DROP CONSTRAINT "ArchivedProjectInstallmentDefinition_archivedProjectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ArchivedProjectUnit" DROP CONSTRAINT "ArchivedProjectUnit_archivedProjectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ArchivedUnit" DROP CONSTRAINT "ArchivedUnit_archivedUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ArchivedUserInstallment" DROP CONSTRAINT "ArchivedUserInstallment_archivedUnitId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ArchivedUserInstallment" DROP CONSTRAINT "ArchivedUserInstallment_archivedUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Document" DROP CONSTRAINT "Document_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."Document" DROP CONSTRAINT "Document_folderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Document" DROP CONSTRAINT "Document_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Folder" DROP CONSTRAINT "Folder_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."Folder" DROP CONSTRAINT "Folder_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."InstallmentDefinition" DROP CONSTRAINT "InstallmentDefinition_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Permission" DROP CONSTRAINT "Permission_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Project" DROP CONSTRAINT "Project_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."Unit" DROP CONSTRAINT "Unit_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Unit" DROP CONSTRAINT "Unit_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserInstallment" DROP CONSTRAINT "UserInstallment_userId_fkey";

-- AlterTable
ALTER TABLE "public"."InstallmentDefinition" ALTER COLUMN "dueDate" DROP NOT NULL;

-- DropTable
DROP TABLE "public"."ArchivedDocument";

-- DropTable
DROP TABLE "public"."ArchivedFolder";

-- DropTable
DROP TABLE "public"."ArchivedPayment";

-- DropTable
DROP TABLE "public"."ArchivedPenalty";

-- DropTable
DROP TABLE "public"."ArchivedProject";

-- DropTable
DROP TABLE "public"."ArchivedProjectInstallmentDefinition";

-- DropTable
DROP TABLE "public"."ArchivedProjectUnit";

-- DropTable
DROP TABLE "public"."ArchivedUnit";

-- DropTable
DROP TABLE "public"."ArchivedUser";

-- DropTable
DROP TABLE "public"."ArchivedUserInstallment";

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Folder" ADD CONSTRAINT "Folder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Folder" ADD CONSTRAINT "Folder_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "public"."Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Permission" ADD CONSTRAINT "Permission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Unit" ADD CONSTRAINT "Unit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Unit" ADD CONSTRAINT "Unit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InstallmentDefinition" ADD CONSTRAINT "InstallmentDefinition_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserInstallment" ADD CONSTRAINT "UserInstallment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
