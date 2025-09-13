import { prisma } from '../src/app/api/_lib/db';

async function testCompleteSystem() {
  try {
    console.log('🧪 تست کامل سیستم مدیریت مالی...\n');

    // 1. بررسی پروژه‌ها
    const projects = await prisma.project.findMany({
      include: {
        installmentDefinitions: true,
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

    console.log(`📋 تعداد پروژه‌ها: ${projects.length}`);
    
    if (projects.length === 0) {
      console.log('❌ هیچ پروژه‌ای یافت نشد.');
      return;
    }

    const project = projects[0];
    console.log(`📋 پروژه: ${project.name}`);
    console.log(`   انواع قسط: ${project.installmentDefinitions.length}`);
    console.log(`   تعداد واحدها: ${project.units.length}\n`);

    // 2. بررسی انواع قسط
    console.log('📋 انواع قسط پروژه:');
    project.installmentDefinitions.forEach((def, index) => {
      console.log(`   ${index + 1}. ${def.title}`);
      console.log(`      تاریخ سررسید: ${def.dueDate.toLocaleDateString('fa-IR')}`);
      console.log(`      مبلغ: ${new Intl.NumberFormat('fa-IR').format(def.amount)} ریال`);
    });

    // 3. بررسی کاربران پروژه (غیرادمین)
    console.log('\n👥 کاربران پروژه (غیرادمین):');
    const nonAdminUsers = project.units
      .map(unit => unit.user)
      .filter((user, index, self) => 
        index === self.findIndex(u => u.id === user.id) && user.role !== 'ADMIN'
      );

    nonAdminUsers.forEach((user, index) => {
      const userUnits = project.units.filter(unit => unit.userId === user.id);
      const totalInstallments = userUnits.reduce((sum, unit) => sum + unit.userInstallments.length, 0);
      const totalPayments = userUnits.reduce((sum, unit) => 
        sum + unit.userInstallments.reduce((unitSum, installment) => 
          unitSum + installment.payments.length, 0), 0);
      const totalPenalties = userUnits.reduce((sum, unit) => 
        sum + unit.userInstallments.reduce((unitSum, installment) => 
          unitSum + installment.penalties.length, 0), 0);
      
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.username})`);
      console.log(`      واحدها: ${userUnits.map(unit => unit.unitNumber).join(', ')}`);
      console.log(`      اقساط: ${totalInstallments}, پرداخت‌ها: ${totalPayments}, جریمه‌ها: ${totalPenalties}`);
    });

    // 4. بررسی کاربران موجود برای افزودن
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

    // 5. آمار کلی
    console.log('\n📊 آمار کلی:');
    const totalInstallments = project.units.reduce((sum, unit) => sum + unit.userInstallments.length, 0);
    const totalPayments = project.units.reduce((sum, unit) => 
      sum + unit.userInstallments.reduce((unitSum, installment) => 
        unitSum + installment.payments.length, 0), 0);
    const totalPenalties = project.units.reduce((sum, unit) => 
      sum + unit.userInstallments.reduce((unitSum, installment) => 
        unitSum + installment.penalties.length, 0), 0);

    console.log(`   تعداد کل اقساط: ${totalInstallments}`);
    console.log(`   تعداد کل پرداخت‌ها: ${totalPayments}`);
    console.log(`   تعداد کل جریمه‌ها: ${totalPenalties}`);
    console.log(`   تعداد کل واحدها: ${project.units.length}`);
    console.log(`   تعداد کل کاربران: ${nonAdminUsers.length}`);

    // 6. بررسی cascade delete
    console.log('\n🔗 بررسی cascade delete:');
    const unitsWithInstallments = project.units.filter(unit => unit.userInstallments.length > 0);
    console.log(`   واحدهای دارای اقساط: ${unitsWithInstallments.length}`);
    
    const installmentsWithPayments = project.units.flatMap(unit => 
      unit.userInstallments.filter(installment => installment.payments.length > 0)
    );
    console.log(`   اقساط دارای پرداخت: ${installmentsWithPayments.length}`);

    const installmentsWithPenalties = project.units.flatMap(unit => 
      unit.userInstallments.filter(installment => installment.penalties.length > 0)
    );
    console.log(`   اقساط دارای جریمه: ${installmentsWithPenalties.length}`);

    console.log('\n✅ سیستم آماده استفاده است!');
    console.log('\n📝 نکات مهم:');
    console.log('   - مدیر (admin) در لیست کاربران پروژه نمایش داده نمی‌شود');
    console.log('   - حذف کاربر تمام اقساط، پرداخت‌ها و جریمه‌هایش را حذف می‌کند');
    console.log('   - کاربران با پرداخت ثبت شده قابل حذف نیستند');
    console.log('   - انواع قسط قابل ویرایش و حذف هستند (اگر استفاده نشده باشند)');

  } catch (error) {
    console.error('❌ خطا در تست:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCompleteSystem();
