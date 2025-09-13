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
    "sortOrder" INTEGER NOT NULL,
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
    "tagsJson" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileExt" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "isUserUploaded" BOOLEAN NOT NULL,
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
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "isDefault" BOOLEAN NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchivedProjectInstallmentDefinition_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."ArchivedFolder" ADD CONSTRAINT "ArchivedFolder_archivedProjectId_fkey" FOREIGN KEY ("archivedProjectId") REFERENCES "public"."ArchivedProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ArchivedDocument" ADD CONSTRAINT "ArchivedDocument_archivedProjectId_fkey" FOREIGN KEY ("archivedProjectId") REFERENCES "public"."ArchivedProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ArchivedDocument" ADD CONSTRAINT "ArchivedDocument_archivedFolderId_fkey" FOREIGN KEY ("archivedFolderId") REFERENCES "public"."ArchivedFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ArchivedProjectUnit" ADD CONSTRAINT "ArchivedProjectUnit_archivedProjectId_fkey" FOREIGN KEY ("archivedProjectId") REFERENCES "public"."ArchivedProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ArchivedProjectInstallmentDefinition" ADD CONSTRAINT "ArchivedProjectInstallmentDefinition_archivedProjectId_fkey" FOREIGN KEY ("archivedProjectId") REFERENCES "public"."ArchivedProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
