import fetch from 'node-fetch';

async function testUserFinanceAPI() {
  try {
    console.log("🧪 تست API مالی کاربران...");

    // Step 1: Login
    console.log("\n1️⃣ ورود به سیستم...");
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
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
      console.log(`❌ خطا در ورود: ${loginResponse.status}`);
      return;
    }

    const loginData = await loginResponse.json();
    console.log(`✅ ورود موفق: ${loginData.user.username}`);

    // Extract cookies
    const cookies = loginResponse.headers.get('set-cookie');
    const cookieArray = cookies?.split(', ') || [];
    const cookieString = cookieArray.map(cookie => cookie.split(';')[0]).join('; ');

    // Step 2: Get projects
    console.log("\n2️⃣ دریافت لیست پروژه‌ها...");
    const projectsResponse = await fetch('http://localhost:3000/api/finance/projects', {
      method: 'GET',
      headers: {
        'Cookie': cookieString,
        'Content-Type': 'application/json',
      }
    });

    if (!projectsResponse.ok) {
      console.log(`❌ خطا در دریافت پروژه‌ها: ${projectsResponse.status}`);
      return;
    }

    const projectsData = await projectsResponse.json();
    console.log(`✅ ${projectsData.length} پروژه یافت شد`);

    if (projectsData.length === 0) {
      console.log("❌ هیچ پروژه‌ای یافت نشد");
      return;
    }

    const projectId = projectsData[0].id;
    console.log(`📋 تست با پروژه: ${projectsData[0].name}`);

    // Step 3: Get project users
    console.log("\n3️⃣ دریافت لیست کاربران پروژه...");
    const usersResponse = await fetch(`http://localhost:3000/api/finance/projects/${projectId}/users`, {
      method: 'GET',
      headers: {
        'Cookie': cookieString,
        'Content-Type': 'application/json',
      }
    });

    if (!usersResponse.ok) {
      console.log(`❌ خطا در دریافت کاربران: ${usersResponse.status}`);
      const errorText = await usersResponse.text();
      console.log(`   ${errorText}`);
      return;
    }

    const usersData = await usersResponse.json();
    console.log(`✅ ${usersData.users.length} کاربر یافت شد`);

    if (usersData.users.length === 0) {
      console.log("❌ هیچ کاربری در این پروژه یافت نشد");
      return;
    }

    // Display users info
    usersData.users.forEach((user: any, index: number) => {
      console.log(`\n👤 کاربر ${index + 1}:`);
      console.log(`   نام: ${user.firstName} ${user.lastName || ''}`);
      console.log(`   نام کاربری: ${user.username}`);
      console.log(`   نقش: ${user.role}`);
      console.log(`   تعداد واحدها: ${user.units.length}`);
      console.log(`   مجموع سهم: ${user.financialSummary.totalShareAmount.toLocaleString()} ریال`);
      console.log(`   پرداخت شده: ${user.financialSummary.totalPaidAmount.toLocaleString()} ریال`);
      console.log(`   مانده: ${user.financialSummary.totalRemainingAmount.toLocaleString()} ریال`);
      console.log(`   درصد پیشرفت: ${Math.round(user.financialSummary.paidPercentage)}%`);
    });

    // Step 4: Get user financial profile
    const userId = usersData.users[0].id;
    console.log(`\n4️⃣ دریافت پروفایل مالی کاربر ${usersData.users[0].username}...`);
    
    const userProfileResponse = await fetch(`http://localhost:3000/api/finance/projects/${projectId}/users/${userId}`, {
      method: 'GET',
      headers: {
        'Cookie': cookieString,
        'Content-Type': 'application/json',
      }
    });

    if (!userProfileResponse.ok) {
      console.log(`❌ خطا در دریافت پروفایل کاربر: ${userProfileResponse.status}`);
      const errorText = await userProfileResponse.text();
      console.log(`   ${errorText}`);
      return;
    }

    const userProfileData = await userProfileResponse.json();
    console.log(`✅ پروفایل مالی کاربر دریافت شد`);
    console.log(`   تعداد اقساط: ${userProfileData.installments.length}`);
    console.log(`   تعداد پرداخت‌ها: ${userProfileData.payments.length}`);
    console.log(`   تعداد جریمه‌ها: ${userProfileData.penalties.length}`);

    console.log("\n🎉 تست کامل موفقیت‌آمیز بود!");

  } catch (error) {
    console.error("❌ خطا در تست:", error);
  }
}

testUserFinanceAPI();
