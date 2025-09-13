import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/api/_lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { installmentId: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const installmentId = params.installmentId;
    const { amount, paymentDate, description } = await request.json();

    // Validate input
    if (!amount || !paymentDate) {
      return NextResponse.json(
        { error: "مبلغ و تاریخ پرداخت الزامی است" },
        { status: 400 }
      );
    }

    // Check if installment exists
    const installment = await prisma.userInstallment.findUnique({
      where: { id: installmentId },
      include: {
        user: true
      }
    });

    if (!installment) {
      return NextResponse.json(
        { error: "قسط یافت نشد" },
        { status: 404 }
      );
    }

    // Check permissions - only admin or the user who owns the installment can add payment
    if (user.role !== "ADMIN" && installment.user.id !== user.id) {
      return NextResponse.json(
        { error: "شما مجوز اضافه کردن پرداخت به این قسط را ندارید" },
        { status: 403 }
      );
    }

    // Create new payment (this is a real payment, not a receipt link)
    const payment = await prisma.payment.create({
      data: {
        userInstallmentId: installmentId,
        paymentDate: new Date(paymentDate),
        amount: parseFloat(amount),
        description: description || null,
        receiptImagePath: null // No receipt linked initially
      }
    });

    return NextResponse.json({
      message: "پرداخت با موفقیت اضافه شد",
      payment: {
        id: payment.id,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        description: payment.description,
        receiptImagePath: payment.receiptImagePath
      }
    });

  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "خطا در اضافه کردن پرداخت" },
      { status: 500 }
    );
  }
}

