/**
 * تست کنترل دسترسی (Authorization)
 * بررسی دسترسی Admin و User به مسیرهای مختلف
 */

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

const BASE_URL = 'http://localhost:3000';

async function testAdminRouteAccess(authToken: string, userRole: string, route: string): Promise<TestResult> {
  try {
    const response = await fetch(`${BASE_URL}/api${route}`, {
      headers: {
        'Cookie': `authToken=${authToken}; userRole=${userRole}`
      }
    });

    const isAdmin = userRole === 'ADMIN';
    const shouldHaveAccess = isAdmin;

    if (shouldHaveAccess && response.ok) {
      return {
        name: `دسترسی ${userRole} به ${route}`,
        passed: true,
        message: `${userRole} به درستی به ${route} دسترسی دارد`,
        details: { status: response.status }
      };
    }

    if (!shouldHaveAccess && response.status === 403) {
      return {
        name: `عدم دسترسی ${userRole} به ${route}`,
        passed: true,
        message: `${userRole} به درستی از دسترسی به ${route} محروم شد`,
        details: { status: response.status }
      };
    }

    return {
      name: `خطا در کنترل دسترسی ${route}`,
      passed: false,
      message: `نتیجه غیرمنتظره برای ${userRole} در ${route}`,
      details: { 
        status: response.status,
        shouldHaveAccess,
        actuallyHasAccess: response.ok
      }
    };
  } catch (error) {
    return {
      name: `خطا در تست دسترسی ${route}`,
      passed: false,
      message: error.message,
      details: error
    };
  }
}

async function testProjectPermissions(authToken: string, userId: string, projectId: string, expectedAccess: boolean): Promise<TestResult> {
  try {
    const response = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
      headers: {
        'Cookie': `authToken=${authToken}; userData=${JSON.stringify({ id: userId })}`
      }
    });

    if (expectedAccess && response.ok) {
      return {
        name: 'دسترسی به پروژه مجاز',
        passed: true,
        message: 'کاربر به درستی به پروژه دسترسی دارد',
        details: { projectId, status: response.status }
      };
    }

    if (!expectedAccess && response.status === 403) {
      return {
        name: 'عدم دسترسی به پروژه غیرمجاز',
        passed: true,
        message: 'کاربر به درستی از دسترسی به پروژه محروم شد',
        details: { projectId, status: response.status }
      };
    }

    return {
      name: 'خطا در کنترل دسترسی پروژه',
      passed: false,
      message: `نتیجه غیرمنتظره برای دسترسی به پروژه ${projectId}`,
      details: { 
        expectedAccess,
        actualStatus: response.status
      }
    };
  } catch (error) {
    return {
      name: 'خطا در تست دسترسی پروژه',
      passed: false,
      message: error.message,
      details: error
    };
  }
}

async function testUsersList(authToken: string, userRole: string): Promise<TestResult> {
  try {
    const response = await fetch(`${BASE_URL}/api/users`, {
      headers: {
        'Cookie': `authToken=${authToken}; userRole=${userRole}`
      }
    });

    const isAdmin = userRole === 'ADMIN';

    if (isAdmin && response.ok) {
      const data = await response.json();
      return {
        name: 'دریافت لیست کاربران توسط Admin',
        passed: true,
        message: 'Admin به درستی لیست کاربران را دریافت کرد',
        details: { usersCount: data.length }
      };
    }

    if (!isAdmin && (response.status === 403 || response.status === 401)) {
      return {
        name: 'عدم دسترسی کاربر عادی به لیست کاربران',
        passed: true,
        message: 'کاربر عادی به درستی از دسترسی محروم شد',
        details: { status: response.status }
      };
    }

    return {
      name: 'خطا در کنترل دسترسی لیست کاربران',
      passed: false,
      message: `نتیجه غیرمنتظره برای ${userRole}`,
      details: { status: response.status, isAdmin }
    };
  } catch (error) {
    return {
      name: 'خطا در تست لیست کاربران',
      passed: false,
      message: error.message,
      details: error
    };
  }
}

