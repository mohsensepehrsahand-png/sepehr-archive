import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import { getCurrentUser } from "@/app/api/_lib/db";

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

    // Get only default installment definitions for the project
    const installmentDefinitions = await prisma.installmentDefinition.findMany({
      where: { 
        projectId,
        isDefault: true // Only get default installments
      },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json(installmentDefinitions);
  } catch (error) {
    console.error("Error fetching installment definitions:", error);
    return NextResponse.json(
      { error: "خطا در دریافت تعریف‌های اقساط" },
      { status: 500 }
    );
  }
}

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
    const { title, dueDate, amount } = body;

    if (!title) {
      return NextResponse.json({ error: "عنوان قسط الزامی است" }, { status: 400 });
    }

    // Get the next order number for this project
    const lastOrder = await prisma.installmentDefinition.findFirst({
      where: { projectId, isDefault: true },
      orderBy: { order: 'desc' },
      select: { order: true }
    });
    const nextOrder = (lastOrder?.order || 0) + 1;

    // Create new default installment definition
    const installmentDefinition = await prisma.installmentDefinition.create({
      data: {
        projectId,
        title,
        dueDate: dueDate ? new Date(dueDate) : new Date(), // Use current date if not provided
        amount: amount ? parseFloat(amount) : 0, // Use 0 if not provided
        isDefault: true, // Mark as default installment
        order: nextOrder
      }
    });

    // Get all existing users in this project
    const projectUsers = await prisma.unit.findMany({
      where: { projectId },
      include: {
        user: true
      }
    });

    // Create user installments for each existing user (only if they don't have customized installments)
    const userInstallments = [];
    for (const unit of projectUsers) {
      // Check if user already has a customized installment for this definition
      const existingCustomizedInstallment = await prisma.userInstallment.findFirst({
        where: {
          unitId: unit.id,
          installmentDefinitionId: installmentDefinition.id,
          isCustomized: true
        }
      });

      // Only create if no customized installment exists
      if (!existingCustomizedInstallment) {
        // Calculate user's share based on area
        const totalProjectArea = await prisma.unit.aggregate({
          where: { projectId },
          _sum: { area: true }
        });
        
        const userSharePercentage = unit.area / (totalProjectArea._sum.area || 1);
        const userShareAmount = installmentDefinition.amount * userSharePercentage;

        const userInstallment = await prisma.userInstallment.create({
          data: {
            userId: unit.userId,
            unitId: unit.id,
            installmentDefinitionId: installmentDefinition.id,
            shareAmount: userShareAmount,
            status: 'PENDING',
            isCustomized: false
          }
        });

        userInstallments.push(userInstallment);
      }
    }

    return NextResponse.json({
      message: "تعریف قسط با موفقیت ایجاد شد",
      installmentDefinition,
      createdUserInstallments: userInstallments.length
    });
  } catch (error) {
    console.error("Error creating installment definition:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد تعریف قسط" },
      { status: 500 }
    );
  }
}

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
    const { installmentDefinitionId, title, dueDate, amount } = body;

    if (!installmentDefinitionId || !title) {
      return NextResponse.json({ error: "شناسه و عنوان قسط الزامی است" }, { status: 400 });
    }

    // Update installment definition
    const updatedInstallmentDefinition = await prisma.installmentDefinition.update({
      where: { id: installmentDefinitionId },
      data: {
        title,
        dueDate: dueDate ? new Date(dueDate) : undefined, // Only update if provided
        amount: amount ? parseFloat(amount) : undefined // Only update if provided
      }
    });

    // If amount was updated, recalculate only non-customized user installments
    if (amount) {
      const newAmount = parseFloat(amount);
      
      // Get only non-customized user installments for this installment definition
      const nonCustomizedUserInstallments = await prisma.userInstallment.findMany({
        where: { 
          installmentDefinitionId,
          isCustomized: false // Only update non-customized installments
        },
        include: { unit: true }
      });

      if (nonCustomizedUserInstallments.length > 0) {
        // Calculate total area for all units in this project
        const totalProjectArea = await prisma.unit.aggregate({
          where: { projectId },
          _sum: { area: true }
        });

        const totalArea = totalProjectArea._sum.area || 1;

        // Update each non-customized user installment with new share amount
        await Promise.all(
          nonCustomizedUserInstallments.map(ui =>
            prisma.userInstallment.update({
              where: { id: ui.id },
              data: {
                shareAmount: (newAmount * ui.unit.area) / totalArea
              }
            })
          )
        );
      }
    }

    return NextResponse.json({
      message: "تعریف قسط با موفقیت به‌روزرسانی شد",
      installmentDefinition: updatedInstallmentDefinition
    });
  } catch (error) {
    console.error("Error updating installment definition:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی تعریف قسط" },
      { status: 500 }
    );
  }
}

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
    const installmentDefinitionId = searchParams.get('installmentDefinitionId');

    if (!installmentDefinitionId) {
      return NextResponse.json({ error: "شناسه تعریف قسط الزامی است" }, { status: 400 });
    }

    // Check if there are any user installments using this definition
    const userInstallmentsUsingDefinition = await prisma.userInstallment.findMany({
      where: { 
        installmentDefinitionId
      }
    });

    console.log(`🔍 Found ${userInstallmentsUsingDefinition.length} installments using definition ${installmentDefinitionId}`);

    if (userInstallmentsUsingDefinition.length > 0) {
      // Check if any of them are not customized
      const nonCustomizedCount = userInstallmentsUsingDefinition.filter(ui => !ui.isCustomized).length;
      
      console.log(`🔍 Non-customized count: ${nonCustomizedCount}`);
      console.log(`🔍 Customized count: ${userInstallmentsUsingDefinition.length - nonCustomizedCount}`);
      
      if (nonCustomizedCount > 0) {
        console.log('❌ Cannot delete - still has non-customized installments');
        return NextResponse.json({ 
          error: "امکان حذف تعریف قسط وجود ندارد زیرا اقساط غیر شخصی‌سازی شده کاربران از آن استفاده می‌کنند",
          nonCustomizedUserInstallmentsCount: nonCustomizedCount
        }, { status: 400 });
      }

      // If all are customized, we can delete the definition but need to set their installmentDefinitionId to null
      console.log(`✅ Found ${userInstallmentsUsingDefinition.length} customized installments that will be made independent`);
      
      // Make all customized installments independent by setting their installmentDefinitionId to null
      await prisma.userInstallment.updateMany({
        where: {
          installmentDefinitionId,
          isCustomized: true
        },
        data: {
          installmentDefinitionId: null
        }
      });

      console.log('✅ Made all customized installments independent');
    } else {
      console.log('✅ No user installments using this definition');
    }

    // Delete installment definition
    await prisma.installmentDefinition.delete({
      where: { id: installmentDefinitionId }
    });

    return NextResponse.json({
      message: "تعریف قسط با موفقیت حذف شد"
    });
  } catch (error) {
    console.error("Error deleting installment definition:", error);
    return NextResponse.json(
      { error: "خطا در حذف تعریف قسط" },
      { status: 500 }
    );
  }
}
