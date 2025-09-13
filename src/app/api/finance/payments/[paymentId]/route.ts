import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/api/_lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paymentId = params.paymentId;
    const { amount, paymentDate, description } = await request.json();

    // Validate input
    if (!amount || !paymentDate) {
      return NextResponse.json(
        { error: "مبلغ و تاریخ پرداخت الزامی است" },
        { status: 400 }
      );
    }

    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        userInstallment: {
          include: {
            user: true
          }
        }
      }
    });

    if (!existingPayment) {
      return NextResponse.json(
        { error: "پرداخت یافت نشد" },
        { status: 404 }
      );
    }

    // Allow editing receipt payments (for amount, date, description)
    // This is for display purposes only, not for calculations

    // Check permissions - only admin or the user who owns the installment can edit
    if (user.role !== "ADMIN" && existingPayment.userInstallment.user.id !== user.id) {
      return NextResponse.json(
        { error: "شما مجوز ویرایش این پرداخت را ندارید" },
        { status: 403 }
      );
    }

    // Update payment
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        amount: parseFloat(amount),
        paymentDate: new Date(paymentDate),
        description: description || null
      }
    });

    return NextResponse.json({
      message: "پرداخت با موفقیت به‌روزرسانی شد",
      payment: updatedPayment
    });

  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی پرداخت" },
      { status: 500 }
    );
  }
}