import { NextRequest, NextResponse } from "next/server";
import { prisma, getCurrentUser } from "@/app/api/_lib/db";
import { FinancialCalculator } from "@/lib/financialCalculations";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, userId } = await params;

    // Check if user exists in project
    const projectUser = await prisma.unit.findFirst({
      where: {
        projectId,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            dailyPenaltyAmount: true,
            penaltyGraceDays: true
          }
        }
      }
    });

    if (!projectUser) {
      return NextResponse.json({ error: "کاربر در این پروژه یافت نشد" }, { status: 404 });
    }

    // Calculate penalties using user's settings
    const result = await FinancialCalculator.calculateAndUpdatePenalties(
      userId,
      projectUser.user.dailyPenaltyAmount || 0,
      projectUser.user.penaltyGraceDays || 0
    );

    return NextResponse.json({
      message: "محاسبه جریمه با موفقیت انجام شد",
      user: {
        id: projectUser.user.id,
        firstName: projectUser.user.firstName,
        lastName: projectUser.user.lastName,
        username: projectUser.user.username,
        dailyPenaltyAmount: projectUser.user.dailyPenaltyAmount,
        penaltyGraceDays: projectUser.user.penaltyGraceDays
      },
      result: {
        updatedPenalties: result.updatedPenalties,
        totalPenaltyAmount: result.totalPenaltyAmount
      }
    });
  } catch (error) {
    console.error("Error calculating penalties:", error);
    return NextResponse.json(
      { error: "خطا در محاسبه جریمه" },
      { status: 500 }
    );
  }
}







