import { prisma } from '../src/app/api/_lib/db';

async function addUserForDeleteTest() {
  try {
    console.log('🧪 افزودن کاربر برای تست حذف...\n');

    const projectId = 'cmfbd0cqw0001udv0lp8geqy1'; // پروژه جدید

    // 1. دریافت کاربران موجود برای افزودن
    const availableUsers = await prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          not: 'ADMIN'
        },
        units: {
          none: {
            projectId: projectId
          }
        }
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    console.log(`👤 کاربران موجود برای افزودن: ${availableUsers.length}`);
    availableUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.username}) - ${user.role}`);
    });

    if (availableUsers.length === 0) {
      console.log('❌ هیچ کاربری برای افزودن موجود نیست');
      return;
    }

    // 2. افزودن کاربر جدید
    const userToAdd = availableUsers[0];
    const unitNumber = `TEST-${Date.now()}`;
    const area = 100;

    console.log(`\n➕ افزودن کاربر: ${userToAdd.firstName} ${userToAdd.lastName}`);
    console.log(`   شماره واحد: ${unitNumber}`);
    console.log(`   متراژ: ${area} متر مربع`);

    const newUnit = await prisma.unit.create({
      data: {
        projectId: projectId,
        userId: userToAdd.id,
        unitNumber: unitNumber,
        area: area
      },
      include: {
        user: true
      }
    });

    console.log(`✅ کاربر با موفقیت اضافه شد`);
    console.log(`   شناسه واحد: ${newUnit.id}`);
    console.log(`   کاربر: ${newUnit.user.firstName} ${newUnit.user.lastName}`);

    // 3. بررسی نهایی
    const projectWithUsers = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        units: {
          include: {
            user: true,
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

    console.log(`\n📊 وضعیت نهایی پروژه:`);
    console.log(`   تعداد واحدها: ${projectWithUsers?.units.length || 0}`);
    console.log(`   کاربران پروژه:`);
    projectWithUsers?.units.forEach((unit, index) => {
      const totalPayments = unit.userInstallments.reduce((sum, installment) => 
        sum + installment.payments.length, 0);
      const status = totalPayments > 0 ? '⚠️ غیرقابل حذف' : '✅ قابل حذف';
      console.log(`     ${index + 1}. ${unit.user.firstName} ${unit.user.lastName} - واحد ${unit.unitNumber} - ${status}`);
    });

    console.log(`\n🎯 برای تست حذف:`);
    console.log(`   URL: http://localhost:3000/finance/${projectId}`);
    console.log(`   تب: مدیریت کاربران پروژه`);
    console.log(`   کاربر قابل حذف: ${userToAdd.firstName} ${userToAdd.lastName}`);

  } catch (error) {
    console.error('❌ خطا در افزودن کاربر:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addUserForDeleteTest();
