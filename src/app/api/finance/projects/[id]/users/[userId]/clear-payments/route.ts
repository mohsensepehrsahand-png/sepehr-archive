import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import { getCurrentUser } from "@/app/api/_lib/db";

// Clear all payments for a user in a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, userId } = await params;
    console.log("Clearing payments for user:", userId, "in project:", projectId);

    // Get user's units in this project
    const userUnits = await prisma.unit.findMany({
      where: {
        projectId,
        userId
      },
      include: {
        user: true,
        userInstallments: {
          include: {
            payments: true,
            penalties: true
          }
        }
      }
    });

    if (userUnits.length === 0) {
      return NextResponse.json({ 
        error: "کاربر در این پروژه عضو نیست" 
      }, { status: 404 });
    }

    // Count payments and penalties that will be deleted
    const totalPayments = userUnits.reduce((sum, unit) => 
      sum + unit.userInstallments.reduce((unitSum, installment) => unitSum + installment.payments.length, 0), 0);
    const totalPenalties = userUnits.reduce((sum, unit) => 
      sum + unit.userInstallments.reduce((unitSum, installment) => unitSum + installment.penalties.length, 0), 0);
    const totalInstallments = userUnits.reduce((sum, unit) => sum + unit.userInstallments.length, 0);

    console.log(`Will delete ${totalPayments} payments, ${totalPenalties} penalties, ${totalInstallments} installments`);

    // Delete all payments and penalties for this user in this project
    const deletePaymentsResult = await prisma.payment.deleteMany({
      where: {
        userInstallment: {
          unit: {
            projectId,
            userId
          }
        }
      }
    });

    const deletePenaltiesResult = await prisma.penalty.deleteMany({
      where: {
        userInstallment: {
          unit: {
            projectId,
            userId
          }
        }
      }
    });

    // Delete all installments for this user in this project
    const deleteInstallmentsResult = await prisma.userInstallment.deleteMany({
      where: {
        unit: {
          projectId,
          userId
        }
      }
    });

    // Delete user's units
    const deleteUnitsResult = await prisma.unit.deleteMany({
      where: {
        projectId,
        userId
      }
    });

    console.log(`Successfully deleted ${deletePaymentsResult.count} payments, ${deletePenaltiesResult.count} penalties, ${deleteInstallmentsResult.count} installments, ${deleteUnitsResult.count} units`);

    return NextResponse.json({
      message: "تمام اطلاعات مالی کاربر با موفقیت حذف شد",
      deletedPayments: deletePaymentsResult.count,
      deletedPenalties: deletePenaltiesResult.count,
      deletedInstallments: deleteInstallmentsResult.count,
      deletedUnits: deleteUnitsResult.count
    });
  } catch (error) {
    console.error("Error clearing user payments:", error);
    return NextResponse.json(
      { 
        error: "خطا در حذف اطلاعات مالی کاربر",
        details: error instanceof Error ? error.message : 'خطای نامشخص',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
