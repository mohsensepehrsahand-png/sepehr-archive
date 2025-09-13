import { prisma } from '../src/app/api/_lib/db';
import bcrypt from 'bcryptjs';

async function resetAdminPassword() {
  try {
    console.log('🔍 یافتن کاربر admin...');
    
    // Find admin user
    const adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: 'admin' },
          { role: 'ADMIN' }
        ]
      }
    });

    if (!adminUser) {
      console.log('❌ کاربر admin یافت نشد!');
      return;
    }

    console.log('👤 کاربر admin یافت شد:');
    console.log(`   نام کاربری: ${adminUser.username}`);
    console.log(`   نقش: ${adminUser.role}`);
    console.log(`   ایمیل: ${adminUser.email || 'تعریف نشده'}`);
    console.log(`   وضعیت: ${adminUser.isActive ? 'فعال' : 'غیرفعال'}`);
    
    console.log('');
    console.log('🔑 تنظیم رمز عبور جدید...');
    
    // Hash new password
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { passwordHash: hashedPassword }
    });

    console.log('✅ رمز عبور با موفقیت به‌روزرسانی شد!');
    console.log('');
    console.log('🔑 اطلاعات ورود:');
    console.log('   نام کاربری: admin');
    console.log('   رمز عبور: admin123');
    console.log('');
    console.log('🌐 برای ورود به سیستم:');
    console.log('   http://localhost:3001/login');
    
  } catch (error) {
    console.error('❌ خطا در به‌روزرسانی رمز عبور:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
