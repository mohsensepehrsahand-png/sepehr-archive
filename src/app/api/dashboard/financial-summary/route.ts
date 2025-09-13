import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import { getCurrentUser } from "@/app/api/_lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin users can access financial summary
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all active projects with financial data
    const projects = await prisma.project.findMany({
      where: {
        status: "ACTIVE"
      },
      include: {
        units: {
          include: {
            userInstallments: {
              include: {
                payments: true,
                penalties: true
              }
            }
          }
        },
        installmentDefinitions: true
      }
    });

    // Calculate summary statistics
    let totalProjects = 0;
    let totalAmount = 0;
    let paidAmount = 0;
    let remainingAmount = 0;
    let overdueAmount = 0;
    let totalUsers = 0;

    const projectSummaries = [];

    for (const project of projects) {
      const allUserInstallments = project.units.flatMap(unit => unit.userInstallments);
      
      if (allUserInstallments.length > 0) {
        totalProjects++;
        
        const projectTotalAmount = allUserInstallments.reduce((sum, installment) => sum + installment.shareAmount, 0);
        const projectPaidAmount = allUserInstallments.reduce((sum, installment) => 
          sum + installment.payments.reduce((paymentSum, payment) => {
            // Only count payments without receipt (actual payments, not receipt links)
            return paymentSum + (payment.amount > 0 && !payment.receiptImagePath ? payment.amount : 0);
          }, 0), 0
        );
        const projectRemainingAmount = projectTotalAmount - projectPaidAmount;
        
        // Get unique user count for this project
        const uniqueUsers = new Set(project.units.map(unit => unit.userId));
        const projectUserCount = uniqueUsers.size;
        
        totalAmount += projectTotalAmount;
        paidAmount += projectPaidAmount;
        remainingAmount += projectRemainingAmount;
        totalUsers += projectUserCount;

        // Calculate overdue amount (simplified - consider remaining amount as overdue)
        overdueAmount += projectRemainingAmount;

        projectSummaries.push({
          id: project.id,
          name: project.name,
          description: project.description,
          totalAmount: projectTotalAmount,
          paidAmount: projectPaidAmount,
          remainingAmount: projectRemainingAmount,
          userCount: projectUserCount,
          unitsCount: project.units.length,
          paymentProgress: projectTotalAmount > 0 ? (projectPaidAmount / projectTotalAmount) * 100 : 0,
          installmentCount: project.installmentDefinitions.length
        });
      }
    }

    // Calculate additional metrics
    const paymentCompletionRate = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
    const averageProjectValue = totalProjects > 0 ? totalAmount / totalProjects : 0;
    const averageUserContribution = totalUsers > 0 ? totalAmount / totalUsers : 0;

    const summary = {
      totalProjects,
      totalAmount,
      paidAmount,
      remainingAmount,
      overdueAmount,
      totalUsers,
      paymentCompletionRate,
      averageProjectValue,
      averageUserContribution,
      projects: projectSummaries
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching financial summary:", error);
    return NextResponse.json(
      { error: "خطا در دریافت خلاصه مالی" },
      { status: 500 }
    );
  }
}
