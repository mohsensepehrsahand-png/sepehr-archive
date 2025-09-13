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

    // Only admins can link documents
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const installmentId = params.installmentId;
    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "شناسه سند الزامی است" },
        { status: 400 }
      );
    }

    // Check if installment exists
    const installment = await prisma.userInstallment.findUnique({
      where: { id: installmentId },
      include: {
        unit: {
          include: {
            project: true
          }
        }
      }
    });

    if (!installment) {
      return NextResponse.json(
        { error: "قسط یافت نشد" },
        { status: 404 }
      );
    }

    // Check if document exists and belongs to the same project
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        projectId: installment.unit.project.id
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: "سند یافت نشد یا متعلق به این پروژه نیست" },
        { status: 404 }
      );
    }

    // Check if document is already linked to this installment
    const existingReceiptPayment = await prisma.payment.findFirst({
      where: {
        userInstallmentId: installmentId,
        receiptImagePath: document.id
      }
    });

    if (existingReceiptPayment) {
      return NextResponse.json(
        { error: "این سند قبلاً به این قسط لینک شده است" },
        { status: 400 }
      );
    }

    // Always create a new payment record for receipt linking (amount = 0)
    // This is separate from actual payments and doesn't affect payment calculations
    const payment = await prisma.payment.create({
      data: {
        userInstallmentId: installmentId,
        paymentDate: new Date(),
        amount: 0, // No amount added, just receipt linking
        description: `فیش پرداخت لینک شده: ${document.name}`,
        receiptImagePath: document.id
      }
    });

    return NextResponse.json({
      message: "سند با موفقیت به قسط لینک شد",
      payment: {
        id: payment.id,
        receiptImagePath: payment.receiptImagePath
      }
    });

  } catch (error) {
    console.error("Error linking document to installment:", error);
    return NextResponse.json(
      { error: "خطا در لینک کردن سند به قسط" },
      { status: 500 }
    );
  }
}
