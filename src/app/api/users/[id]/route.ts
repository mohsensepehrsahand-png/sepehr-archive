import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/api/_lib/db';
import bcrypt from 'bcryptjs';

// GET /api/users/[id] - دریافت اطلاعات کاربر و بررسی وجود اطلاعات مالی
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        units: true,
        userInstallments: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    const hasFinancialData = user.units.length > 0 || user.userInstallments.length > 0;

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      },
      hasFinancialData,
      financialDataCount: {
        units: user.units.length,
        installments: user.userInstallments.length
      }
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات کاربر' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - تغییر وضعیت کاربر یا تغییر رمز عبور
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { isActive, newPassword } = body;

    // بررسی وجود کاربر
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    let updateData: any = {};

    // تغییر وضعیت فعال/غیرفعال
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }

    // تغییر رمز عبور
    if (newPassword && newPassword.trim()) {
      const passwordHash = await bcrypt.hash(newPassword.trim(), 10);
      updateData.passwordHash = passwordHash;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'هیچ تغییری برای اعمال وجود ندارد' },
        { status: 400 }
      );
    }

    // به‌روزرسانی کاربر
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        email: true,
        isActive: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: isActive !== undefined ? 
        `کاربر ${isActive ? 'فعال' : 'غیرفعال'} شد` : 
        'رمز عبور تغییر کرد'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی کاربر' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - حذف کاربر
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // بررسی وجود کاربر
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        units: {
          include: {
            project: true,
            userInstallments: {
              include: {
                payments: true,
                penalties: true,
                installmentDefinition: true
              }
            }
          }
        },
        userInstallments: {
          include: {
            payments: true,
            penalties: true,
            installmentDefinition: true,
            unit: {
              include: {
                project: true
              }
            }
          }
        },
        createdProjects: true,
        createdFolders: true,
        createdDocuments: true,
        permissions: true,
        activities: true
      }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    // بررسی وجود اطلاعات مالی
    const hasFinancialData = existingUser.units.length > 0 || existingUser.userInstallments.length > 0;

    // بررسی وجود اطلاعات مرتبط که مانع حذف می‌شوند
    const hasCreatedContent = existingUser.createdProjects.length > 0 || 
                             existingUser.createdFolders.length > 0 || 
                             existingUser.createdDocuments.length > 0;

    if (hasCreatedContent) {
      return NextResponse.json(
        { error: 'امکان حذف کاربر وجود ندارد. کاربر دارای پروژه‌ها، پوشه‌ها یا اسناد ایجاد شده است.' },
        { status: 400 }
      );
    }

    // استفاده از transaction برای اطمینان از یکپارچگی داده‌ها
    await prisma.$transaction(async (tx) => {
      // حذف permissions و activities که مانع حذف کاربر می‌شوند
      await tx.permission.deleteMany({
        where: { userId: id }
      });

      await tx.activityLog.deleteMany({
        where: { userId: id }
      });

      // اگر اطلاعات مالی وجود دارد، ابتدا آن‌ها را آرشیو می‌کنیم
      if (hasFinancialData) {
        // ایجاد رکورد آرشیو کاربر
        const archivedUser = await tx.archivedUser.create({
          data: {
            originalUserId: existingUser.id,
            username: existingUser.username,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            email: existingUser.email,
            role: existingUser.role,
            dailyPenaltyAmount: existingUser.dailyPenaltyAmount,
            penaltyGraceDays: existingUser.penaltyGraceDays
          }
        });

        // آرشیو کردن واحدها
        for (const unit of existingUser.units) {
          const archivedUnit = await tx.archivedUnit.create({
            data: {
              archivedUserId: archivedUser.id,
              projectId: unit.projectId,
              projectName: unit.project?.name || 'پروژه حذف شده',
              unitNumber: unit.unitNumber,
              area: unit.area
            }
          });

          // آرشیو کردن اقساط مربوط به این واحد
          for (const installment of unit.userInstallments) {
            const archivedInstallment = await tx.archivedUserInstallment.create({
              data: {
                archivedUserId: archivedUser.id,
                archivedUnitId: archivedUnit.id,
                installmentDefinitionId: installment.installmentDefinitionId,
                installmentTitle: installment.installmentDefinition?.title || 'قسط',
                shareAmount: installment.shareAmount,
                status: installment.status
              }
            });

            // آرشیو کردن پرداخت‌ها
            for (const payment of installment.payments) {
              await tx.archivedPayment.create({
                data: {
                  archivedUserInstallmentId: archivedInstallment.id,
                  paymentDate: payment.paymentDate,
                  amount: payment.amount,
                  description: payment.description
                }
              });
            }

            // آرشیو کردن جریمه‌ها
            for (const penalty of installment.penalties) {
              await tx.archivedPenalty.create({
                data: {
                  archivedUserInstallmentId: archivedInstallment.id,
                  daysLate: penalty.daysLate,
                  dailyRate: penalty.dailyRate,
                  totalPenalty: penalty.totalPenalty
                }
              });
            }
          }
        }

        // آرشیو کردن اقساط مستقل (بدون واحد)
        for (const installment of existingUser.userInstallments.filter(ui => !ui.unitId)) {
          const archivedInstallment = await tx.archivedUserInstallment.create({
            data: {
              archivedUserId: archivedUser.id,
              installmentDefinitionId: installment.installmentDefinitionId,
              installmentTitle: installment.installmentDefinition?.title || 'قسط',
              shareAmount: installment.shareAmount,
              status: installment.status
            }
          });

          // آرشیو کردن پرداخت‌ها
          for (const payment of installment.payments) {
            await tx.archivedPayment.create({
              data: {
                archivedUserInstallmentId: archivedInstallment.id,
                paymentDate: payment.paymentDate,
                amount: payment.amount,
                description: payment.description
              }
            });
          }

          // آرشیو کردن جریمه‌ها
          for (const penalty of installment.penalties) {
            await tx.archivedPenalty.create({
              data: {
                archivedUserInstallmentId: archivedInstallment.id,
                daysLate: penalty.daysLate,
                dailyRate: penalty.dailyRate,
                totalPenalty: penalty.totalPenalty
              }
            });
          }
        }
      }

      // حذف کاربر (اطلاعات مالی قبلاً آرشیو شده‌اند)
      await tx.user.delete({
        where: { id }
      });
    });

    return NextResponse.json({
      success: true,
      message: hasFinancialData 
        ? 'کاربر با موفقیت حذف شد. اطلاعات مالی در بخش آرشیو نگهداری می‌شود.'
        : 'کاربر با موفقیت حذف شد'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    
    // بررسی نوع خطا برای پیام مناسب‌تر
    let errorMessage = 'خطا در حذف کاربر';
    if (error instanceof Error) {
      if (error.message.includes('foreign key constraint')) {
        errorMessage = 'امکان حذف کاربر به دلیل وجود اطلاعات مرتبط وجود ندارد';
      } else if (error.message.includes('unique constraint')) {
        errorMessage = 'خطا در محدودیت یکتایی داده‌ها';
      } else {
        errorMessage = `خطا در حذف کاربر: ${error.message}`;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

