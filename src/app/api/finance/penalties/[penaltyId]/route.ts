import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/api/_lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { penaltyId: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { penaltyId } = params;
    const body = await request.json();
    const { daysLate, dailyRate } = body;

    if (!daysLate || !dailyRate) {
      return NextResponse.json(
        { error: "روزهای تأخیر و نرخ روزانه الزامی است" },
        { status: 400 }
      );
    }

    // Calculate total penalty
    const totalPenalty = daysLate * dailyRate;

    // Update penalty
    const updatedPenalty = await prisma.penalty.update({
      where: { id: penaltyId },
      data: {
        daysLate: parseInt(daysLate),
        dailyRate: parseFloat(dailyRate),
        totalPenalty
      },
      include: {
        userInstallment: {
          include: {
            installmentDefinition: true,
            user: true,
            unit: true
          }
        }
      }
    });

    return NextResponse.json({
      penalty: updatedPenalty,
      message: "جریمه با موفقیت ویرایش شد"
    });
  } catch (error) {
    console.error("Error updating penalty:", error);
    return NextResponse.json(
      { error: "خطا در ویرایش جریمه" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { penaltyId: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { penaltyId } = params;

    // Delete penalty
    await prisma.penalty.delete({
      where: { id: penaltyId }
    });

    return NextResponse.json({
      message: "جریمه با موفقیت حذف شد"
    });
  } catch (error) {
    console.error("Error deleting penalty:", error);
    return NextResponse.json(
      { error: "خطا در حذف جریمه" },
      { status: 500 }
    );
  }
}
