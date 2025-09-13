-- CreateEnum
CREATE TYPE "public"."InstallmentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE');

-- CreateTable
CREATE TABLE "public"."Unit" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unitNumber" TEXT NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InstallmentDefinition" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstallmentDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserInstallment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "installmentDefinitionId" TEXT NOT NULL,
    "shareAmount" DOUBLE PRECISION NOT NULL,
    "status" "public"."InstallmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "userInstallmentId" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Penalty" (
    "id" TEXT NOT NULL,
    "userInstallmentId" TEXT NOT NULL,
    "daysLate" INTEGER NOT NULL,
    "dailyRate" DOUBLE PRECISION NOT NULL,
    "totalPenalty" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Penalty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Unit_userId_idx" ON "public"."Unit"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_projectId_unitNumber_key" ON "public"."Unit"("projectId", "unitNumber");

-- CreateIndex
CREATE INDEX "InstallmentDefinition_projectId_idx" ON "public"."InstallmentDefinition"("projectId");

-- CreateIndex
CREATE INDEX "UserInstallment_userId_idx" ON "public"."UserInstallment"("userId");

-- CreateIndex
CREATE INDEX "UserInstallment_installmentDefinitionId_idx" ON "public"."UserInstallment"("installmentDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserInstallment_userId_installmentDefinitionId_key" ON "public"."UserInstallment"("userId", "installmentDefinitionId");

-- CreateIndex
CREATE INDEX "Payment_userInstallmentId_idx" ON "public"."Payment"("userInstallmentId");

-- CreateIndex
CREATE INDEX "Payment_paymentDate_idx" ON "public"."Payment"("paymentDate");

-- CreateIndex
CREATE INDEX "Penalty_userInstallmentId_idx" ON "public"."Penalty"("userInstallmentId");

-- AddForeignKey
ALTER TABLE "public"."Unit" ADD CONSTRAINT "Unit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Unit" ADD CONSTRAINT "Unit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InstallmentDefinition" ADD CONSTRAINT "InstallmentDefinition_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserInstallment" ADD CONSTRAINT "UserInstallment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserInstallment" ADD CONSTRAINT "UserInstallment_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "public"."Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserInstallment" ADD CONSTRAINT "UserInstallment_installmentDefinitionId_fkey" FOREIGN KEY ("installmentDefinitionId") REFERENCES "public"."InstallmentDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_userInstallmentId_fkey" FOREIGN KEY ("userInstallmentId") REFERENCES "public"."UserInstallment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Penalty" ADD CONSTRAINT "Penalty_userInstallmentId_fkey" FOREIGN KEY ("userInstallmentId") REFERENCES "public"."UserInstallment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
