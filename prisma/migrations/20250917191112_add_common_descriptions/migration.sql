-- CreateTable
CREATE TABLE "public"."CommonDescription" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommonDescription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommonDescription_projectId_idx" ON "public"."CommonDescription"("projectId");

-- CreateIndex
CREATE INDEX "CommonDescription_usageCount_idx" ON "public"."CommonDescription"("usageCount");

-- AddForeignKey
ALTER TABLE "public"."CommonDescription" ADD CONSTRAINT "CommonDescription_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
