-- AlterTable
ALTER TABLE "public"."ArchivedUser" ADD COLUMN     "customRoleLabel" TEXT,
ADD COLUMN     "customRoleName" TEXT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "customRoleId" TEXT;

-- CreateTable
CREATE TABLE "public"."CustomRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#1976d2',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomRole_name_key" ON "public"."CustomRole"("name");

-- CreateIndex
CREATE INDEX "CustomRole_isActive_idx" ON "public"."CustomRole"("isActive");

-- CreateIndex
CREATE INDEX "CustomRole_name_idx" ON "public"."CustomRole"("name");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_customRoleId_fkey" FOREIGN KEY ("customRoleId") REFERENCES "public"."CustomRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
