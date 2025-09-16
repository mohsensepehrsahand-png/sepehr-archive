import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// POST /api/archived-financial/[id]/restore - بازگردانی کاربر آرشیو شده
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // بررسی وجود کاربر آرشیو
    const archivedUser = await prisma.archivedUser.findUnique({
      where: { id },
      include: {
        archivedUnits: {
          include: {
            archivedUserInstallments: {
              include: {
                archivedPayments: true,
                archivedPenalties: true
              }
            }
          }
        },
        archivedUserInstallments: {
          include: {
            archivedPayments: true,
            archivedPenalties: true
          }
        }
      }
    });

    if (!archivedUser) {
      return NextResponse.json(
        { error: 'کاربر آرشیو یافت نشد' },
        { status: 404 }
      );
    }

    // بررسی وجود کاربر با همین نام کاربری
    const existingUser = await prisma.user.findFirst({
      where: { username: archivedUser.username }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'کاربری با این نام کاربری قبلاً وجود دارد' },
        { status: 400 }
      );
    }

    // ایجاد کاربر جدید
    const restoredUser = await prisma.user.create({
      data: {
        username: archivedUser.username,
        passwordHash: '$2b$10$defaultHash', // رمز عبور پیش‌فرض
        firstName: archivedUser.firstName,
        lastName: archivedUser.lastName,
        email: archivedUser.email,
        role: archivedUser.role,
        dailyPenaltyAmount: archivedUser.dailyPenaltyAmount,
        penaltyGraceDays: archivedUser.penaltyGraceDays
      }
    });

    // بازگردانی واحدها و اطلاعات مالی
    for (const archivedUnit of archivedUser.archivedUnits) {
      // پیدا کردن پروژه مربوطه
      const project = await prisma.project.findFirst({
        where: { id: archivedUnit.projectId }
      });

      if (project) {
        const restoredUnit = await prisma.unit.create({
          data: {
            projectId: project.id,
            userId: restoredUser.id,
            unitNumber: archivedUnit.unitNumber,
            area: archivedUnit.area
          }
        });

        // بازگردانی اقساط
        for (const archivedInstallment of archivedUnit.archivedUserInstallments) {
          const installmentDef = await prisma.installmentDefinition.findFirst({
            where: { id: archivedInstallment.installmentDefinitionId }
          });

          if (installmentDef) {
            const restoredInstallment = await prisma.userInstallment.create({
              data: {
                userId: restoredUser.id,
                unitId: restoredUnit.id,
                installmentDefinitionId: installmentDef.id,
                shareAmount: archivedInstallment.shareAmount,
                status: archivedInstallment.status
              }
            });

            // بازگردانی پرداخت‌ها
            for (const archivedPayment of archivedInstallment.archivedPayments) {
              await prisma.payment.create({
                data: {
                  userInstallmentId: restoredInstallment.id,
                  paymentDate: archivedPayment.paymentDate,
                  amount: archivedPayment.amount,
                  description: archivedPayment.description
                }
              });
            }

            // بازگردانی جریمه‌ها
            for (const archivedPenalty of archivedInstallment.archivedPenalties) {
              await prisma.penalty.create({
                data: {
                  userInstallmentId: restoredInstallment.id,
                  daysLate: archivedPenalty.daysLate,
                  dailyRate: archivedPenalty.dailyRate,
                  totalPenalty: archivedPenalty.totalPenalty
                }
              });
            }
          }
        }
      }
    }

    // حذف اطلاعات آرشیو
    await prisma.archivedUser.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'کاربر با موفقیت بازگردانی شد',
      restoredUser: {
        id: restoredUser.id,
        username: restoredUser.username,
        firstName: restoredUser.firstName,
        lastName: restoredUser.lastName
      }
    });

  } catch (error) {
    console.error('Error restoring archived user:', error);
    return NextResponse.json(
      { error: 'خطا در بازگردانی کاربر' },
      { status: 500 }
    );
  }
}
