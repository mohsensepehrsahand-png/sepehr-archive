import axios from 'axios';

async function addInstallmentDefinitions() {
  try {
    console.log('📋 اضافه کردن تعریف‌های اقساط به پروژه جدید...\n');

    const baseUrl = 'http://localhost:3000';
    const projectId = 'cmfbd0cqw0001udv0lp8geqy1'; // پروژه جدید

    // 1. تست login
    console.log('🔐 تست ورود...');
    let cookies = '';
    try {
      const loginResponse = await axios.post(`${baseUrl}/api/auth/login`, {
        username: 'admin',
        password: 'admin123'
      });

      if (loginResponse.status === 200) {
        console.log('✅ ورود موفق');
        const setCookieHeaders = loginResponse.headers['set-cookie'];
        if (setCookieHeaders) {
          cookies = setCookieHeaders.join('; ');
          console.log('🍪 کوکی‌ها دریافت شد');
        }
      } else {
        console.log('❌ ورود ناموفق');
        return;
      }
    } catch (error) {
      console.log('❌ خطا در ورود:', error.message);
      return;
    }

    // 2. تعریف‌های اقساط برای اضافه کردن
    const installmentDefinitions = [
      {
        title: "پروانه ساختمان",
        dueDate: "2024-03-15",
        amount: 100000000
      },
      {
        title: "تأسیسات مکانیکی",
        dueDate: "2024-06-15",
        amount: 80000000
      },
      {
        title: "نازک‌کاری",
        dueDate: "2024-09-15",
        amount: 120000000
      }
    ];

    // 3. اضافه کردن هر تعریف قسط
    for (const definition of installmentDefinitions) {
      console.log(`\n➕ اضافه کردن: ${definition.title}...`);
      try {
        const response = await axios.post(`${baseUrl}/api/finance/projects/${projectId}/installment-definitions`, definition, {
          headers: {
            'Cookie': cookies,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status === 200) {
          console.log(`✅ ${definition.title} با موفقیت اضافه شد`);
          console.log(`   مبلغ: ${new Intl.NumberFormat('fa-IR').format(definition.amount)} ریال`);
          console.log(`   تاریخ سررسید: ${new Date(definition.dueDate).toLocaleDateString('fa-IR')}`);
        } else {
          console.log(`❌ خطا در اضافه کردن ${definition.title}`);
        }
      } catch (error) {
        console.log(`❌ خطا در اضافه کردن ${definition.title}:`);
        console.log('   Status:', error.response?.status);
        console.log('   Data:', error.response?.data);
      }
    }

    // 4. بررسی تعریف‌های اضافه شده
    console.log('\n📊 بررسی تعریف‌های اضافه شده...');
    try {
      const response = await axios.get(`${baseUrl}/api/finance/projects/${projectId}/installment-definitions`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      if (response.status === 200) {
        const definitions = response.data;
        console.log(`✅ ${definitions.length} تعریف قسط یافت شد`);
        
        definitions.forEach((def: any, index: number) => {
          console.log(`   ${index + 1}. ${def.title}`);
          console.log(`      تاریخ سررسید: ${new Date(def.dueDate).toLocaleDateString('fa-IR')}`);
          console.log(`      مبلغ: ${new Intl.NumberFormat('fa-IR').format(def.amount)} ریال`);
        });
      } else {
        console.log('❌ خطا در دریافت تعریف‌های اقساط');
      }
    } catch (error) {
      console.log('❌ خطا در دریافت تعریف‌های اقساط:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
    }

    console.log('\n🎯 حالا می‌توانید کاربران را اضافه کنید و اقساط خودکار ایجاد شوند');

  } catch (error) {
    console.error('❌ خطای کلی:', error.message);
  }
}

addInstallmentDefinitions();
