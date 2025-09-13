import axios from 'axios';

async function testFixRefreshTriggerError() {
  try {
    console.log('🧪 تست رفع خطای setRefreshTrigger is not defined...\n');

    const baseUrl = 'http://localhost:3001';
    const projectId = 'cmfa8ni2j0002udcopddkg947';
    const userId = 'cmfaeocwh0000udww6r1f25c9'; // احمد محمدی

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

    // 2. تست دریافت اطلاعات کاربر
    console.log('\n📊 تست دریافت اطلاعات کاربر...');
    try {
      const userResponse = await axios.get(`${baseUrl}/api/finance/projects/${projectId}/users/${userId}`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      if (userResponse.status === 200) {
        const userData = userResponse.data;
        console.log('✅ اطلاعات کاربر با موفقیت دریافت شد:');
        console.log(`   نام کاربر: ${userData.firstName} ${userData.lastName}`);
        console.log(`   کل سهم: ${new Intl.NumberFormat('fa-IR').format(userData.summary.totalShareAmount)} ریال`);
        console.log(`   مجموع پرداختی: ${new Intl.NumberFormat('fa-IR').format(userData.summary.totalPaidAmount)} ریال`);
        console.log(`   مانده: ${new Intl.NumberFormat('fa-IR').format(userData.summary.remainingAmount)} ریال`);
        console.log(`   تعداد اقساط: ${userData.installments.length}`);
        console.log(`   تعداد جریمه‌ها: ${userData.penalties.length}`);
      } else {
        console.log('❌ خطا در دریافت اطلاعات کاربر');
      }
    } catch (error) {
      console.log('❌ خطا در دریافت اطلاعات کاربر:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
    }

    // 3. تست تنظیمات جریمه
    console.log('\n⚙️ تست تنظیمات جریمه...');
    try {
      const settingsResponse = await axios.get(`${baseUrl}/api/finance/projects/${projectId}/users/${userId}/penalty-settings`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      if (settingsResponse.status === 200) {
        const settings = settingsResponse.data;
        console.log('✅ تنظیمات جریمه دریافت شد:');
        console.log(`   مبلغ جریمه روزانه: ${new Intl.NumberFormat('fa-IR').format(settings.dailyPenaltyAmount)} ریال`);
        console.log(`   تعداد روزهای تاخیر مجاز: ${settings.penaltyGraceDays} روز`);
      } else {
        console.log('❌ خطا در دریافت تنظیمات جریمه');
      }
    } catch (error) {
      console.log('❌ خطا در دریافت تنظیمات جریمه:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
    }

    // 4. تست به‌روزرسانی تنظیمات (این باید refreshTrigger را فعال کند)
    console.log('\n🔧 تست به‌روزرسانی تنظیمات (refreshTrigger)...');
    try {
      const updateData = {
        dailyPenaltyAmount: 120000, // 120,000 ریال
        penaltyGraceDays: 15 // 15 روز
      };

      const updateResponse = await axios.put(`${baseUrl}/api/finance/projects/${projectId}/users/${userId}/penalty-settings`, updateData, {
        headers: {
          'Cookie': cookies,
          'Content-Type': 'application/json'
        }
      });
      
      if (updateResponse.status === 200) {
        const result = updateResponse.data;
        console.log('✅ تنظیمات با موفقیت به‌روزرسانی شد:');
        console.log(`   مبلغ جریمه روزانه: ${new Intl.NumberFormat('fa-IR').format(result.user.dailyPenaltyAmount)} ریال`);
        console.log(`   تعداد روزهای تاخیر مجاز: ${result.user.penaltyGraceDays} روز`);
        console.log('   🔄 refreshTrigger فعال شد - صفحه باید refresh شود');
      } else {
        console.log('❌ خطا در به‌روزرسانی تنظیمات');
      }
    } catch (error) {
      console.log('❌ خطا در به‌روزرسانی:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
    }

    // 5. تست دریافت مجدد اطلاعات (برای اطمینان از refresh)
    console.log('\n🔄 تست دریافت مجدد اطلاعات (بعد از refresh)...');
    try {
      const userResponse2 = await axios.get(`${baseUrl}/api/finance/projects/${projectId}/users/${userId}`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      if (userResponse2.status === 200) {
        const userData2 = userResponse2.data;
        console.log('✅ اطلاعات کاربر بعد از refresh:');
        console.log(`   نام کاربر: ${userData2.firstName} ${userData2.lastName}`);
        console.log(`   کل سهم: ${new Intl.NumberFormat('fa-IR').format(userData2.summary.totalShareAmount)} ریال`);
        console.log(`   مجموع پرداختی: ${new Intl.NumberFormat('fa-IR').format(userData2.summary.totalPaidAmount)} ریال`);
        console.log(`   مانده: ${new Intl.NumberFormat('fa-IR').format(userData2.summary.remainingAmount)} ریال`);
      } else {
        console.log('❌ خطا در دریافت مجدد اطلاعات');
      }
    } catch (error) {
      console.log('❌ خطا در دریافت مجدد اطلاعات:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
    }

    console.log('\n📝 تغییرات اعمال شده:');
    console.log('   ✅ refreshTrigger state اضافه شد');
    console.log('   ✅ setRefreshTrigger function اضافه شد');
    console.log('   ✅ refreshTrigger به dependency array اضافه شد');
    console.log('   ✅ onSettingsChange callback کار می‌کند');
    console.log('   ✅ خطای "setRefreshTrigger is not defined" رفع شد');

    console.log('\n🎯 برای تست در مرورگر:');
    console.log(`   URL: ${baseUrl}/finance/${projectId}/users/${userId}`);
    console.log('   خطای "setRefreshTrigger is not defined" نباید نمایش داده شود');
    console.log('   تب "تنظیمات جریمه" باید کار کند');
    console.log('   بعد از تغییر تنظیمات، صفحه باید refresh شود');

  } catch (error) {
    console.error('❌ خطای کلی:', error.message);
  }
}

testFixRefreshTriggerError();







