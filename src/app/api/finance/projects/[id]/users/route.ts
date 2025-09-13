import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import { getCurrentUser } from "@/app/api/_lib/db";

// Get all users for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;
    console.log("Fetching users for project:", projectId);

    // Get project users with their units (exclude admin)
    const projectUsers = await prisma.user.findMany({
      where: {
        role: {
          not: 'ADMIN' // Exclude admin users
        },
        units: {
          some: {
            projectId: projectId
          }
        }
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        units: {
          where: { projectId },
          select: {
            id: true,
            unitNumber: true,
            area: true
          }
        }
      }
    });

    console.log(`Found ${projectUsers.length} users for project ${projectId}`);
    return NextResponse.json(projectUsers);
  } catch (error) {
    console.error("Error fetching project users:", error);
    return NextResponse.json(
      { 
        error: "خطا در دریافت کاربران پروژه",
        details: error instanceof Error ? error.message : 'خطای نامشخص',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Add user to project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;
    const body = await request.json();
    const { userId, unitNumber, area } = body;

    if (!userId) {
      return NextResponse.json({ error: "شناسه کاربر الزامی است" }, { status: 400 });
    }

    if (!unitNumber) {
      return NextResponse.json({ error: "شماره واحد الزامی است" }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    // Check if unit number already exists in project
    const existingUnit = await prisma.unit.findUnique({
      where: {
        projectId_unitNumber: {
          projectId,
          unitNumber
        }
      }
    });

    if (existingUnit) {
      return NextResponse.json({ error: "شماره واحد قبلاً در این پروژه ثبت شده است" }, { status: 400 });
    }

    // Create unit for user
    const unit = await prisma.unit.create({
      data: {
        projectId,
        userId,
        unitNumber,
        area: area ? parseFloat(area) : 0
      },
      include: {
        user: true
      }
    });

    // Get installment definitions for this project
    const installmentDefinitions = await prisma.installmentDefinition.findMany({
      where: { projectId },
      orderBy: { dueDate: 'asc' }
    });

    // Create user installments for each definition
    const userInstallments = [];
    for (const definition of installmentDefinitions) {
      // Calculate user's share based on area
      const totalProjectArea = await prisma.unit.aggregate({
        where: { projectId },
        _sum: { area: true }
      });
      
      const userSharePercentage = (area ? parseFloat(area) : 0) / (totalProjectArea._sum.area || 1);
      const userShareAmount = definition.amount * userSharePercentage;

      const userInstallment = await prisma.userInstallment.create({
        data: {
          userId,
          unitId: unit.id,
          installmentDefinitionId: definition.id,
          shareAmount: userShareAmount,
          status: 'PENDING'
        }
      });

      userInstallments.push(userInstallment);
    }

    return NextResponse.json({
      message: "کاربر با موفقیت به پروژه اضافه شد",
      unit,
      userInstallments: userInstallments.length,
      installmentDefinitions: installmentDefinitions.length
    });
  } catch (error) {
    console.error("Error adding user to project:", error);
    return NextResponse.json(
      { error: "خطا در اضافه کردن کاربر به پروژه" },
      { status: 500 }
    );
  }
}

// Update user in project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;
    const body = await request.json();
    const { userId, unitNumber, area } = body;

    if (!userId) {
      return NextResponse.json({ error: "شناسه کاربر الزامی است" }, { status: 400 });
    }

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

// Remove user from project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log("Attempting to remove user from project:", { projectId, userId });

    if (!userId) {
      return NextResponse.json({ error: "شناسه کاربر الزامی است" }, { status: 400 });
    }

    // Check if user exists in project
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

    console.log(`Found ${userUnits.length} units for user in project`);

    // Check if user has any installments with payments
    const hasPayments = userUnits.some(unit => 
      unit.userInstallments.some(installment => installment.payments.length > 0)
    );

    if (hasPayments) {
      // Get payment details for better error message
      const paymentDetails = userUnits.flatMap(unit => 
        unit.userInstallments.flatMap(installment => 
          installment.payments.map(payment => ({
            date: payment.paymentDate,
            amount: payment.amount,
            description: payment.description
          }))
        )
      );

      return NextResponse.json({ 
        error: "امکان حذف کاربر وجود ندارد زیرا پرداخت‌هایی ثبت شده است",
        suggestion: "ابتدا تمام پرداخت‌ها و اقساط کاربر را حذف کنید",
        paymentCount: paymentDetails.length,
        totalAmount: paymentDetails.reduce((sum, p) => {
          // Only count actual payments, not receipt links
          return sum + (p.amount > 0 ? p.amount : 0);
        }, 0),
        payments: paymentDetails.map(p => ({
          date: p.date,
          amount: p.amount,
          description: p.description
        })),
        canDeletePayments: true
      }, { status: 400 });
    }

    // Count installments and penalties that will be deleted
    const totalInstallments = userUnits.reduce((sum, unit) => sum + unit.userInstallments.length, 0);
    const totalPenalties = userUnits.reduce((sum, unit) => 
      sum + unit.userInstallments.reduce((unitSum, installment) => unitSum + installment.penalties.length, 0), 0);

    console.log(`Will delete ${totalInstallments} installments and ${totalPenalties} penalties`);

    // Delete user's units (cascade will handle installments, payments, penalties)
    const deleteResult = await prisma.unit.deleteMany({
      where: {
        projectId,
        userId
      }
    });

    console.log(`Successfully deleted ${deleteResult.count} units`);

    return NextResponse.json({
      message: "کاربر با موفقیت از پروژه حذف شد",
      deletedUnits: deleteResult.count,
      deletedInstallments: totalInstallments,
      deletedPenalties: totalPenalties
    });
  } catch (error) {
    console.error("Error removing user from project:", error);
    return NextResponse.json(
      { 
        error: "خطا در حذف کاربر از پروژه",
        details: error instanceof Error ? error.message : 'خطای نامشخص',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}