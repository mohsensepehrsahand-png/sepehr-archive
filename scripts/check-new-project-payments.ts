import { prisma } from '../src/app/api/_lib/db';

async function checkNewProjectPayments() {
  try {
    console.log('🔍 بررسی پرداخت‌های پروژه جدید...\n');

    const projectId = 'cmfbd0cqw0001udv0lp8geqy1'; // پروژه جدید

    // 1. دریافت کاربران پروژه با جزئیات پرداخت‌ها
    const projectUsers = await prisma.user.findMany({
      where: {
        role: {
          not: 'ADMIN'
        },
        units: {
          some: {
            projectId: projectId
          }
        }
      },
      include: {
        units: {
          where: { projectId },
          include: {
            userInstallments: {
              include: {
                payments: true,
                penalties: true
              }
            }
          }
        }
      }
    });

    console.log(`👥 کاربران پروژه: ${projectUsers.length}\n`);

    projectUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.username})`);
      
      const totalInstallments = user.units.reduce((sum, unit) => sum + unit.userInstallments.length, 0);
      const totalPayments = user.units.reduce((sum, unit) => 
        sum + unit.userInstallments.reduce((unitSum, installment) => 
          unitSum + installment.payments.length, 0), 0);
      const totalPenalties = user.units.reduce((sum, unit) => 
        sum + unit.userInstallments.reduce((unitSum, installment) => 
          unitSum + installment.penalties.length, 0), 0);

      console.log(`   واحدها: ${user.units.map(unit => unit.unitNumber).join(', ')}`);
      console.log(`   اقساط: ${totalInstallments}`);
      console.log(`   پرداخت‌ها: ${totalPayments}`);
      console.log(`   جریمه‌ها: ${totalPenalties}`);

      // بررسی جزئیات پرداخت‌ها
      if (totalPayments > 0) {
        console.log(`   💰 جزئیات پرداخت‌ها:`);
        user.units.forEach(unit => {
          unit.userInstallments.forEach(installment => {
            if (installment.payments.length > 0) {
              installment.payments.forEach(payment => {
                console.log(`      - ${new Date(payment.paymentDate).toLocaleDateString('fa-IR')}: ${new Intl.NumberFormat('fa-IR').format(payment.amount)} ریال`);
              });
            }
          });
        });
        console.log(`   ⚠️ این کاربر قابل حذف نیست (دارای پرداخت)`);
      } else {
        console.log(`   ✅ این کاربر قابل حذف است (بدون پرداخت)`);
      }
      console.log('');
    });

    // 2. بررسی کاربران قابل حذف
    const deletableUsers = projectUsers.filter(user => {
      const totalPayments = user.units.reduce((sum, unit) => 
        sum + unit.userInstallments.reduce((unitSum, installment) => 
          unitSum + installment.payments.length, 0), 0);
      return totalPayments === 0;
    });

    console.log(`🗑️ کاربران قابل حذف: ${deletableUsers.length}`);
    deletableUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.username})`);
    });

    // 3. بررسی کاربران غیرقابل حذف
    const nonDeletableUsers = projectUsers.filter(user => {
      const totalPayments = user.units.reduce((sum, unit) => 
        sum + unit.userInstallments.reduce((unitSum, installment) => 
          unitSum + installment.payments.length, 0), 0);
      return totalPayments > 0;
    });

    console.log(`\n⚠️ کاربران غیرقابل حذف: ${nonDeletableUsers.length}`);
    nonDeletableUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.username})`);
    });

    console.log('\n🎯 برای تست حذف کاربر:');
    if (deletableUsers.length > 0) {
      console.log(`   از پروژه جدید استفاده کنید: http://localhost:3000/finance/${projectId}`);
      console.log(`   کاربر قابل حذف: ${deletableUsers[0].firstName} ${deletableUsers[0].lastName}`);
    } else {
      console.log('   ابتدا یک کاربر بدون پرداخت اضافه کنید');
    }

  } catch (error) {
    console.error('❌ خطا در بررسی:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNewProjectPayments();
