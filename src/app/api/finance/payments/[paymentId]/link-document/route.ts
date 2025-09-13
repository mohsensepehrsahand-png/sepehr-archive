import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/api/_lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can link documents
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const paymentId = params.paymentId;
    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "شناسه سند الزامی است" },
        { status: 400 }
      );
    }

    // Check if payment exists
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        userInstallment: {
          include: {
            unit: {
              include: {
                project: true
              }
            }
          }
        }
      }
    });

    if (!payment) {
      return NextResponse.json(
        { error: "پرداخت یافت نشد" },
        { status: 404 }
      );
    }

    // Check if document exists and belongs to the same project
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        projectId: payment.userInstallment.unit.project.id
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: "سند یافت نشد یا متعلق به این پروژه نیست" },
        { status: 404 }
      );
    }

    // Update payment with document path as receipt image
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: { 
        receiptImagePath: document.filePath 
      }
    });

    return NextResponse.json({
      message: "سند با موفقیت به پرداخت لینک شد",
      payment: {
        id: updatedPayment.id,
        receiptImagePath: updatedPayment.receiptImagePath
      }
    });

  } catch (error) {
    console.error("Error linking document to payment:", error);
    return NextResponse.json(
      { error: "خطا در لینک کردن سند به پرداخت" },
      { status: 500 }
    );
  }
}

