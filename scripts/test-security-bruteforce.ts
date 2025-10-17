/**
 * تست محدودیت تلاش ورود و بلاک IP (Brute Force Protection)
 * بررسی سیستم محافظت در برابر حملات Brute Force
 */

import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

const BASE_URL = 'http://localhost:3000';

async function getSecuritySettings() {
  try {
    const settings = await prisma.appSettings.findFirst();
    return settings;
  } catch (error) {
    console.error('خطا در دریافت تنظیمات:', error);
    return null;
  }
}

async function clearLoginAttempts(username?: string, ipAddress?: string) {
  try {
    const where: any = {};
    if (username) where.username = username;
    if (ipAddress) where.ipAddress = ipAddress;

    await prisma.loginAttempt.deleteMany({ where });
    console.log('✓ تلاش‌های ورود قبلی پاک شد');
  } catch (error) {
    console.error('خطا در پاک کردن تلاش‌های ورود:', error);
  }
}

async function getLoginAttempts(username?: string, ipAddress?: string) {
  try {
    const where: any = { success: false };
    if (username) where.username = username;
    if (ipAddress) where.ipAddress = ipAddress;

    const attempts = await prisma.loginAttempt.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return attempts;
  } catch (error) {
    console.error('خطا در دریافت تلاش‌های ورود:', error);
    return [];
  }
}

async function testMultipleFailedAttempts(): Promise<TestResult> {
  const testUsername = 'test_brute_force_user';
  const testPassword = 'wrong_password_xyz';

  try {
    // پاک کردن تلاش‌های قبلی
    await clearLoginAttempts(testUsername);

    const settings = await getSecuritySettings();
    const maxAttempts = settings?.maxLoginAttempts || 5;

    console.log(`   حداکثر تلاش مجاز: ${maxAttempts}`);

    // تلاش برای ورود چند بار
    const attempts = [];
    for (let i = 1; i <= maxAttempts + 2; i++) {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: testUsername, 
          password: testPassword 
        })
      });

      const data = await response.json();
      attempts.push({
        attemptNumber: i,
        status: response.status,
        error: data.error
      });

      console.log(`   تلاش ${i}: ${response.status} - ${data.error}`);

      // کمی صبر کنیم بین هر تلاش
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // بررسی تلاش‌های ثبت شده در دیتابیس
    const recordedAttempts = await getLoginAttempts(testUsername);
    
    console.log(`   تلاش‌های ثبت شده: ${recordedAttempts.length}`);

    // بررسی اینکه آیا تلاش‌ها درست ثبت شدند
    if (recordedAttempts.length >= maxAttempts) {
      return {
        name: 'ثبت تلاش‌های ناموفق',
        passed: true,
        message: `تلاش‌های ناموفق به درستی ثبت شدند (${recordedAttempts.length} تلاش)`,
        details: {
          maxAttempts,
          recordedAttempts: recordedAttempts.length,
          attempts
        }
      };
    }

    return {
      name: 'خطا در ثبت تلاش‌های ناموفق',
      passed: false,
      message: `تلاش‌های ناموفق به درستی ثبت نشدند`,
      details: {
        maxAttempts,
        recordedAttempts: recordedAttempts.length,
        attempts
      }
    };
  } catch (error) {
    return {
      name: 'خطا در تست تلاش‌های متعدد',
      passed: false,
      message: error.message,
      details: error
    };
  }
}

async function testUserDeactivation(): Promise<TestResult> {
  const testUsername = 'test_deactivate_user';
  const testPassword = 'wrong_password';

  try {
    // ایجاد کاربر تست
    const testUser = await prisma.user.upsert({
      where: { username: testUsername },
      update: { isActive: true },
      create: {
        username: testUsername,
        passwordHash: 'dummy_hash',
        firstName: 'Test',
        lastName: 'User',
        role: 'BUYER',
        isActive: true
      }
    });

    console.log(`   کاربر تست ایجاد شد: ${testUser.id}`);

    // پاک کردن تلاش‌های قبلی
    await clearLoginAttempts(testUsername);

    const settings = await getSecuritySettings();
    const maxAttempts = settings?.maxLoginAttempts || 5;

    // تلاش‌های ناموفق زیاد
    for (let i = 0; i < maxAttempts + 1; i++) {
      await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: testUsername, 
          password: testPassword 
        })
      });
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // بررسی وضعیت کاربر
    const updatedUser = await prisma.user.findUnique({
      where: { id: testUser.id }
    });

    // پاک کردن کاربر تست
    await prisma.user.delete({ where: { id: testUser.id } });

    if (updatedUser && !updatedUser.isActive) {
      return {
        name: 'غیرفعال شدن کاربر بعد از تلاش‌های زیاد',
        passed: true,
        message: 'کاربر بعد از تلاش‌های ناموفق زیاد غیرفعال شد',
        details: { 
          userId: testUser.id, 
          wasActive: testUser.isActive,
          isActiveNow: updatedUser.isActive 
        }
      };
    }

    return {
      name: 'خطا در غیرفعال شدن کاربر',
      passed: false,
      message: 'کاربر بعد از تلاش‌های زیاد غیرفعال نشد',
      details: { 
        userId: testUser.id,
        isActive: updatedUser?.isActive 
      }
    };
  } catch (error) {
    return {
      name: 'خطا در تست غیرفعال شدن کاربر',
      passed: false,
      message: error.message,
      details: error
    };
  }
}

