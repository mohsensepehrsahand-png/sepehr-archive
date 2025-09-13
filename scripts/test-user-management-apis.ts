import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testUserManagementAPIs() {
  console.log('🧪 تست API های مدیریت کاربران...\n');

  try {
    // 1. ورود به سیستم
    console.log('1️⃣ ورود به سیستم...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: '123456'
      })
    });

    if (!loginResponse.ok) {
      throw new Error('خطا در ورود به سیستم');
    }

    const loginData = await loginResponse.json();
    console.log('✅ ورود موفقیت‌آمیز\n');

    // استخراج کوکی‌ها
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    if (!setCookieHeader) {
      throw new Error('کوکی‌ها دریافت نشد');
    }

    const cookies = setCookieHeader.split(',').map(cookie => cookie.split(';')[0]).join('; ');
    console.log('🍪 کوکی‌ها دریافت شد\n');

    // 2. دریافت پروژه‌ها
    console.log('2️⃣ دریافت لیست پروژه‌ها...');
    const projectsResponse = await fetch(`${BASE_URL}/api/finance/projects`, {
      headers: {
        'Cookie': cookies
      }
    });

    if (!projectsResponse.ok) {
      throw new Error('خطا در دریافت پروژه‌ها');
    }

    const projects = await projectsResponse.json();
    console.log(`✅ ${projects.length} پروژه یافت شد`);
    
    if (projects.length === 0) {
      console.log('❌ هیچ پروژه‌ای یافت نشد');
      return;
    }

    const projectId = projects[0].id;
    console.log(`📋 تست با پروژه: ${projects[0].name}\n`);

    // 3. تست API کاربران موجود برای پروژه
    console.log('3️⃣ تست API کاربران موجود برای پروژه...');
    const availableUsersResponse = await fetch(`${BASE_URL}/api/users/available-for-project?projectId=${projectId}`, {
      headers: {
        'Cookie': cookies
      }
    });

    if (availableUsersResponse.ok) {
      const availableUsers = await availableUsersResponse.json();
      console.log(`✅ ${availableUsers.length} کاربر موجود برای اضافه کردن یافت شد`);
    } else {
      console.log('⚠️ API کاربران موجود در دسترس نیست');
    }

    // 4. تست API اقساط کاربر
    console.log('\n4️⃣ تست API اقساط کاربر...');
    const usersResponse = await fetch(`${BASE_URL}/api/finance/projects/${projectId}/users`, {
      headers: {
        'Cookie': cookies
      }
    });

    if (usersResponse.ok) {
      const users = await usersResponse.json();
      console.log(`✅ ${users.length} کاربر در پروژه یافت شد`);
      
      if (users.length > 0) {
        const userId = users[0].id;
        console.log(`👤 تست با کاربر: ${users[0].username}`);
        
        // تست اقساط کاربر
        const userInstallmentsResponse = await fetch(`${BASE_URL}/api/finance/projects/${projectId}/users/${userId}/installments`, {
          headers: {
            'Cookie': cookies
          }
        });

        if (userInstallmentsResponse.ok) {
          const installments = await userInstallmentsResponse.json();
          console.log(`✅ ${installments.length} قسط برای کاربر یافت شد`);
        }

        // تست پرداخت‌های کاربر
        const userPaymentsResponse = await fetch(`${BASE_URL}/api/finance/payments?projectId=${projectId}&userId=${userId}`, {
          headers: {
            'Cookie': cookies
          }
        });

        if (userPaymentsResponse.ok) {
          const payments = await userPaymentsResponse.json();
          console.log(`✅ ${payments.length} پرداخت برای کاربر یافت شد`);
        }
      }
    }

    console.log('\n🎉 تست کامل موفقیت‌آمیز بود!');

  } catch (error) {
    console.error('❌ خطا در تست:', error);
  }
}

testUserManagementAPIs();
