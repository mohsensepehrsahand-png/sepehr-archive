import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import { getCurrentUser } from "@/app/api/_lib/db";
import { FinancialCalculator } from "@/lib/financialCalculations";

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