-- AlterTable
ALTER TABLE "public"."Payment" ADD COLUMN     "receiptImagePath" TEXT;

-- CreateTable
CREATE TABLE "public"."ArchivedUser" (
    "id" TEXT NOT NULL,
    "originalUserId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "role" "public"."Role" NOT NULL,
    "dailyPenaltyAmount" DOUBLE PRECISION NOT NULL,
    "penaltyGraceDays" INTEGER NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchivedUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ArchivedUnit" (
    "id" TEXT NOT NULL,
    "archivedUserId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "unitNumber" TEXT NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchivedUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ArchivedUserInstallment" (
    "id" TEXT NOT NULL,
    "archivedUserId" TEXT NOT NULL,
    "archivedUnitId" TEXT,
    "installmentDefinitionId" TEXT NOT NULL,
    "installmentTitle" TEXT NOT NULL,
    "shareAmount" DOUBLE PRECISION NOT NULL,
    "status" "public"."InstallmentStatus" NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchivedUserInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ArchivedPayment" (
    "id" TEXT NOT NULL,
    "archivedUserInstallmentId" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchivedPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ArchivedPenalty" (
    "id" TEXT NOT NULL,
    "archivedUserInstallmentId" TEXT NOT NULL,
    "daysLate" INTEGER NOT NULL,
    "dailyRate" DOUBLE PRECISION NOT NULL,
    "totalPenalty" DOUBLE PRECISION NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchivedPenalty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArchivedUser_username_idx" ON "public"."ArchivedUser"("username");

-- CreateIndex
CREATE INDEX "ArchivedUser_archivedAt_idx" ON "public"."ArchivedUser"("archivedAt");

-- CreateIndex
CREATE INDEX "ArchivedUnit_archivedUserId_idx" ON "public"."ArchivedUnit"("archivedUserId");

-- CreateIndex
CREATE INDEX "ArchivedUnit_projectId_idx" ON "public"."ArchivedUnit"("projectId");

-- CreateIndex
CREATE INDEX "ArchivedUserInstallment_archivedUserId_idx" ON "public"."ArchivedUserInstallment"("archivedUserId");

-- CreateIndex
CREATE INDEX "ArchivedUserInstallment_archivedUnitId_idx" ON "public"."ArchivedUserInstallment"("archivedUnitId");

-- CreateIndex
CREATE INDEX "ArchivedUserInstallment_installmentDefinitionId_idx" ON "public"."ArchivedUserInstallment"("installmentDefinitionId");

-- CreateIndex
CREATE INDEX "ArchivedPayment_archivedUserInstallmentId_idx" ON "public"."ArchivedPayment"("archivedUserInstallmentId");

-- CreateIndex
CREATE INDEX "ArchivedPayment_paymentDate_idx" ON "public"."ArchivedPayment"("paymentDate");

-- CreateIndex
CREATE INDEX "ArchivedPenalty_archivedUserInstallmentId_idx" ON "public"."ArchivedPenalty"("archivedUserInstallmentId");

-- AddForeignKey
ALTER TABLE "public"."ArchivedUnit" ADD CONSTRAINT "ArchivedUnit_archivedUserId_fkey" FOREIGN KEY ("archivedUserId") REFERENCES "public"."ArchivedUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ArchivedUserInstallment" ADD CONSTRAINT "ArchivedUserInstallment_archivedUserId_fkey" FOREIGN KEY ("archivedUserId") REFERENCES "public"."ArchivedUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ArchivedUserInstallment" ADD CONSTRAINT "ArchivedUserInstallment_archivedUnitId_fkey" FOREIGN KEY ("archivedUnitId") REFERENCES "public"."ArchivedUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ArchivedPayment" ADD CONSTRAINT "ArchivedPayment_archivedUserInstallmentId_fkey" FOREIGN KEY ("archivedUserInstallmentId") REFERENCES "public"."ArchivedUserInstallment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ArchivedPenalty" ADD CONSTRAINT "ArchivedPenalty_archivedUserInstallmentId_fkey" FOREIGN KEY ("archivedUserInstallmentId") REFERENCES "public"."ArchivedUserInstallment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
