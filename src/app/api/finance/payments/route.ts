import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import { getCurrentUser } from "@/app/api/_lib/db";
import { FinancialCalculator } from "@/lib/financialCalculations";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const installmentId = searchParams.get('installmentId');
    const hasReceipt = searchParams.get('hasReceipt');

    if (!installmentId) {
      return NextResponse.json({ error: "Installment ID is required" }, { status: 400 });
    }

    // Get payments for the installment
    const whereClause: any = {
      userInstallmentId: installmentId
    };

    if (hasReceipt === 'true') {
      whereClause.receiptImagePath = { not: null };
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      orderBy: { paymentDate: 'desc' }
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, paymentAmount, paymentDate, description } = body;

    if (!projectId || !paymentAmount || !paymentDate) {
      return NextResponse.json({ error: "اطلاعات ناقص" }, { status: 400 });
    }

    // Apply payment using the financial calculator
    const result = await FinancialCalculator.applyPaymentAPI(
      user.id,
      projectId,
      parseFloat(paymentAmount),
      new Date(paymentDate),
      description
    );

    if (result.success) {
      return NextResponse.json({
        message: result.message,
        remainingAmount: result.remainingAmount,
        appliedPayments: result.appliedPayments
      });
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
  } catch (error) {
    console.error("Error applying payment:", error);
    return NextResponse.json(
      { error: "خطا در اعمال پرداخت" },
      { status: 500 }
    );
  }
}