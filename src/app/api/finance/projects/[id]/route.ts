import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import { getCurrentUser } from "@/app/api/_lib/db";
import { FinancialCalculator } from "@/lib/financialCalculations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get project with all related data
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        units: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                role: true,
                dailyPenaltyAmount: true,
                penaltyGraceDays: true
              }
            },
            userInstallments: {
              include: {
                installmentDefinition: true,
                payments: true,
                penalties: true
              }
            }
          }
        },
        installmentDefinitions: true
      }
    });

    if (!project) {
      return NextResponse.json({ error: "پروژه یافت نشد" }, { status: 404 });
    }

    // Check if user has access to this project
    if (user.role !== "ADMIN") {
      const hasAccess = project.units.some(unit => unit.userId === user.id);
      if (!hasAccess) {
        return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
      }
    }

    // Calculate financial data for each user (exclude ADMIN users)
    const usersData = project.units
      .filter(unit => unit.user.role !== 'ADMIN') // Filter out admin users
      .map(unit => {
      const userInstallments = unit.userInstallments;
      const totalShareAmount = userInstallments.reduce((sum, inst) => sum + inst.shareAmount, 0);
      const totalPaidAmount = userInstallments.reduce((sum, inst) => 
        sum + inst.payments.reduce((paymentSum, payment) => paymentSum + (payment.amount > 0 && !payment.receiptImagePath ? payment.amount : 0), 0), 0
      );
      const totalPenaltyAmount = userInstallments.reduce((sum, inst) => 
        sum + inst.penalties.reduce((penaltySum, penalty) => penaltySum + penalty.totalPenalty, 0), 0
      );
      const remainingAmount = totalShareAmount - totalPaidAmount;
      const progressPercentage = totalShareAmount > 0 ? Math.round((totalPaidAmount / totalShareAmount) * 100) : 0;
      
      // Count paid installments
      const paidInstallmentsCount = userInstallments.filter(inst => {
        // Only count payments without receipt (actual installment payments)
        const paidAmount = inst.payments.reduce((sum, p) => {
          return sum + (p.amount > 0 && !p.receiptImagePath ? p.amount : 0);
        }, 0);
        return paidAmount >= inst.shareAmount;
      }).length;

      // Determine overall status
      let status = "در انتظار پرداخت";
      if (progressPercentage >= 100) {
        status = "پرداخت شده";
      } else if (progressPercentage > 0) {
        status = "بخشی پرداخت شده";
      } else if (remainingAmount > 0 && userInstallments.some(inst => {
        const dueDate = inst.installmentDefinition?.dueDate ? new Date(inst.installmentDefinition.dueDate) : null;
        return dueDate && new Date() > dueDate;
      })) {
        status = "معوق";
      }

      // Get installment details for chart
      const installmentDetails = userInstallments.map((inst, index) => {
        // Only count payments without receipt (actual installment payments)
        const paidAmount = inst.payments.reduce((sum, p) => {
          return sum + (p.amount > 0 && !p.receiptImagePath ? p.amount : 0);
        }, 0);
        const isPaid = paidAmount >= inst.shareAmount;
        const isPartiallyPaid = paidAmount > 0 && paidAmount < inst.shareAmount;
        
        // Determine status in Persian
        let status = "در انتظار پرداخت";
        if (isPaid) {
          status = "پرداخت شده";
        } else if (isPartiallyPaid) {
          status = "بخشی پرداخت شده";
        } else {
          // Check if overdue
          const dueDate = inst.installmentDefinition?.dueDate ? new Date(inst.installmentDefinition.dueDate) : null;
          if (dueDate && new Date() > dueDate) {
            status = "معوق";
          }
        }

        return {
          id: inst.id,
          title: inst.installmentDefinition?.title || inst.title || `قسط ${index + 1}`,
          dueDate: inst.installmentDefinition?.dueDate || inst.dueDate,
          shareAmount: inst.shareAmount,
          paidAmount,
          status,
          order: index + 1,
          payments: inst.payments.map(p => ({
            id: p.id,
            amount: p.amount,
            paymentDate: p.paymentDate,
            description: p.description
          }))
        };
      });

      return {
        id: unit.user.id,
        firstName: unit.user.firstName,
        lastName: unit.user.lastName,
        username: unit.user.username,
        name: `${unit.user.firstName || ''} ${unit.user.lastName || ''}`.trim() || unit.user.username,
        totalShareAmount,
        totalPaidAmount,
        remainingAmount,
        penaltyAmount: totalPenaltyAmount,
        progressPercentage,
        paidInstallmentsCount,
        status,
        installmentDetails
      };
    });

    // Calculate project summary
    const totalShareAmount = usersData.reduce((sum, user) => sum + user.totalShareAmount, 0);
    const totalPaidAmount = usersData.reduce((sum, user) => sum + user.totalPaidAmount, 0);
    const totalRemainingAmount = usersData.reduce((sum, user) => sum + user.remainingAmount, 0);
    const totalPenaltyAmount = usersData.reduce((sum, user) => sum + user.penaltyAmount, 0);
    const paidPercentage = totalShareAmount > 0 ? Math.round((totalPaidAmount / totalShareAmount) * 100) : 0;

    const summary = {
      totalShareAmount,
      totalPaidAmount,
      totalRemainingAmount,
      totalPenaltyAmount,
      paidPercentage
    };

    return NextResponse.json({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      summary,
      users: usersData
    });
  } catch (error) {
    console.error("Error fetching project details:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات پروژه" },
      { status: 500 }
    );
  }
}