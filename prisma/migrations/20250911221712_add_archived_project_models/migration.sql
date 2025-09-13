-- CreateTable
CREATE TABLE "public"."ArchivedProject" (
    "id" TEXT NOT NULL,
    "originalProjectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."ProjectStatus" NOT NULL,
    "colorPrimary" TEXT NOT NULL,
    "colorFolderDefault" TEXT NOT NULL,
    "colorDocImage" TEXT NOT NULL,
    "colorDocPdf" TEXT NOT NULL,
    "bgColor" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdByUsername" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchivedProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ArchivedFolder" (
    "id" TEXT NOT NULL,
    "archivedProjectId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tabKey" "public"."TabKey" NOT NULL,
    "path" TEXT NOT NULL,
    "depth" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdByUsername" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchivedFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ArchivedDocument" (
    "id" TEXT NOT NULL,
    "archivedProjectId" TEXT NOT NULL,
    "archivedFolderId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tagsJson" TEXT NOT NULL DEFAULT '[]',
    "mimeType" TEXT NOT NULL,
    "fileExt" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "isUserUploaded" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdByUsername" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchivedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ArchivedProjectUnit" (
    "id" TEXT NOT NULL,
    "archivedProjectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userUsername" TEXT NOT NULL,
    "userFirstName" TEXT,
    "userLastName" TEXT,
    "unitNumber" TEXT NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchivedProjectUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ArchivedProjectInstallmentDefinition" (
    "id" TEXT NOT NULL,
    "archivedProjectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "amount" DOUBLE PRECISION NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchivedProjectInstallmentDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArchivedProject_originalProjectId_idx" ON "public"."ArchivedProject"("originalProjectId");

-- CreateIndex
CREATE INDEX "ArchivedProject_archivedAt_idx" ON "public"."ArchivedProject"("archivedAt");

-- CreateIndex
CREATE INDEX "ArchivedFolder_archivedProjectId_path_idx" ON "public"."ArchivedFolder"("archivedProjectId", "path");

-- CreateIndex
CREATE INDEX "ArchivedDocument_archivedProjectId_archivedFolderId_idx" ON "public"."ArchivedDocument"("archivedProjectId", "archivedFolderId");

-- CreateIndex
CREATE INDEX "ArchivedProjectUnit_archivedProjectId_idx" ON "public"."ArchivedProjectUnit"("archivedProjectId");

-- CreateIndex
CREATE INDEX "ArchivedProjectUnit_userId_idx" ON "public"."ArchivedProjectUnit"("userId");

-- CreateIndex
CREATE INDEX "ArchivedProjectInstallmentDefinition_archivedProjectId_idx" ON "public"."ArchivedProjectInstallmentDefinition"("archivedProjectId");

-- CreateIndex
CREATE INDEX "ArchivedProjectInstallmentDefinition_archivedProjectId_orde_idx" ON "public"."ArchivedProjectInstallmentDefinition"("archivedProjectId", "order");

-- AddForeignKey
ALTER TABLE "public"."ArchivedFolder" ADD CONSTRAINT "ArchivedFolder_archivedProjectId_fkey" FOREIGN KEY ("archivedProjectId") REFERENCES "public"."ArchivedProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ArchivedFolder" ADD CONSTRAINT "ArchivedFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."ArchivedFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ArchivedDocument" ADD CONSTRAINT "ArchivedDocument_archivedProjectId_fkey" FOREIGN KEY ("archivedProjectId") REFERENCES "public"."ArchivedProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ArchivedDocument" ADD CONSTRAINT "ArchivedDocument_archivedFolderId_fkey" FOREIGN KEY ("archivedFolderId") REFERENCES "public"."ArchivedFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ArchivedProjectUnit" ADD CONSTRAINT "ArchivedProjectUnit_archivedProjectId_fkey" FOREIGN KEY ("archivedProjectId") REFERENCES "public"."ArchivedProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ArchivedProjectInstallmentDefinition" ADD CONSTRAINT "ArchivedProjectInstallmentDefinition_archivedProjectId_fkey" FOREIGN KEY ("archivedProjectId") REFERENCES "public"."ArchivedProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
