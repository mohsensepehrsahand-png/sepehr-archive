/**
 * تست احراز هویت (Authentication)
 * بررسی ورود، خروج، و مدیریت توکن‌ها
 */

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

const BASE_URL = 'http://localhost:3000';

async function testLogin(username: string, password: string): Promise<TestResult> {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    const cookies = response.headers.get('set-cookie');

    if (response.ok && data.success && cookies?.includes('authToken')) {
      return {
        name: 'ورود موفق',
        passed: true,
        message: `کاربر ${username} با موفقیت وارد شد`,
        details: { user: data.user, hasCookies: true }
      };
    }

    return {
      name: 'ورود ناموفق',
      passed: false,
      message: data.error || 'خطای نامشخص',
      details: data
    };
  } catch (error) {
    return {
      name: 'خطا در تست ورود',
      passed: false,
      message: error.message,
      details: error
    };
  }
}

async function testInvalidLogin(): Promise<TestResult> {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: 'invalid_user_xyz', 
        password: 'wrong_password_123' 
      })
    });

    const data = await response.json();

    if (response.status === 401 && data.error) {
      return {
        name: 'رد شدن ورود نامعتبر',
        passed: true,
        message: 'سیستم به درستی ورود نامعتبر را رد کرد',
        details: data
      };
    }

    return {
      name: 'خطا در رد ورود نامعتبر',
      passed: false,
      message: 'سیستم نتوانست ورود نامعتبر را رد کند',
      details: data
    };
  } catch (error) {
    return {
      name: 'خطا در تست ورود نامعتبر',
      passed: false,
      message: error.message,
      details: error
    };
  }
}

async function testEmptyCredentials(): Promise<TestResult> {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '', password: '' })
    });

    const data = await response.json();

    if (response.status === 400 && data.error) {
      return {
        name: 'رد شدن اطلاعات خالی',
        passed: true,
        message: 'سیستم به درستی اطلاعات خالی را رد کرد',
        details: data
      };
    }

    return {
      name: 'خطا در رد اطلاعات خالی',
      passed: false,
      message: 'سیستم نتوانست اطلاعات خالی را رد کند',
      details: data
    };
  } catch (error) {
    return {
      name: 'خطا در تست اطلاعات خالی',
      passed: false,
      message: error.message,
      details: error
    };
  }
}

async function testCurrentUser(authToken: string): Promise<TestResult> {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/current-user`, {
      headers: {
        'Cookie': `authToken=${authToken}`
      }
    });

    const data = await response.json();

    if (response.ok && data.user) {
      return {
        name: 'دریافت اطلاعات کاربر جاری',
        passed: true,
        message: 'اطلاعات کاربر با موفقیت دریافت شد',
        details: data.user
      };
    }

    return {
      name: 'خطا در دریافت کاربر جاری',
      passed: false,
      message: 'نتوانست اطلاعات کاربر را دریافت کند',
      details: data
    };
  } catch (error) {
    return {
      name: 'خطا در تست کاربر جاری',
      passed: false,
      message: error.message,
      details: error
    };
  }
}

async function testLogout(authToken: string): Promise<TestResult> {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Cookie': `authToken=${authToken}`
      }
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return {
        name: 'خروج موفق',
        passed: true,
        message: 'کاربر با موفقیت از سیستم خارج شد',
        details: data
      };
    }

    return {
      name: 'خطا در خروج',
      passed: false,
      message: 'نتوانست از سیستم خارج شود',
      details: data
    };
  } catch (error) {
    return {
      name: 'خطا در تست خروج',
      passed: false,
      message: error.message,
      details: error
    };
  }
}

export async function runAuthenticationTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  console.log('\n🔐 شروع تست‌های احراز هویت...\n');

  // تست 1: ورود نامعتبر
  console.log('📝 تست 1: بررسی رد ورود نامعتبر...');
  results.push(await testInvalidLogin());

  // تست 2: اطلاعات خالی
  console.log('📝 تست 2: بررسی رد اطلاعات خالی...');
  results.push(await testEmptyCredentials());

  // تست 3: ورود معتبر (باید یک کاربر admin داشته باشید)
  console.log('📝 تست 3: بررسی ورود معتبر...');
  const loginResult = await testLogin('admin', 'admin123');
  results.push(loginResult);

  if (loginResult.passed) {
    // تست 4: دریافت اطلاعات کاربر
    console.log('📝 تست 4: بررسی دریافت اطلاعات کاربر جاری...');
    results.push(await testCurrentUser('user-token'));

    // تست 5: خروج
    console.log('📝 تست 5: بررسی خروج از سیستم...');
    results.push(await testLogout('user-token'));
  }

  return results;
}