async function testSettingsAccess(authToken: string, userRole: string): Promise<TestResult> {
  try {
    const response = await fetch(`${BASE_URL}/api/settings`, {
      headers: {
        'Cookie': `authToken=${authToken}; userRole=${userRole}`
      }
    });

    // Settings API باید برای همه قابل دسترسی باشه (GET)
    if (response.ok) {
      return {
        name: 'دسترسی به تنظیمات',
        passed: true,
        message: `${userRole} به درستی به تنظیمات دسترسی دارد`,
        details: { status: response.status }
      };
    }

    return {
      name: 'خطا در دسترسی به تنظیمات',
      passed: false,
      message: 'نتوانست به تنظیمات دسترسی پیدا کند',
      details: { status: response.status }
    };
  } catch (error) {
    return {
      name: 'خطا در تست تنظیمات',
      passed: false,
      message: error.message,
      details: error
    };
  }
}

async function testUpdateSettings(authToken: string, userRole: string): Promise<TestResult> {
  try {
    const response = await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `authToken=${authToken}; userRole=${userRole}`
      },
      body: JSON.stringify({
        maxLoginAttempts: 5
      })
    });

    const isAdmin = userRole === 'ADMIN';

    if (isAdmin && response.ok) {
      return {
        name: 'ویرایش تنظیمات توسط Admin',
        passed: true,
        message: 'Admin به درستی تنظیمات را ویرایش کرد',
        details: { status: response.status }
      };
    }

    if (!isAdmin && (response.status === 403 || response.status === 401)) {
      return {
        name: 'عدم امکان ویرایش تنظیمات توسط کاربر عادی',
        passed: true,
        message: 'کاربر عادی به درستی از ویرایش محروم شد',
        details: { status: response.status }
      };
    }

    return {
      name: 'خطا در کنترل ویرایش تنظیمات',
      passed: false,
      message: `نتیجه غیرمنتظره برای ${userRole}`,
      details: { status: response.status, isAdmin }
    };
  } catch (error) {
    return {
      name: 'خطا در تست ویرایش تنظیمات',
      passed: false,
      message: error.message,
      details: error
    };
  }
}

async function testWithoutAuth(route: string): Promise<TestResult> {
  try {
    const response = await fetch(`${BASE_URL}${route}`);

    // مسیرهای محافظت شده باید بدون توکن redirect شوند
    const publicRoutes = ['/login', '/api/health'];
    const isPublicRoute = publicRoutes.some(r => route.startsWith(r));

    if (isPublicRoute && response.ok) {
      return {
        name: `دسترسی عمومی به ${route}`,
        passed: true,
        message: `${route} به درستی عمومی است`,
        details: { status: response.status }
      };
    }

    if (!isPublicRoute && (response.status === 401 || response.status === 403 || response.redirected)) {
      return {
        name: `محافظت از ${route}`,
        passed: true,
        message: `${route} به درستی محافظت شده است`,
        details: { status: response.status, redirected: response.redirected }
      };
    }

    return {
      name: `خطا در محافظت ${route}`,
      passed: false,
      message: `مسیر محافظت نشده یا نتیجه غیرمنتظره`,
      details: { 
        status: response.status,
        isPublicRoute,
        redirected: response.redirected
      }
    };
  } catch (error) {
    return {
      name: `خطا در تست بدون احراز هویت ${route}`,
      passed: false,
      message: error.message,
      details: error
    };
  }
}

export async function runAuthorizationTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  console.log('\n🛡️ شروع تست‌های کنترل دسترسی...\n');

  // تست 1: دسترسی بدون احراز هویت
  console.log('📝 تست 1: بررسی محافظت مسیرها بدون احراز هویت...');
  results.push(await testWithoutAuth('/api/projects'));
  results.push(await testWithoutAuth('/api/users'));
  results.push(await testWithoutAuth('/api/health')); // باید عمومی باشه
  results.push(await testWithoutAuth('/login')); // باید عمومی باشه

  // تست 2: دسترسی Admin
  console.log('📝 تست 2: بررسی دسترسی Admin...');
  results.push(await testUsersList('user-token', 'ADMIN'));
  results.push(await testSettingsAccess('user-token', 'ADMIN'));
  results.push(await testUpdateSettings('user-token', 'ADMIN'));

  // تست 3: دسترسی کاربر عادی
  console.log('📝 تست 3: بررسی محدودیت‌های کاربر عادی...');
  results.push(await testUsersList('user-token', 'BUYER'));
  results.push(await testUpdateSettings('user-token', 'BUYER'));

  return results;
}

