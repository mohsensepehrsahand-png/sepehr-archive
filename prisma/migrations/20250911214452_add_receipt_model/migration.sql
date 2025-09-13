-- CreateTable
CREATE TABLE "public"."Receipt" (
    "id" TEXT NOT NULL,
    "userInstallmentId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "receiptDate" TIMESTAMP(3),
    "description" TEXT,
    "receiptImagePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Receipt_userInstallmentId_idx" ON "public"."Receipt"("userInstallmentId");

-- CreateIndex
CREATE INDEX "Receipt_receiptNumber_idx" ON "public"."Receipt"("receiptNumber");

-- AddForeignKey
ALTER TABLE "public"."Receipt" ADD CONSTRAINT "Receipt_userInstallmentId_fkey" FOREIGN KEY ("userInstallmentId") REFERENCES "public"."UserInstallment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
