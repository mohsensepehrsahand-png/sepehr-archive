/**
 * تست Settings API و تنظیمات امنیتی
 * بررسی ذخیره و بازیابی تنظیمات امنیتی
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

async function testGetSettings(): Promise<TestResult> {
  try {
    const response = await fetch(`${BASE_URL}/api/settings`, {
      headers: {
        'Cookie': 'authToken=user-token; userRole=ADMIN'
      }
    });

    const data = await response.json();

    if (response.ok && data) {
      return {
        name: 'دریافت تنظیمات',
        passed: true,
        message: 'تنظیمات با موفقیت دریافت شد',
        details: {
          sessionTimeout: data.sessionTimeout,
          maxLoginAttempts: data.maxLoginAttempts,
          auditLogging: data.auditLogging
        }
      };
    }

    return {
      name: 'خطا در دریافت تنظیمات',
      passed: false,
      message: 'نتوانست تنظیمات را دریافت کند',
      details: { status: response.status }
    };
  } catch (error) {
    return {
      name: 'خطا در تست دریافت تنظیمات',
      passed: false,
      message: error.message,
      details: error
    };
  }
}

async function testUpdateSecuritySettings(): Promise<TestResult> {
  try {
    // ذخیره تنظیمات فعلی
    const currentSettings = await prisma.appSettings.findFirst();

    if (!currentSettings) {
      return {
        name: 'خطا در یافتن تنظیمات',
        passed: false,
        message: 'تنظیمات پیدا نشد',
        details: {}
      };
    }

    const testSettings = {
      sessionTimeout: 45,
      requirePasswordChange: 120,
      maxLoginAttempts: 7,
      auditLogging: true
    };

    // به‌روزرسانی تنظیمات
    const updateResponse = await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'authToken=user-token; userRole=ADMIN'
      },
      body: JSON.stringify(testSettings)
    });

    const updatedData = await updateResponse.json();

    // بررسی تنظیمات به‌روز شده
    const verifyResponse = await fetch(`${BASE_URL}/api/settings`, {
      headers: {
        'Cookie': 'authToken=user-token; userRole=ADMIN'
      }
    });

    const verifiedData = await verifyResponse.json();

    // بازگرداندن تنظیمات قبلی
    await prisma.appSettings.update({
      where: { id: 1 },
      data: {
        sessionTimeout: currentSettings.sessionTimeout,
        requirePasswordChange: currentSettings.requirePasswordChange,
        maxLoginAttempts: currentSettings.maxLoginAttempts,
        auditLogging: currentSettings.auditLogging
      }
    });

    const settingsUpdated = 
      verifiedData.sessionTimeout === testSettings.sessionTimeout &&
      verifiedData.maxLoginAttempts === testSettings.maxLoginAttempts &&
      verifiedData.requirePasswordChange === testSettings.requirePasswordChange;

    if (updateResponse.ok && settingsUpdated) {
      return {
        name: 'به‌روزرسانی تنظیمات امنیتی',
        passed: true,
        message: 'تنظیمات امنیتی با موفقیت به‌روز شد',
        details: {
          updated: testSettings,
          verified: verifiedData
        }
      };
    }

    return {
      name: 'خطا در به‌روزرسانی تنظیمات',
      passed: false,
      message: 'تنظیمات به درستی به‌روز نشد',
      details: {
        expected: testSettings,
        actual: verifiedData
      }
    };
  } catch (error) {
    return {
      name: 'خطا در تست به‌روزرسانی تنظیمات',
      passed: false,
      message: error.message,
      details: error
    };
  }
}

async function testNonAdminCannotUpdateSettings(): Promise<TestResult> {
  try {
    const testSettings = {
      maxLoginAttempts: 999
    };

    const response = await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'authToken=user-token; userRole=BUYER'
      },
      body: JSON.stringify(testSettings)
    });

    // کاربر غیر Admin نباید بتونه تنظیمات رو ویرایش کنه
    // متأسفانه API فعلی این چک رو نداره، ولی صفحه settings این چک رو داره

    if (response.status === 403 || response.status === 401) {
      return {
        name: 'منع ویرایش تنظیمات توسط غیر Admin',
        passed: true,
        message: 'کاربر غیر Admin نمی‌تواند تنظیمات را ویرایش کند',
        details: { status: response.status }
      };
    }

    // اگر API اجازه داد، بررسی می‌کنیم که واقعاً تغییر نکرده باشه
    const verifyResponse = await fetch(`${BASE_URL}/api/settings`);
    const currentSettings = await verifyResponse.json();

    if (currentSettings.maxLoginAttempts !== 999) {
      return {
        name: 'محافظت از تنظیمات در برابر تغییرات غیرمجاز',
        passed: true,
        message: 'تنظیمات در برابر تغییرات غیرمجاز محافظت شده است',
        details: { 
          attemptedChange: true,
          actualValue: currentSettings.maxLoginAttempts 
        }
      };
    }

    return {
      name: 'هشدار: API تنظیمات محافظت نشده',
      passed: false,
      message: 'API تنظیمات در برابر دسترسی غیرمجاز محافظت نشده است',
      details: { 
        status: response.status,
        warning: 'باید بررسی نقش کاربر در API اضافه شود'
      }
    };
  } catch (error) {
    return {
      name: 'خطا در تست محافظت تنظیمات',
      passed: false,
      message: error.message,
      details: error
    };
  }
}

async function testIPBlacklistManagement(): Promise<TestResult> {
  try {
    // ذخیره لیست سیاه فعلی
    const currentSettings = await prisma.appSettings.findFirst();
    const originalBlacklist = currentSettings?.ipBlacklist || '';

    const testIPs = [
      '192.168.1.100',
      '10.0.0.50',
      '172.16.0.25'
    ];

    // اضافه کردن IP ها به لیست سیاه
    const response = await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'authToken=user-token; userRole=ADMIN'
      },
      body: JSON.stringify({
        ipBlacklist: testIPs.join('\n')
      })
    });

    // بررسی لیست سیاه
    const verifyResponse = await fetch(`${BASE_URL}/api/settings`, {
      headers: {
        'Cookie': 'authToken=user-token; userRole=ADMIN'
      }
    });

    const verifiedData = await verifyResponse.json();

    // بازگرداندن لیست سیاه قبلی
    await prisma.appSettings.update({
      where: { id: 1 },
      data: { ipBlacklist: originalBlacklist }
    });

    const savedIPs = verifiedData.ipBlacklist?.split('\n').filter((ip: string) => ip.trim()) || [];
    const allIPsSaved = testIPs.every(ip => savedIPs.includes(ip));

    if (response.ok && allIPsSaved) {
      return {
        name: 'مدیریت لیست سیاه IP',
        passed: true,
        message: 'لیست سیاه IP به درستی مدیریت می‌شود',
        details: {
          testIPs,
          savedIPs,
          allIPsSaved
        }
      };
    }

    return {
      name: 'خطا در مدیریت لیست سیاه IP',
      passed: false,
      message: 'لیست سیاه IP به درستی ذخیره نشد',
      details: {
        testIPs,
        savedIPs,
        allIPsSaved
      }
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

async function testAuditLoggingSetting(): Promise<TestResult> {
  try {
    // ذخیره تنظیمات فعلی
    const currentSettings = await prisma.appSettings.findFirst();
    const originalAuditLogging = currentSettings?.auditLogging ?? true;

    // غیرفعال کردن audit logging
    const disableResponse = await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'authToken=user-token; userRole=ADMIN'
      },
      body: JSON.stringify({
        auditLogging: false
      })
    });

    // بررسی
    const verifyDisabled = await fetch(`${BASE_URL}/api/settings`, {
      headers: {
        'Cookie': 'authToken=user-token; userRole=ADMIN'
      }
    });
    const disabledData = await verifyDisabled.json();

    // فعال کردن audit logging
    const enableResponse = await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'authToken=user-token; userRole=ADMIN'
      },
      body: JSON.stringify({
        auditLogging: true
      })
    });

    // بررسی
    const verifyEnabled = await fetch(`${BASE_URL}/api/settings`, {
      headers: {
        'Cookie': 'authToken=user-token; userRole=ADMIN'
      }
    });
    const enabledData = await verifyEnabled.json();

    // بازگرداندن تنظیمات قبلی
    await prisma.appSettings.update({
      where: { id: 1 },
      data: { auditLogging: originalAuditLogging }
    });

    const canDisable = disabledData.auditLogging === false;
    const canEnable = enabledData.auditLogging === true;

    if (disableResponse.ok && enableResponse.ok && canDisable && canEnable) {
      return {
        name: 'تنظیم Audit Logging',
        passed: true,
        message: 'تنظیم audit logging به درستی کار می‌کند',
        details: {
          canDisable,
          canEnable
        }
      };
    }

    return {
      name: 'خطا در تنظیم Audit Logging',
      passed: false,
      message: 'تنظیم audit logging به درستی کار نمی‌کند',
      details: {
        canDisable,
        canEnable
      }
    };
  } catch (error) {
    return {
      name: 'خطا در تست Audit Logging',
      passed: false,
      message: error.message,
      details: error
    };
  }
}

async function testSessionTimeoutSetting(): Promise<TestResult> {
  try {
    const testTimeouts = [15, 30, 60, 120];
    const results: any[] = [];

    for (const timeout of testTimeouts) {
      const response = await fetch(`${BASE_URL}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'authToken=user-token; userRole=ADMIN'
        },
        body: JSON.stringify({
          sessionTimeout: timeout
        })
      });

      const verifyResponse = await fetch(`${BASE_URL}/api/settings`, {
        headers: {
          'Cookie': 'authToken=user-token; userRole=ADMIN'
        }
      });
      const data = await verifyResponse.json();

      results.push({
        timeout,
        saved: data.sessionTimeout === timeout
      });

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const allSaved = results.every(r => r.saved);

    if (allSaved) {
      return {
        name: 'تنظیم Session Timeout',
        passed: true,
        message: 'تنظیم session timeout به درستی کار می‌کند',
        details: { testResults: results }
      };
    }

    return {
      name: 'خطا در تنظیم Session Timeout',
      passed: false,
      message: 'تنظیم session timeout به درستی کار نمی‌کند',
      details: { testResults: results }
    };
  } catch (error) {
    return {
      name: 'خطا در تست Session Timeout',
      passed: false,
      message: error.message,
      details: error
    };
  }
}

export async function runSettingsTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  console.log('\n⚙️ شروع تست‌های Settings API...\n');

  // تست 1: دریافت تنظیمات
  console.log('📝 تست 1: بررسی دریافت تنظیمات...');
  results.push(await testGetSettings());

  // تست 2: به‌روزرسانی تنظیمات امنیتی
  console.log('📝 تست 2: بررسی به‌روزرسانی تنظیمات امنیتی...');
  results.push(await testUpdateSecuritySettings());

  // تست 3: منع دسترسی غیر Admin
  console.log('📝 تست 3: بررسی منع ویرایش توسط غیر Admin...');
  results.push(await testNonAdminCannotUpdateSettings());

  // تست 4: مدیریت لیست سیاه IP
  console.log('📝 تست 4: بررسی مدیریت لیست سیاه IP...');
  results.push(await testIPBlacklistManagement());

  // تست 5: تنظیم Audit Logging
  console.log('📝 تست 5: بررسی تنظیم Audit Logging...');
  results.push(await testAuditLoggingSetting());

  // تست 6: تنظیم Session Timeout
  console.log('📝 تست 6: بررسی تنظیم Session Timeout...');
  results.push(await testSessionTimeoutSetting());

  return results;
}

