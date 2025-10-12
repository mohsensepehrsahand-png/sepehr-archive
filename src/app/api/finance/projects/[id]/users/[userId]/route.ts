import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import { getCurrentUser } from "@/app/api/_lib/db";
import { FinancialCalculator } from "@/lib/financialCalculations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, userId } = await params;

    // Check if user has access to this project
    if (user.role !== "ADMIN") {
      if (user.id !== userId) {
        return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
      }
    }

    // Get project and user data
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        units: {
          where: { userId },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true
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
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: "پروژه یافت نشد" }, { status: 404 });
    }

    if (project.units.length === 0) {
      return NextResponse.json({ error: "کاربر در این پروژه عضو نیست" }, { status: 404 });
    }

    const userData = project.units[0].user;
    const userName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.username;

    // Get user penalty settings
    const userSettings = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        penaltyGraceDays: true,
        dailyPenaltyAmount: true
      }
    });

    const penaltyGraceDays = userSettings?.penaltyGraceDays || 0;
    const dailyPenaltyAmount = userSettings?.dailyPenaltyAmount || 0;

    // Get all user installments and sort by order field
    const userInstallments = project.units
      .flatMap(unit => unit.userInstallments)
      .sort((a, b) => (a.order || a.installmentDefinition?.order || 0) - (b.order || b.installmentDefinition?.order || 0));


    // Calculate summary
    const totalShareAmount = userInstallments.reduce((sum, inst) => sum + inst.shareAmount, 0);
    const totalPaidAmount = userInstallments.reduce((sum, inst) => 
      sum + (inst.payments ? inst.payments.reduce((paymentSum, payment) => {
        // Only count payments without receipt (actual installment payments)
        return paymentSum + (payment.amount > 0 && !payment.receiptImagePath ? payment.amount : 0);
      }, 0) : 0), 0
    );
    // Calculate total penalty amount from penalties array (will be calculated later)
    let totalPenaltyAmount = 0;
    const remainingAmount = totalShareAmount - totalPaidAmount;
    const paidPercentage = totalShareAmount > 0 ? Math.round((totalPaidAmount / totalShareAmount) * 100) : 0;

    const summary = {
      totalShareAmount,
      totalPaidAmount,
      remainingAmount,
      totalPenaltyAmount,
      paidPercentage
    };

    // Format installments data
    const installments = userInstallments.map(inst => {
      // Only count payments without receipt (actual installment payments)
      const paidAmount = inst.payments ? inst.payments.reduce((sum, p) => {
        return sum + (p.amount > 0 && !p.receiptImagePath ? p.amount : 0);
      }, 0) : 0;
      const remainingAmount = inst.shareAmount - paidAmount;
      
      
      const dueDate = inst.isCustomized && inst.dueDate ? inst.dueDate : inst.installmentDefinition?.dueDate;
      let status = dueDate ? FinancialCalculator.calculateInstallmentStatus(
        inst.shareAmount,
        paidAmount,
        new Date(dueDate)
      ) : 'PENDING';

      // Override status for delayed payments
      if (status === 'PAID' && inst.payments && inst.payments.length > 0) {
        const latestPayment = inst.payments
          .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0];
        
        if (latestPayment && dueDate) {
          const paymentDateObj = new Date(latestPayment.paymentDate);
          const dueDateObj = new Date(dueDate);
          const daysDifference = Math.ceil((paymentDateObj.getTime() - dueDateObj.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDifference > penaltyGraceDays) {
            status = 'PAID_WITH_DELAY';
          }
        }
      }

      // Calculate daily delay
      let dailyDelay = 0;
      if (inst.payments && inst.payments.length > 0) {
        const latestPayment = inst.payments
          .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0];
        
        if (latestPayment && dueDate) {
          const paymentDateObj = new Date(latestPayment.paymentDate);
          const dueDateObj = new Date(dueDate);
          const daysDifference = Math.ceil((paymentDateObj.getTime() - dueDateObj.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDifference > penaltyGraceDays) {
            dailyDelay = daysDifference - penaltyGraceDays;
          }
        }
      }

      return {
        id: inst.id,
        title: inst.isCustomized && inst.title ? inst.title : (inst.installmentDefinition?.title || 'قسط شخصی‌سازی شده'),
        dueDate: dueDate,
        shareAmount: inst.shareAmount,
        paidAmount,
        remainingAmount,
        status,
        order: inst.order || inst.installmentDefinition?.order || 0,
        installmentDefinitionId: inst.installmentDefinitionId,
        isCustomized: inst.isCustomized,
        dailyDelay,
        payments: inst.payments.map(payment => ({
          id: payment.id,
          paymentDate: payment.paymentDate,
          amount: payment.amount,
          description: payment.description,
          receiptImagePath: payment.receiptImagePath
        }))
      };
    });

    // Format penalties data based on dailyDelay from installments
    const penalties = installments
      .filter(inst => inst.dailyDelay > 0)
      .map((inst, index) => ({
        id: `penalty-${inst.id}`,
        installmentTitle: inst.title,
        installmentNumber: inst.order,
        daysLate: inst.dailyDelay,
        dailyRate: dailyPenaltyAmount,
        totalPenalty: inst.dailyDelay * dailyPenaltyAmount,
        createdAt: new Date().toISOString(),
        reason: 'تأخیر در پرداخت'
      }));

    // Update total penalty amount based on calculated penalties
    totalPenaltyAmount = penalties.reduce((sum, penalty) => sum + penalty.totalPenalty, 0);

    // Update summary with correct total penalty amount
    const updatedSummary = {
      ...summary,
      totalPenaltyAmount
    };

    // Get penalty rate (this could be stored in project settings or app settings)
    const penaltyRate = 0.1; // Default 0.1% per day

    return NextResponse.json({
      userName,
      projectName: project.name,
      summary: updatedSummary,
      installments,
      penalties,
      penaltyRate
    });
  } catch (error) {
    console.error("Error fetching user financial data:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات مالی کاربر" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, userId } = await params;
    const body = await request.json();
    const { unitNumber, area } = body;

    if (!unitNumber) {
      return NextResponse.json({ error: "شماره واحد الزامی است" }, { status: 400 });
    }

    // Check if user exists in project
    const existingUnit = await prisma.unit.findFirst({
      where: {
        projectId,
        userId
      },
      include: {
        user: true
      }
    });

    if (!existingUnit) {
      return NextResponse.json({ error: "کاربر در این پروژه یافت نشد" }, { status: 404 });
    }

    // Check if new unit number conflicts with other units (excluding current user's unit)
    const conflictingUnit = await prisma.unit.findFirst({
      where: {
        projectId,
        unitNumber,
        userId: { not: userId }
      }
    });

    if (conflictingUnit) {
      return NextResponse.json({ error: "شماره واحد قبلاً در این پروژه ثبت شده است" }, { status: 400 });
    }

    // Update the unit
    const updatedUnit = await prisma.unit.update({
      where: { id: existingUnit.id },
      data: {
        unitNumber,
        area: area ? parseFloat(area) : 0
      },
      include: {
        user: true
      }
    });

    // Recalculate user installments based on new area
    const totalProjectArea = await prisma.unit.aggregate({
      where: { projectId },
      _sum: { area: true }
    });

    const userSharePercentage = (area ? parseFloat(area) : 0) / (totalProjectArea._sum.area || 1);

    // Update all user installments for this unit
    const userInstallments = await prisma.userInstallment.findMany({
      where: { unitId: existingUnit.id },
      include: { installmentDefinition: true }
    });

    for (const installment of userInstallments) {
      const newShareAmount = installment.installmentDefinition.amount * userSharePercentage;
      
      await prisma.userInstallment.update({
        where: { id: installment.id },
        data: { shareAmount: newShareAmount }
      });
    }

    return NextResponse.json({
      message: "اطلاعات کاربر با موفقیت به‌روزرسانی شد",
      unit: updatedUnit,
      updatedInstallments: userInstallments.length,
      newSharePercentage: userSharePercentage
    });
  } catch (error) {
    console.error("Error updating user in project:", error);
    return NextResponse.json(
      { 
        error: "خطا در به‌روزرسانی اطلاعات کاربر",
        details: error instanceof Error ? error.message : 'خطای نامشخص'
      },
      { status: 500 }
    );
  }
}