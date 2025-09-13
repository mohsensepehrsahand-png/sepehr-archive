import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import { getCurrentUser } from "@/app/api/_lib/db";

// Predefined default installments
const DEFAULT_INSTALLMENTS = [
  { title: "پیش‌قرارداد قدرالسهم زمین", amount: 0 },
  { title: "تسویه کامل قدرالسهم زمین و انتقال سند", amount: 0 },
  { title: "تهیه نقشه و اخذ مجوزها", amount: 0 },
  { title: "مابه‌التفاوت تهیه نقشه و اخذ مجوزها", amount: 0 },
  { title: "گودبرداری ، پایدارسازی و بهسازی", amount: 0 },
  { title: "مابه‌التفاوت گودبرداری ، پایدارسازی و بهسازی", amount: 0 },
  { title: "اجرای فونداسیون", amount: 0 },
  { title: "مابه‌التفاوت اجرای فونداسیون", amount: 0 },
  { title: "اجرای اسکلت سازه مرحله 1", amount: 0 },
  { title: "مابه‌التفاوت اجرای اسکلت سازه مرحله 1", amount: 0 },
  { title: "اجرای اسکلت سازه مرحله 2", amount: 0 },
  { title: "مابه‌التفاوت اجرای اسکلت سازه مرحله 2", amount: 0 },
  { title: "اجرای وال پست و دیوارچینی", amount: 0 },
  { title: "مابه‌التفاوت اجرای وال پست و دیوارچینی", amount: 0 },
  { title: "شاسی کشی و خرید آسانسور", amount: 0 },
  { title: "مابه التفاوت شاسی کشی و خرید آسانسور", amount: 0 },
  { title: "اجرای تاسیسات", amount: 0 },
  { title: "مابه‌التفاوت اجرای تاسیسات", amount: 0 },
  { title: "سرامیک‌کاری", amount: 0 },
  { title: "مابه‌التفاوت سرامیک‌کاری", amount: 0 },
  { title: "اجرای نازک‌کاری", amount: 0 },
  { title: "مابه‌التفاوت اجرای نازک‌کاری", amount: 0 },
  { title: "اجرای سقف کاذب و نصبیات", amount: 0 },
  { title: "مابه‌التفاوت اجرای سقف کاذب و نصبیات", amount: 0 },
  { title: "اجرای نما و سنگ کاری", amount: 0 },
  { title: "مابه‌التفاوت اجرای نما و سنگ کاری", amount: 0 },
  { title: "گرفتن پایانکار و پرداخت جریمه ها", amount: 0 },
  { title: "تحویل نهایی و مابه التفاوت گرفتن پایانکار و پرداخت جریمه ها", amount: 0 }
];

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

    // Check if default installments already exist for this project
    const existingDefaults = await prisma.installmentDefinition.findMany({
      where: { 
        projectId,
        isDefault: true
      }
    });

    if (existingDefaults.length > 0) {
      return NextResponse.json({ 
        error: "اقساط پیش فرض قبلاً برای این پروژه اضافه شده است",
        existingCount: existingDefaults.length
      }, { status: 400 });
    }

    // Create all default installment definitions
    const createdInstallments = [];
    for (let i = 0; i < DEFAULT_INSTALLMENTS.length; i++) {
      const installment = DEFAULT_INSTALLMENTS[i];
      const installmentDefinition = await prisma.installmentDefinition.create({
        data: {
          projectId,
          title: installment.title,
          dueDate: null, // No due date for default installments
          amount: installment.amount,
          isDefault: true,
          order: i + 1 // Set order based on array index
        }
      });
      createdInstallments.push(installmentDefinition);
    }

    // Get all existing users in this project
    const projectUsers = await prisma.unit.findMany({
      where: { projectId },
      include: {
        user: true
      }
    });

    // Create user installments for each existing user and each default installment
    const userInstallments = [];
    for (const unit of projectUsers) {
      // Calculate user's share based on area
      const totalProjectArea = await prisma.unit.aggregate({
        where: { projectId },
        _sum: { area: true }
      });
      
      const userSharePercentage = unit.area / (totalProjectArea._sum.area || 1);

      for (const installmentDefinition of createdInstallments) {
        const userShareAmount = installmentDefinition.amount * userSharePercentage;

        const userInstallment = await prisma.userInstallment.create({
          data: {
            userId: unit.userId,
            unitId: unit.id,
            installmentDefinitionId: installmentDefinition.id,
            shareAmount: userShareAmount,
            status: 'PENDING'
          }
        });

        userInstallments.push(userInstallment);
      }
    }

    return NextResponse.json({
      message: "اقساط پیش فرض با موفقیت اضافه شدند",
      createdInstallments: createdInstallments.length,
      createdUserInstallments: userInstallments.length
    });
  } catch (error) {
    console.error("Error creating default installments:", error);
    return NextResponse.json(
      { error: "خطا در اضافه کردن اقساط پیش فرض" },
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

    // Get all default installment definitions for this project
    const defaultInstallments = await prisma.installmentDefinition.findMany({
      where: { 
        projectId,
        isDefault: true
      }
    });

    if (defaultInstallments.length === 0) {
      return NextResponse.json({ 
        error: "هیچ قسط پیش فرضی برای حذف وجود ندارد"
      }, { status: 400 });
    }

    // Get all user installments that use these default definitions
    const installmentIds = defaultInstallments.map(inst => inst.id);
    const userInstallments = await prisma.userInstallment.findMany({
      where: {
        installmentDefinitionId: {
          in: installmentIds
        }
      }
    });

    // Delete all user installments first (due to foreign key constraints)
    if (userInstallments.length > 0) {
      await prisma.userInstallment.deleteMany({
        where: {
          installmentDefinitionId: {
            in: installmentIds
          }
        }
      });
    }

    // Delete all default installment definitions
    await prisma.installmentDefinition.deleteMany({
      where: {
        projectId,
        isDefault: true
      }
    });

    return NextResponse.json({
      message: "تمام اقساط پیش فرض با موفقیت حذف شدند",
      deletedInstallments: defaultInstallments.length,
      deletedUserInstallments: userInstallments.length
    });
  } catch (error) {
    console.error("Error deleting default installments:", error);
    return NextResponse.json(
      { error: "خطا در حذف اقساط پیش فرض" },
      { status: 500 }
    );
  }
}
