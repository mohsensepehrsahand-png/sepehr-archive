import { PrismaClient } from '@/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAdminUsers() {
  console.log('🔍 بررسی کاربران Admin...\n');

  const adminUsers = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      isActive: true
    }
  });

  if (adminUsers.length === 0) {
    console.log('❌ هیچ کاربر Admin یافت نشد!');
    console.log('\n📝 ایجاد کاربر Admin برای تست...');
    
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true
      }
    });

    console.log('✅ کاربر Admin ایجاد شد:');
    console.log(`   Username: admin`);
    console.log(`   Password: admin123`);
    console.log(`   ID: ${adminUser.id}\n`);
  } else {
    console.log(`✅ ${adminUsers.length} کاربر Admin یافت شد:\n`);
    adminUsers.forEach((user, index) => {
      console.log(`${index + 1}. Username: ${user.username}`);
      console.log(`   نام: ${user.firstName} ${user.lastName}`);
      console.log(`   وضعیت: ${user.isActive ? 'فعال' : 'غیرفعال'}`);
      console.log('');
    });

    // اگر کاربر admin وجود نداره، ایجاد کن
    const adminExists = adminUsers.some(u => u.username === 'admin');
    if (!adminExists) {
      console.log('📝 ایجاد کاربر admin برای تست...');
      
      const passwordHash = await bcrypt.hash('admin123', 10);
      
      await prisma.user.create({
        data: {
          username: 'admin',
          passwordHash,
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
          isActive: true
        }
      });

      console.log('✅ کاربر admin ایجاد شد (username: admin, password: admin123)\n');
    } else {
      console.log('✅ کاربر admin موجود است\n');
      
      // به‌روزرسانی رمز عبور admin برای اطمینان
      const adminUser = adminUsers.find(u => u.username === 'admin');
      if (adminUser) {
        const passwordHash = await bcrypt.hash('admin123', 10);
        await prisma.user.update({
          where: { id: adminUser.id },
          data: { 
            passwordHash,
            isActive: true 
          }
        });
        console.log('🔄 رمز عبور admin به admin123 به‌روز شد\n');
      }
    }
  }

  await prisma.$disconnect();
}

checkAdminUsers().catch(error => {
  console.error('❌ خطا:', error);
  process.exit(1);
});