async function testIPBlacklist(): Promise<TestResult> {
  try {
    const testIP = '192.168.100.200';
    
    // اضافه کردن IP به لیست سیاه
    const settings = await prisma.appSettings.findFirst();
    const currentBlacklist = settings?.ipBlacklist || '';
    
    await prisma.appSettings.update({
      where: { id: 1 },
      data: {
        ipBlacklist: currentBlacklist ? `${currentBlacklist}\n${testIP}` : testIP
      }
    });

    console.log(`   IP ${testIP} به لیست سیاه اضافه شد`);

    // تلاش برای ورود از IP بلاک شده
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Forwarded-For': testIP
      },
      body: JSON.stringify({ 
        username: 'any_user', 
        password: 'any_password' 
      })
    });

    const data = await response.json();

    // پاک کردن IP از لیست سیاه
    await prisma.appSettings.update({
      where: { id: 1 },
      data: { ipBlacklist: currentBlacklist }
    });

    console.log(`   IP از لیست سیاه حذف شد`);

    if (response.status === 403 && data.error?.includes('مسدود')) {
      return {
        name: 'بلاک کردن IP در لیست سیاه',
        passed: true,
        message: 'IP های لیست سیاه به درستی بلاک می‌شوند',
        details: { testIP, status: response.status, error: data.error }
      };
    }

    return {
      name: 'خطا در بلاک IP',
      passed: false,
      message: 'IP لیست سیاه به درستی بلاک نشد',
      details: { testIP, status: response.status, error: data.error }
    };
  } catch (error) {
    return {
      name: 'خطا در تست لیست سیاه IP',
      passed: false,
      message: error.message,
      details: error
    };
  }
}

async function testSuccessfulLoginResetsAttempts(): Promise<TestResult> {
  const testUsername = 'test_reset_attempts';
  
  try {
    // ایجاد کاربر تست
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('correct_password', 10);
    
    const testUser = await prisma.user.upsert({
      where: { username: testUsername },
      update: { 
        passwordHash: hashedPassword,
        isActive: true 
      },
      create: {
        username: testUsername,
        passwordHash: hashedPassword,
        firstName: 'Test',
        lastName: 'Reset',
        role: 'BUYER',
        isActive: true
      }
    });

    // پاک کردن تلاش‌های قبلی
    await clearLoginAttempts(testUsername);

    // چند تلاش ناموفق
    for (let i = 0; i < 3; i++) {
      await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: testUsername, 
          password: 'wrong_password' 
        })
      });
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const attemptsBeforeSuccess = await getLoginAttempts(testUsername);
    console.log(`   تلاش‌های ناموفق قبل از ورود موفق: ${attemptsBeforeSuccess.length}`);

    // ورود موفق
    await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: testUsername, 
        password: 'correct_password' 
      })
    });

    await new Promise(resolve => setTimeout(resolve, 200));

    const attemptsAfterSuccess = await getLoginAttempts(testUsername);
    console.log(`   تلاش‌های ناموفق بعد از ورود موفق: ${attemptsAfterSuccess.length}`);

    // پاک کردن کاربر تست
    await prisma.user.delete({ where: { id: testUser.id } });

    if (attemptsBeforeSuccess.length > 0 && attemptsAfterSuccess.length === 0) {
      return {
        name: 'ریست تلاش‌های ناموفق بعد از ورود موفق',
        passed: true,
        message: 'تلاش‌های ناموفق بعد از ورود موفق پاک شدند',
        details: {
          before: attemptsBeforeSuccess.length,
          after: attemptsAfterSuccess.length
        }
      };
    }

    return {
      name: 'خطا در ریست تلاش‌ها',
      passed: false,
      message: 'تلاش‌های ناموفق بعد از ورود موفق پاک نشدند',
      details: {
        before: attemptsBeforeSuccess.length,
        after: attemptsAfterSuccess.length
      }
    };
  } catch (error) {
    return {
      name: 'خطا در تست ریست تلاش‌ها',
      passed: false,
      message: error.message,
      details: error
    };
  }
}

export async function runBruteForceTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  console.log('\n🔒 شروع تست‌های محافظت در برابر Brute Force...\n');

  // تست 1: ثبت تلاش‌های ناموفق
  console.log('📝 تست 1: بررسی ثبت تلاش‌های ناموفق...');
  results.push(await testMultipleFailedAttempts());

  // تست 2: بلاک کردن IP
  console.log('📝 تست 2: بررسی بلاک کردن IP...');
  results.push(await testIPBlacklist());

  // تست 3: غیرفعال شدن کاربر
  console.log('📝 تست 3: بررسی غیرفعال شدن کاربر بعد از تلاش‌های زیاد...');
  results.push(await testUserDeactivation());

  // تست 4: ریست تلاش‌ها بعد از ورود موفق
  console.log('📝 تست 4: بررسی ریست تلاش‌ها بعد از ورود موفق...');
  results.push(await testSuccessfulLoginResetsAttempts());

  return results;
}

export { clearLoginAttempts, getLoginAttempts };

