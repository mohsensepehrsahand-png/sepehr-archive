import { NextRequest, NextResponse } from "next/server";
import { prisma, getCurrentUser } from "@/app/api/_lib/db";

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

    const userDailyPenaltyAmount = projectUser.user.dailyPenaltyAmount || 0;
    const userPenaltyGraceDays = projectUser.user.penaltyGraceDays || 0;

    if (userDailyPenaltyAmount <= 0) {
      return NextResponse.json({ 
        message: "مبلغ جریمه روزانه تنظیم نشده است",
        result: { updatedPenalties: 0, totalPenaltyAmount: 0 }
      });
    }

    // Get all user installments with penalties
    const userInstallments = await prisma.userInstallment.findMany({
      where: { userId },
      include: {
        installmentDefinition: true,
        payments: true,
        penalties: true
      }
    });

    let updatedPenalties = 0;
    let totalPenaltyAmount = 0;

    // Process each installment
    for (const installment of userInstallments) {
      const dueDate = new Date(installment.installmentDefinition.dueDate);
      const now = new Date();
      const graceDate = new Date(dueDate);
      graceDate.setDate(graceDate.getDate() + userPenaltyGraceDays);

      // Only process if payment was made after grace period
      if (installment.payments.length > 0) {
        const latestPayment = installment.payments[installment.payments.length - 1];
        const paymentDate = new Date(latestPayment.paymentDate);

        if (paymentDate > graceDate) {
          const daysLate = Math.floor((paymentDate.getTime() - graceDate.getTime()) / (1000 * 60 * 60 * 24));
          const newPenaltyAmount = daysLate * userDailyPenaltyAmount;

          // Check if penalty already exists for this installment (only one penalty per installment)
          const existingPenalty = await prisma.penalty.findFirst({
            where: {
              userInstallmentId: installment.id
            }
          });

          if (existingPenalty) {
            // Update existing penalty
            await prisma.penalty.update({
              where: { id: existingPenalty.id },
              data: {
                daysLate,
                dailyRate: userDailyPenaltyAmount,
                totalPenalty: newPenaltyAmount
              }
            });
            updatedPenalties++;
          } else {
            // Create new penalty
            await prisma.penalty.create({
              data: {
                userInstallmentId: installment.id,
                daysLate,
                dailyRate: userDailyPenaltyAmount,
                totalPenalty: newPenaltyAmount
              }
            });
            updatedPenalties++;
          }

          totalPenaltyAmount += newPenaltyAmount;
        }
      }
    }

    return NextResponse.json({
      message: "محاسبه مجدد جریمه‌ها با موفقیت انجام شد",
      user: {
        id: projectUser.user.id,
        firstName: projectUser.user.firstName,
        lastName: projectUser.user.lastName,
        username: projectUser.user.username,
        dailyPenaltyAmount: projectUser.user.dailyPenaltyAmount,
        penaltyGraceDays: projectUser.user.penaltyGraceDays
      },
      result: {
        updatedPenalties,
        totalPenaltyAmount
      }
    });
  } catch (error) {
    console.error("Error recalculating penalties:", error);
    return NextResponse.json(
      { error: "خطا در محاسبه مجدد جریمه‌ها" },
      { status: 500 }
    );
  }
}
