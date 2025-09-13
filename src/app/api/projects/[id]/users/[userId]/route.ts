import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/api/_lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params.id;
    const userId = params.userId;

    // Check if user has units in this project
    const userUnits = await prisma.unit.findMany({
      where: {
        projectId,
        userId
      },
      include: {
        userInstallments: {
          include: {
            payments: true
          }
        }
      }
    });

    if (userUnits.length === 0) {
      return NextResponse.json(
        { error: "کاربر در این پروژه واحد ندارد" },
        { status: 404 }
      );
    }

    // Check if user has any payments
    const hasPayments = userUnits.some(unit => 
      unit.userInstallments.some(installment => installment.payments.length > 0)
    );

    if (hasPayments) {
      return NextResponse.json(
        { error: "نمی‌توان کاربری که پرداخت ثبت کرده را حذف کرد" },
        { status: 400 }
      );
    }

    // Delete user installments first
    for (const unit of userUnits) {
      await prisma.userInstallment.deleteMany({
        where: { unitId: unit.id }
      });
    }

    // Delete units
    await prisma.unit.deleteMany({
      where: {
        projectId,
        userId
      }
    });

    return NextResponse.json({
      message: "کاربر با موفقیت از پروژه حذف شد"
    });
  } catch (error) {
    console.error("Error removing user from project:", error);
    return NextResponse.json(
      { error: "خطا در حذف کاربر از پروژه" },
      { status: 500 }
    );
  }
}
