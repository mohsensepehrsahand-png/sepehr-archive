-- CreateTable
CREATE TABLE "public"."FiscalYear" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "openingEntryId" TEXT,
    "closingEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalYear_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FiscalYear_projectId_idx" ON "public"."FiscalYear"("projectId");

-- CreateIndex
CREATE INDEX "FiscalYear_year_idx" ON "public"."FiscalYear"("year");

-- CreateIndex
CREATE INDEX "FiscalYear_isActive_idx" ON "public"."FiscalYear"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalYear_projectId_year_key" ON "public"."FiscalYear"("projectId", "year");

-- AddForeignKey
ALTER TABLE "public"."FiscalYear" ADD CONSTRAINT "FiscalYear_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
