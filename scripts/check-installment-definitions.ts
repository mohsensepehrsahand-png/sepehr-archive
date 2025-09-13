import { prisma } from '../src/app/api/_lib/db';

async function checkInstallmentDefinitions() {
  try {
    console.log('🔍 بررسی تعریف‌های اقساط و اقساط کاربران...\n');

    const projectId = 'cmfa8ni2j0002udcopddkg947'; // پروژه قدیمی

    // 1. دریافت تعریف‌های اقساط پروژه
    console.log('📋 تعریف‌های اقساط پروژه:');
    const installmentDefinitions = await prisma.installmentDefinition.findMany({
      where: { projectId },
      orderBy: { dueDate: 'asc' }
    });

    if (installmentDefinitions.length === 0) {
      console.log('   هیچ تعریف قسطی یافت نشد');
    } else {
      installmentDefinitions.forEach((def, index) => {
        console.log(`   ${index + 1}. ${def.title} (${def.id})`);
        console.log(`      تاریخ سررسید: ${new Date(def.dueDate).toLocaleDateString('fa-IR')}`);
        console.log(`      مبلغ: ${new Intl.NumberFormat('fa-IR').format(def.amount)} ریال`);
      });
    }

    // 2. بررسی اقساط کاربران برای هر تعریف
    console.log('\n👥 بررسی اقساط کاربران:');
    for (const def of installmentDefinitions) {
      const userInstallments = await prisma.userInstallment.findMany({
        where: { installmentDefinitionId: def.id },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              username: true
            }
          }
        }
      });

      console.log(`\n   تعریف: ${def.title}`);
      if (userInstallments.length === 0) {
        console.log('      ✅ هیچ اقساط کاربری یافت نشد - قابل حذف است');
      } else {
        console.log(`      ❌ ${userInstallments.length} اقساط کاربری یافت شد:`);
        userInstallments.forEach((inst, index) => {
          const userName = `${inst.user.firstName || ''} ${inst.user.lastName || ''}`.trim() || inst.user.username;
          console.log(`         ${index + 1}. ${userName} - ${new Intl.NumberFormat('fa-IR').format(inst.shareAmount)} ریال`);
        });
      }
    }

    // 3. بررسی کل اقساط کاربران پروژه
    console.log('\n📊 آمار کلی پروژه:');
    const allUserInstallments = await prisma.userInstallment.findMany({
      where: {
        unit: {
          projectId
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            username: true
          }
        },
        installmentDefinition: {
          select: {
            title: true
          }
        }
      }
    });

    console.log(`   کل اقساط کاربران: ${allUserInstallments.length}`);
    if (allUserInstallments.length > 0) {
      console.log('   جزئیات:');
      allUserInstallments.forEach((inst, index) => {
        const userName = `${inst.user.firstName || ''} ${inst.user.lastName || ''}`.trim() || inst.user.username;
        console.log(`     ${index + 1}. ${userName} - ${inst.installmentDefinition.title} - ${new Intl.NumberFormat('fa-IR').format(inst.shareAmount)} ریال`);
      });
    }

  } catch (error) {
    console.error('❌ خطا در بررسی:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInstallmentDefinitions();
