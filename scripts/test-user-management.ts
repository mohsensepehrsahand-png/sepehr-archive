import { prisma } from '../src/app/api/_lib/db';

async function testUserManagement() {
  try {
    console.log('🧪 تست مدیریت کاربران پروژه...\n');

    // 1. دریافت پروژه‌های موجود
    const projects = await prisma.project.findMany({
      take: 1,
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

    if (projects.length === 0) {
      console.log('❌ هیچ پروژه‌ای یافت نشد.');
      return;
    }

    const project = projects[0];
    console.log(`📋 پروژه: ${project.name}`);
    console.log(`   تعداد واحدها: ${project.units.length}\n`);

    // 2. نمایش کاربران پروژه
    console.log('👥 کاربران پروژه:');
    const projectUsers = project.units.map(unit => unit.user);
    const uniqueUsers = projectUsers.filter((user, index, self) => 
      index === self.findIndex(u => u.id === user.id)
    );

    uniqueUsers.forEach((user, index) => {
      const userUnits = project.units.filter(unit => unit.userId === user.id);
      const totalInstallments = userUnits.reduce((sum, unit) => sum + unit.userInstallments.length, 0);
      const totalPayments = userUnits.reduce((sum, unit) => 
        sum + unit.userInstallments.reduce((unitSum, installment) => 
          unitSum + installment.payments.length, 0), 0);
      
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.username})`);
      console.log(`      نقش: ${user.role}`);
      console.log(`      واحدها: ${userUnits.map(unit => unit.unitNumber).join(', ')}`);
      console.log(`      اقساط: ${totalInstallments}, پرداخت‌ها: ${totalPayments}`);
    });

    // 3. دریافت کاربران موجود (که در پروژه نیستند)
    console.log('\n👤 کاربران موجود برای افزودن:');
    const availableUsers = await prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          not: 'ADMIN'
        },
        units: {
          none: {
            projectId: project.id
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

    if (availableUsers.length === 0) {
      console.log('   همه کاربران غیرادمین در این پروژه عضو هستند');
    } else {
      availableUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.username}) - ${user.role}`);
      });
    }

    // 4. تست حذف کاربر (اگر کاربری بدون پرداخت وجود دارد)
    const usersWithoutPayments = uniqueUsers.filter(user => {
      const userUnits = project.units.filter(unit => unit.userId === user.id);
      const hasPayments = userUnits.some(unit => 
        unit.userInstallments.some(installment => installment.payments.length > 0)
      );
      return !hasPayments;
    });

    if (usersWithoutPayments.length > 0) {
      console.log('\n🗑️ تست حذف کاربر...');
      const testUser = usersWithoutPayments[0];
      const testUserUnits = project.units.filter(unit => unit.userId === testUser.id);
      
      console.log(`   کاربر تست: ${testUser.firstName} ${testUser.lastName}`);
      console.log(`   تعداد واحدها: ${testUserUnits.length}`);
      
      const totalInstallments = testUserUnits.reduce((sum, unit) => sum + unit.userInstallments.length, 0);
      const totalPenalties = testUserUnits.reduce((sum, unit) => 
        sum + unit.userInstallments.reduce((unitSum, installment) => unitSum + installment.penalties.length, 0), 0);
      
      console.log(`   اقساط: ${totalInstallments}, جریمه‌ها: ${totalPenalties}`);
      
      // حذف کاربر
      const deleteResult = await prisma.unit.deleteMany({
        where: {
          projectId: project.id,
          userId: testUser.id
        }
      });
      
      console.log(`   ✅ ${deleteResult.count} واحد حذف شد`);
      
      // اضافه کردن مجدد کاربر
      console.log('   ➕ اضافه کردن مجدد کاربر...');
      const newUnit = await prisma.unit.create({
        data: {
          projectId: project.id,
          userId: testUser.id,
          unitNumber: `TEST-${Date.now()}`,
          area: 100
        }
      });
      
      console.log(`   ✅ واحد جدید ایجاد شد: ${newUnit.unitNumber}`);
      
      // حذف واحد تست
      await prisma.unit.delete({
        where: { id: newUnit.id }
      });
      
      console.log('   ✅ واحد تست حذف شد');
    } else {
      console.log('\n⚠️ هیچ کاربری بدون پرداخت یافت نشد برای تست حذف');
    }

    console.log('\n🎉 تست مدیریت کاربران با موفقیت انجام شد!');

  } catch (error) {
    console.error('❌ خطا در تست:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUserManagement();
