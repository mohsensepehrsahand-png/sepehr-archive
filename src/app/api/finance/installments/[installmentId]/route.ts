import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/api/_lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { installmentId: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { installmentId } = params;
    const body = await request.json();
    const { title, dueDate, amount } = body;

    if (!title || !dueDate || !amount) {
      return NextResponse.json(
        { error: "تمام فیلدها الزامی است" },
        { status: 400 }
      );
    }

    // Update installment definition
    const updatedInstallment = await prisma.installmentDefinition.update({
      where: { id: installmentId },
      data: {
        title,
        dueDate: new Date(dueDate),
        amount: parseFloat(amount)
      }
    });

    // Get all user installments for this installment definition
    const userInstallments = await prisma.userInstallment.findMany({
      where: { installmentDefinitionId: installmentId },
      include: { unit: true }
    });

    // Get total area for recalculation - use all units in the project, not just those with installments
    const projectUnits = await prisma.unit.findMany({
      where: { 
        projectId: updatedInstallment.projectId 
      }
    });
    const totalArea = projectUnits.reduce((sum, unit) => sum + unit.area, 0);

    // Update user installments with new share amounts
    if (userInstallments.length > 0 && totalArea > 0) {
      await Promise.all(
        userInstallments.map(ui =>
          prisma.userInstallment.update({
            where: { id: ui.id },
            data: {
              shareAmount: (parseFloat(amount) * ui.unit.area) / totalArea
            }
          })
        )
      );
    }

    return NextResponse.json({
      installment: updatedInstallment,
      message: "قسط با موفقیت ویرایش شد"
    });
  } catch (error) {
    console.error("Error updating installment:", error);
    return NextResponse.json(
      { error: "خطا در ویرایش قسط" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { installmentId: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { installmentId } = params;

    // Check if there are any payments for this installment
    const payments = await prisma.payment.findMany({
      where: {
        userInstallment: {
          installmentDefinitionId: installmentId
        }
      }
    });

    if (payments.length > 0) {
      return NextResponse.json(
        { error: "نمی‌توان قسطی که پرداخت برای آن ثبت شده را حذف کرد" },
        { status: 400 }
      );
    }

    // Delete user installments first (cascade)
    await prisma.userInstallment.deleteMany({
      where: { installmentDefinitionId: installmentId }
    });

    // Delete installment definition
    await prisma.installmentDefinition.delete({
      where: { id: installmentId }
    });

    return NextResponse.json({
      message: "قسط با موفقیت حذف شد"
    });
  } catch (error) {
    console.error("Error deleting installment:", error);
    return NextResponse.json(
      { error: "خطا در حذف قسط" },
      { status: 500 }
    );
  }
}
