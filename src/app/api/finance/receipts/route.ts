import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { useAuth } from "@/contexts/AuthContext";

const prisma = new PrismaClient();

// GET /api/finance/receipts?installmentId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const installmentId = searchParams.get("installmentId");

    if (!installmentId) {
      return NextResponse.json({ error: "Installment ID is required" }, { status: 400 });
    }

    const receipts = await prisma.receipt.findMany({
      where: {
        userInstallmentId: installmentId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(receipts);
  } catch (error) {
    console.error("Error fetching receipts:", error);
    return NextResponse.json(
      { error: "Failed to fetch receipts" },
      { status: 500 }
    );
  }
}

// POST /api/finance/receipts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userInstallmentId, amount, receiptDate, description, receiptImagePath } = body;

    if (!userInstallmentId) {
      return NextResponse.json({ error: "Installment ID is required" }, { status: 400 });
    }

    // Generate receipt number (auto-increment)
    const lastReceipt = await prisma.receipt.findFirst({
      where: { userInstallmentId },
      orderBy: { createdAt: "desc" },
    });

    const receiptNumber = lastReceipt 
      ? `R${String(parseInt(lastReceipt.receiptNumber.replace('R', '')) + 1).padStart(4, '0')}`
      : "R0001";

    const receipt = await prisma.receipt.create({
      data: {
        userInstallmentId,
        receiptNumber,
        amount: amount || 0,
        receiptDate: receiptDate ? new Date(receiptDate) : null,
        description: description || null,
        receiptImagePath: receiptImagePath || null,
      },
    });

    // Also create a corresponding payment record if amount > 0
    if (amount && amount > 0) {
      await prisma.payment.create({
        data: {
          userInstallmentId,
          paymentDate: receiptDate ? new Date(receiptDate) : new Date(),
          amount: amount,
          description: description || `فیش ${receiptNumber}`,
          receiptImagePath: receiptImagePath || null,
        },
      });

      // Update installment status
      const installment = await prisma.userInstallment.findUnique({
        where: { id: userInstallmentId },
        include: { payments: true }
      });

      if (installment) {
        const totalPaidAmount = installment.payments.reduce((sum, p) => sum + p.amount, 0) + amount;
        let newStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' = 'PENDING';
        
        if (totalPaidAmount >= installment.shareAmount) {
          newStatus = 'PAID';
        } else if (totalPaidAmount > 0) {
          newStatus = 'PARTIAL';
        }

        await prisma.userInstallment.update({
          where: { id: userInstallmentId },
          data: { status: newStatus }
        });
      }
    }

    return NextResponse.json(receipt);
  } catch (error) {
    console.error("Error creating receipt:", error);
    return NextResponse.json(
      { error: "Failed to create receipt" },
      { status: 500 }
    );
  }
}
