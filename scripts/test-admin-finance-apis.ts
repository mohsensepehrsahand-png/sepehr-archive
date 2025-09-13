import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function testAdminFinanceAPIs() {
  console.log('🧪 تست API های مدیریتی مالی...\n');

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

    // 3. تست API اقساط
    console.log('3️⃣ تست API اقساط...');
    
    // دریافت اقساط موجود
    const installmentsResponse = await fetch(`${BASE_URL}/api/finance/installments?projectId=${projectId}`, {
      headers: {
        'Cookie': cookies
      }
    });

    if (installmentsResponse.ok) {
      const installments = await installmentsResponse.json();
      console.log(`✅ ${installments.length} قسط موجود یافت شد`);
    }

    // ایجاد قسط جدید
    const newInstallment = {
      projectId,
      title: 'قسط تست جدید',
      dueDate: '2025-12-31',
      amount: 100000000
    };

    const createInstallmentResponse = await fetch(`${BASE_URL}/api/finance/installments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify(newInstallment)
    });

    if (createInstallmentResponse.ok) {
      const result = await createInstallmentResponse.json();
      console.log('✅ قسط جدید با موفقیت ایجاد شد');
      console.log(`   تعداد اقساط کاربران: ${result.userInstallments}`);
    } else {
      const error = await createInstallmentResponse.json();
      console.log(`❌ خطا در ایجاد قسط: ${error.error}`);
    }

    // 4. تست API پرداخت‌ها
    console.log('\n4️⃣ تست API پرداخت‌ها...');
    
    // دریافت اقساط کاربران
    const userInstallmentsResponse = await fetch(`${BASE_URL}/api/finance/projects/${projectId}/installments`, {
      headers: {
        'Cookie': cookies
      }
    });

    if (userInstallmentsResponse.ok) {
      const userInstallments = await userInstallmentsResponse.json();
      console.log(`✅ ${userInstallments.length} قسط کاربر یافت شد`);
      
      if (userInstallments.length > 0) {
        const firstInstallment = userInstallments[0];
        
        // ثبت پرداخت جدید
        const newPayment = {
          userInstallmentId: firstInstallment.id,
          paymentDate: '2025-01-08',
          amount: 50000000,
          description: 'پرداخت تست'
        };

        const createPaymentResponse = await fetch(`${BASE_URL}/api/finance/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': cookies
          },
          body: JSON.stringify(newPayment)
        });

        if (createPaymentResponse.ok) {
          console.log('✅ پرداخت جدید با موفقیت ثبت شد');
        } else {
          const error = await createPaymentResponse.json();
          console.log(`❌ خطا در ثبت پرداخت: ${error.error}`);
        }
      }
    }

    // 5. تست API جریمه‌ها
    console.log('\n5️⃣ تست API جریمه‌ها...');
    
    const penaltiesResponse = await fetch(`${BASE_URL}/api/finance/penalties?projectId=${projectId}`, {
      headers: {
        'Cookie': cookies
      }
    });

    if (penaltiesResponse.ok) {
      const penalties = await penaltiesResponse.json();
      console.log(`✅ ${penalties.length} جریمه موجود یافت شد`);
    }

    console.log('\n🎉 تست کامل موفقیت‌آمیز بود!');

  } catch (error) {
    console.error('❌ خطا در تست:', error);
  }
}

testAdminFinanceAPIs();
