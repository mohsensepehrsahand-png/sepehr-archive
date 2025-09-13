import fetch from 'node-fetch';

async function testAPIWithAuth() {
  try {
    console.log("🔐 تست API با احراز هویت...");

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
      const errorText = await loginResponse.text();
      console.log(`   ${errorText}`);
      return;
    }

    const loginData = await loginResponse.json();
    console.log(`✅ ورود موفق: ${loginData.user.username}`);

    // Extract cookies from response
    const cookies = loginResponse.headers.get('set-cookie');
    console.log(`🍪 کوکی‌ها: ${cookies}`);

    // Parse cookies
    const cookieArray = cookies?.split(', ') || [];
    const cookieString = cookieArray.map(cookie => cookie.split(';')[0]).join('; ');
    console.log(`🍪 کوکی‌های پارس شده: ${cookieString}`);

    // Step 2: Test finance API
    console.log("\n2️⃣ تست API مالی...");
    const financeResponse = await fetch('http://localhost:3000/api/finance/projects', {
      method: 'GET',
      headers: {
        'Cookie': cookieString,
        'Content-Type': 'application/json',
      }
    });

    if (!financeResponse.ok) {
      console.log(`❌ خطا در API مالی: ${financeResponse.status}`);
      const errorText = await financeResponse.text();
      console.log(`   ${errorText}`);
      return;
    }

    const financeData = await financeResponse.json();
    console.log(`✅ API مالی موفق: ${financeData.length} پروژه یافت شد`);

    if (financeData.length > 0) {
      const project = financeData[0];
      console.log(`\n📋 پروژه اول:`);
      console.log(`   - نام: ${project.name}`);
      console.log(`   - تعداد واحدها: ${project.unitsCount}`);
      console.log(`   - مجموع اقساط: ${project.totalAmount.toLocaleString()} ریال`);
      console.log(`   - پرداخت شده: ${project.paidAmount.toLocaleString()} ریال`);
      console.log(`   - مانده: ${project.remainingAmount.toLocaleString()} ریال`);
    }

    console.log("\n🎉 تست کامل موفقیت‌آمیز بود!");

  } catch (error) {
    console.error("❌ خطا در تست:", error);
  }
}

testAPIWithAuth();
