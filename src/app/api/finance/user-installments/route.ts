import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import { getCurrentUser } from "@/app/api/_lib/db";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, projectId, installmentDefinitionId, shareAmount, paidAmount, title, dueDate, paymentDate } = body;

    if (!userId || !projectId || !shareAmount) {
      return NextResponse.json({ error: "اطلاعات ناقص" }, { status: 400 });
    }

    // Check if user has a unit in this project
    const unit = await prisma.unit.findFirst({
      where: {
        userId,
        projectId
      }
    });

    if (!unit) {
      return NextResponse.json({ error: "کاربر در این پروژه عضو نیست" }, { status: 404 });
    }

    let finalInstallmentDefinitionId = installmentDefinitionId;

    // If no installment definition ID provided, create a customized installment
    if (!installmentDefinitionId && title && dueDate) {
      // Create a customized installment without linking to installment definition
      finalInstallmentDefinitionId = null;
    } else if (installmentDefinitionId) {
      // Check if installment definition exists
      const installmentDefinition = await prisma.installmentDefinition.findUnique({
        where: { id: installmentDefinitionId }
      });

      if (!installmentDefinition) {
        return NextResponse.json({ error: "تعریف قسط یافت نشد" }, { status: 404 });
      }
    } else {
      return NextResponse.json({ error: "باید یا تعریف قسط موجود انتخاب شود یا قسط جدید ایجاد شود" }, { status: 400 });
    }

    // Create user installment
    const userInstallment = await prisma.userInstallment.create({
      data: {
        userId,
        unitId: unit.id,
        installmentDefinitionId: finalInstallmentDefinitionId,
        shareAmount: parseFloat(shareAmount),
        status: "PENDING",
        isCustomized: !installmentDefinitionId, // Mark as customized if no definition ID
        title: !installmentDefinitionId ? title : undefined,
        dueDate: !installmentDefinitionId && dueDate ? new Date(dueDate) : undefined,
        order: 0 // Will be updated if needed
      },
      include: {
        installmentDefinition: true
      }
    });

    // Create payment if paidAmount is provided
    if (paidAmount && parseFloat(paidAmount) > 0 && paymentDate) {
      await prisma.payment.create({
        data: {
          userInstallmentId: userInstallment.id,
          paymentDate: new Date(paymentDate),
          amount: parseFloat(paidAmount),
          description: "قسط جدید"
        }
      });

      // Update installment status
      const status = parseFloat(paidAmount) >= parseFloat(shareAmount) ? "PAID" : 
                    parseFloat(paidAmount) > 0 ? "PARTIAL" : "PENDING";
      await prisma.userInstallment.update({
        where: { id: userInstallment.id },
        data: { status }
      });
    }

    return NextResponse.json({
      message: "قسط با موفقیت ایجاد شد",
      installment: userInstallment
    });
  } catch (error) {
    console.error("Error creating user installment:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد قسط" },
      { status: 500 }
    );
  }
}