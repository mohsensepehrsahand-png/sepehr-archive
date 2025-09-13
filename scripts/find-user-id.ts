import { prisma } from '../src/app/api/_lib/db';

async function findUserId() {
  try {
    console.log('🔍 پیدا کردن ID کاربر علی رضایی...\n');

    const user = await prisma.user.findFirst({
      where: {
        username: 'ali'
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true
      }
    });

    if (user) {
      console.log(`✅ کاربر یافت شد:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   نام: ${user.firstName} ${user.lastName}`);
      console.log(`   نام کاربری: ${user.username}`);
    } else {
      console.log('❌ کاربر یافت نشد');
    }

  } catch (error) {
    console.error('❌ خطا در جستجو:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findUserId();
