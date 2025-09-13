import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/api/_lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can unlink documents
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const paymentId = params.paymentId;

    // Check if payment exists
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { id: true, receiptImagePath: true, amount: true, description: true }
    });

    if (!payment) {
      return NextResponse.json(
        { error: "پرداخت یافت نشد" },
        { status: 404 }
      );
    }

    if (!payment.receiptImagePath) {
      return NextResponse.json(
        { error: "این پرداخت هیچ فیش لینک شده‌ای ندارد" },
        { status: 400 }
      );
    }

    // Check if this payment was created only for receipt linking
    const isReceiptOnlyPayment = payment.amount === 0 && 
      payment.description && 
      payment.description.startsWith('فیش پرداخت لینک شده:');

    if (isReceiptOnlyPayment) {
      // Delete the entire payment record if it was created only for receipt linking
      await prisma.payment.delete({
        where: { id: paymentId }
      });
    } else {
      // If this is a real payment with a linked receipt, just remove the receipt link
      // Only clear description if it was auto-generated for receipt linking
      const shouldClearDescription = payment.description && 
        payment.description.startsWith('فیش پرداخت لینک شده:');

      await prisma.payment.update({
        where: { id: paymentId },
        data: { 
          receiptImagePath: null,
          ...(shouldClearDescription && { description: null })
        }
      });
    }

    return NextResponse.json({
      message: "لینک سند با موفقیت حذف شد"
    });

  } catch (error) {
    console.error("Error unlinking document from payment:", error);
    return NextResponse.json(
      { error: "خطا در حذف لینک سند" },
      { status: 500 }
    );
  }
}

