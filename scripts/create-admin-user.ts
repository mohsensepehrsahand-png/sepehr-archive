import { prisma } from '../src/app/api/_lib/db';
import bcrypt from 'bcryptjs';

async function createAdminUser() {
  try {
    console.log('🔍 بررسی وجود کاربر admin...');
    
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { username: 'admin' },
          { role: 'ADMIN' }
        ]
      }
    });

    if (existingAdmin) {
      console.log('✅ کاربر admin قبلاً وجود دارد:');
      console.log(`   نام کاربری: ${existingAdmin.username}`);
      console.log(`   نقش: ${existingAdmin.role}`);
      console.log(`   ایمیل: ${existingAdmin.email || 'تعریف نشده'}`);
      console.log(`   وضعیت: ${existingAdmin.isActive ? 'فعال' : 'غیرفعال'}`);
      return;
    }

    console.log('👤 ایجاد کاربر admin جدید...');
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        firstName: 'مدیر',
        lastName: 'سیستم',
        email: 'admin@sepehr-archive.com',
        role: 'ADMIN',
        isActive: true
      }
    });

    console.log('✅ کاربر admin با موفقیت ایجاد شد:');
    console.log(`   نام کاربری: ${adminUser.username}`);
    console.log(`   رمز عبور: admin123`);
    console.log(`   نقش: ${adminUser.role}`);
    console.log(`   ایمیل: ${adminUser.email}`);
    console.log(`   وضعیت: ${adminUser.isActive ? 'فعال' : 'غیرفعال'}`);
    console.log('');
    console.log('🔑 اطلاعات ورود:');
    console.log('   نام کاربری: admin');
    console.log('   رمز عبور: admin123');
    
  } catch (error) {
    console.error('❌ خطا در ایجاد کاربر admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
