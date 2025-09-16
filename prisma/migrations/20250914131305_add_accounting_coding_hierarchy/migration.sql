-- CreateEnum
CREATE TYPE "public"."AccountNature" AS ENUM ('DEBIT', 'CREDIT', 'DEBIT_CREDIT');

-- AlterTable
ALTER TABLE "public"."Account" ADD COLUMN     "detailId" TEXT,
ALTER COLUMN "code" SET DEFAULT '';

-- CreateTable
CREATE TABLE "public"."AccountGroup" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isProtected" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AccountClass" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nature" "public"."AccountNature" NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isProtected" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AccountSubClass" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hasDetails" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isProtected" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountSubClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AccountDetail" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "subClassId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isProtected" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountGroup_projectId_idx" ON "public"."AccountGroup"("projectId");

-- CreateIndex
CREATE INDEX "AccountGroup_projectId_sortOrder_idx" ON "public"."AccountGroup"("projectId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "AccountGroup_projectId_code_key" ON "public"."AccountGroup"("projectId", "code");

-- CreateIndex
CREATE INDEX "AccountClass_projectId_idx" ON "public"."AccountClass"("projectId");

-- CreateIndex
CREATE INDEX "AccountClass_groupId_idx" ON "public"."AccountClass"("groupId");

-- CreateIndex
CREATE INDEX "AccountClass_projectId_groupId_sortOrder_idx" ON "public"."AccountClass"("projectId", "groupId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "AccountClass_projectId_groupId_code_key" ON "public"."AccountClass"("projectId", "groupId", "code");

-- CreateIndex
CREATE INDEX "AccountSubClass_projectId_idx" ON "public"."AccountSubClass"("projectId");

-- CreateIndex
CREATE INDEX "AccountSubClass_classId_idx" ON "public"."AccountSubClass"("classId");

-- CreateIndex
CREATE INDEX "AccountSubClass_projectId_classId_sortOrder_idx" ON "public"."AccountSubClass"("projectId", "classId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "AccountSubClass_projectId_classId_code_key" ON "public"."AccountSubClass"("projectId", "classId", "code");

-- CreateIndex
CREATE INDEX "AccountDetail_projectId_idx" ON "public"."AccountDetail"("projectId");

-- CreateIndex
CREATE INDEX "AccountDetail_subClassId_idx" ON "public"."AccountDetail"("subClassId");

-- CreateIndex
CREATE INDEX "AccountDetail_projectId_subClassId_sortOrder_idx" ON "public"."AccountDetail"("projectId", "subClassId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "AccountDetail_projectId_subClassId_code_key" ON "public"."AccountDetail"("projectId", "subClassId", "code");

-- CreateIndex
CREATE INDEX "Account_detailId_idx" ON "public"."Account"("detailId");

-- AddForeignKey
ALTER TABLE "public"."AccountGroup" ADD CONSTRAINT "AccountGroup_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountClass" ADD CONSTRAINT "AccountClass_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountClass" ADD CONSTRAINT "AccountClass_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."AccountGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountSubClass" ADD CONSTRAINT "AccountSubClass_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountSubClass" ADD CONSTRAINT "AccountSubClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."AccountClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountDetail" ADD CONSTRAINT "AccountDetail_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountDetail" ADD CONSTRAINT "AccountDetail_subClassId_fkey" FOREIGN KEY ("subClassId") REFERENCES "public"."AccountSubClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_detailId_fkey" FOREIGN KEY ("detailId") REFERENCES "public"."AccountDetail"("id") ON DELETE SET NULL ON UPDATE CASCADE;
