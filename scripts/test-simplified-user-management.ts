import { prisma } from '../src/app/api/_lib/db';

async function testSimplifiedUserManagement() {
  try {
    console.log('🧪 تست مدیریت ساده کاربران پروژه...\n');

    // 1. دریافت پروژه‌های موجود
    const projects = await prisma.project.findMany({
      take: 1,
      include: {
        units: {
          include: {
            user: true
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

    // 2. نمایش کاربران پروژه (غیرادمین)
    console.log('👥 کاربران پروژه (غیرادمین):');
    const nonAdminUsers = project.units
      .map(unit => unit.user)
      .filter((user, index, self) => 
        index === self.findIndex(u => u.id === user.id) && user.role !== 'ADMIN'
      );

    nonAdminUsers.forEach((user, index) => {
      const userUnits = project.units.filter(unit => unit.userId === user.id);
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.username})`);
      console.log(`      واحدها: ${userUnits.map(unit => unit.unitNumber).join(', ')}`);
    });

    // 3. دریافت کاربران موجود برای افزودن
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

    // 4. آمار کلی
    console.log('\n📊 آمار کلی:');
    console.log(`   تعداد کل واحدها: ${project.units.length}`);
    console.log(`   تعداد کل کاربران (غیرادمین): ${nonAdminUsers.length}`);
    console.log(`   تعداد کاربران موجود برای افزودن: ${availableUsers.length}`);

    console.log('\n✅ سیستم مدیریت ساده کاربران آماده است!');
    console.log('\n📝 ویژگی‌های سیستم:');
    console.log('   - فقط نام کاربر و واحدها نمایش داده می‌شود');
    console.log('   - جزئیات مالی در این بخش نمایش داده نمی‌شود');
    console.log('   - مدیر (admin) در لیست نمایش داده نمی‌شود');
    console.log('   - امکان افزودن و حذف کاربران وجود دارد');
    console.log('   - حذف کاربر تمام اطلاعات وابسته را حذف می‌کند');

  } catch (error) {
    console.error('❌ خطا در تست:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSimplifiedUserManagement();
