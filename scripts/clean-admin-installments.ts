import { prisma } from '../src/app/api/_lib/db';

async function cleanAdminInstallments() {
  try {
    console.log('🧹 پاک‌سازی اقساط مدیر سیستم...\n');

    const projectId = 'cmfa8ni2j0002udcopddkg947'; // پروژه قدیمی

    // 1. پیدا کردن مدیر سیستم
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!admin) {
      console.log('❌ مدیر سیستم یافت نشد');
      return;
    }

    console.log(`👤 مدیر سیستم: ${admin.firstName} ${admin.lastName} (${admin.username})`);

    // 2. پیدا کردن واحدهای مدیر در پروژه
    const adminUnits = await prisma.unit.findMany({
      where: {
        projectId,
        userId: admin.id
      },
      include: {
        userInstallments: {
          include: {
            installmentDefinition: {
              select: {
                title: true
              }
            }
          }
        }
      }
    });

    console.log(`\n🏠 واحدهای مدیر در پروژه: ${adminUnits.length}`);

    if (adminUnits.length === 0) {
      console.log('✅ مدیر هیچ واحدی در این پروژه ندارد');
      return;
    }

    // 3. نمایش اقساط مدیر
    let totalInstallments = 0;
    for (const unit of adminUnits) {
      console.log(`\n   واحد ${unit.unitNumber}:`);
      if (unit.userInstallments.length === 0) {
        console.log('      هیچ اقساطی ندارد');
      } else {
        unit.userInstallments.forEach((inst, index) => {
          console.log(`      ${index + 1}. ${inst.installmentDefinition.title} - ${new Intl.NumberFormat('fa-IR').format(inst.shareAmount)} ریال`);
          totalInstallments++;
        });
      }
    }

    if (totalInstallments === 0) {
      console.log('\n✅ مدیر هیچ اقساطی ندارد');
      return;
    }

    // 4. حذف اقساط مدیر
    console.log(`\n🗑️ حذف ${totalInstallments} اقساط مدیر...`);
    
    // حذف پرداخت‌ها
    const deletedPayments = await prisma.payment.deleteMany({
      where: {
        userInstallment: {
          unit: {
            projectId,
            userId: admin.id
          }
        }
      }
    });

    // حذف جریمه‌ها
    const deletedPenalties = await prisma.penalty.deleteMany({
      where: {
        userInstallment: {
          unit: {
            projectId,
            userId: admin.id
          }
        }
      }
    });

    // حذف اقساط کاربر
    const deletedInstallments = await prisma.userInstallment.deleteMany({
      where: {
        unit: {
          projectId,
          userId: admin.id
        }
      }
    });

    // حذف واحدهای مدیر
    const deletedUnits = await prisma.unit.deleteMany({
      where: {
        projectId,
        userId: admin.id
      }
    });

    console.log('✅ پاک‌سازی کامل شد:');
    console.log(`   - ${deletedPayments.count} پرداخت حذف شد`);
    console.log(`   - ${deletedPenalties.count} جریمه حذف شد`);
    console.log(`   - ${deletedInstallments.count} اقساط حذف شد`);
    console.log(`   - ${deletedUnits.count} واحد حذف شد`);

    // 5. بررسی مجدد تعریف‌های اقساط
    console.log('\n🔍 بررسی مجدد تعریف‌های اقساط:');
    const installmentDefinitions = await prisma.installmentDefinition.findMany({
      where: { projectId },
      orderBy: { dueDate: 'asc' }
    });

    for (const def of installmentDefinitions) {
      const userInstallments = await prisma.userInstallment.findMany({
        where: { installmentDefinitionId: def.id }
      });

      if (userInstallments.length === 0) {
        console.log(`   ✅ ${def.title} - قابل حذف است`);
      } else {
        console.log(`   ❌ ${def.title} - ${userInstallments.length} اقساط کاربری دارد`);
      }
    }

  } catch (error) {
    console.error('❌ خطا در پاک‌سازی:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanAdminInstallments();
