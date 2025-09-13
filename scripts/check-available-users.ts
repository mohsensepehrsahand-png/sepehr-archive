import { prisma } from '../src/app/api/_lib/db';

async function checkAvailableUsers() {
  try {
    console.log('🔍 بررسی کاربران موجود در سیستم...\n');

    // 1. دریافت تمام کاربران
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true
      },
      orderBy: [
        { role: 'asc' },
        { firstName: 'asc' }
      ]
    });

    console.log(`📋 تعداد کل کاربران: ${allUsers.length}\n`);

    // 2. نمایش تمام کاربران
    console.log('👥 تمام کاربران:');
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.username})`);
      console.log(`      نقش: ${user.role}`);
      console.log(`      وضعیت: ${user.isActive ? 'فعال' : 'غیرفعال'}`);
      console.log(`      ایمیل: ${user.email}`);
    });

    // 3. دریافت پروژه‌های موجود
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
      console.log('\n❌ هیچ پروژه‌ای یافت نشد.');
      return;
    }

    const project = projects[0];
    console.log(`\n📋 پروژه: ${project.name}`);
    console.log(`   تعداد واحدها: ${project.units.length}`);

    // 4. نمایش کاربران پروژه
    console.log('\n👥 کاربران پروژه:');
    const projectUsers = project.units.map(unit => unit.user);
    const uniqueProjectUsers = projectUsers.filter((user, index, self) => 
      index === self.findIndex(u => u.id === user.id)
    );

    uniqueProjectUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.username}) - ${user.role}`);
    });

    // 5. محاسبه کاربران موجود برای افزودن
    console.log('\n👤 کاربران موجود برای افزودن:');
    const availableUsers = allUsers.filter(user => {
      // فعال باشد
      if (!user.isActive) return false;
      
      // ادمین نباشد
      if (user.role === 'ADMIN') return false;
      
      // در پروژه نباشد
      const isInProject = uniqueProjectUsers.some(projectUser => projectUser.id === user.id);
      if (isInProject) return false;
      
      return true;
    });

    if (availableUsers.length === 0) {
      console.log('   همه کاربران غیرادمین در این پروژه عضو هستند');
    } else {
      availableUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.username}) - ${user.role}`);
      });
    }

    // 6. آمار کلی
    console.log('\n📊 آمار کلی:');
    console.log(`   تعداد کل کاربران: ${allUsers.length}`);
    console.log(`   کاربران فعال: ${allUsers.filter(u => u.isActive).length}`);
    console.log(`   کاربران غیرفعال: ${allUsers.filter(u => !u.isActive).length}`);
    console.log(`   ادمین‌ها: ${allUsers.filter(u => u.role === 'ADMIN').length}`);
    console.log(`   خریداران: ${allUsers.filter(u => u.role === 'BUYER').length}`);
    console.log(`   کاربران پروژه: ${uniqueProjectUsers.length}`);
    console.log(`   کاربران موجود برای افزودن: ${availableUsers.length}`);

  } catch (error) {
    console.error('❌ خطا در بررسی:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAvailableUsers();
