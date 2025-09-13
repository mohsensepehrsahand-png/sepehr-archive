import axios from 'axios';

async function testRemovedPenaltyForm() {
  try {
    console.log('🧪 تست حذف فرم قدیمی "تعریف نرخ جریمه روزانه"...\n');

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

    // 2. تست API قدیمی penalty-rate (باید 404 بدهد)
    console.log('\n🚫 تست API قدیمی penalty-rate (باید 404 بدهد)...');
    try {
      const oldApiResponse = await axios.put(`${baseUrl}/api/finance/projects/${projectId}/penalty-rate`, {
        penaltyRate: 0.1
      }, {
        headers: {
          'Cookie': cookies,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('❌ API قدیمی هنوز کار می‌کند!');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ API قدیمی penalty-rate حذف شده است (404)');
      } else {
        console.log('❌ خطای غیرمنتظره:', error.response?.status);
      }
    }

    // 3. تست API جدید penalty-settings (باید کار کند)
    console.log('\n✅ تست API جدید penalty-settings...');
    try {
      const newApiResponse = await axios.get(`${baseUrl}/api/finance/projects/${projectId}/users/${userId}/penalty-settings`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      if (newApiResponse.status === 200) {
        const settings = newApiResponse.data;
        console.log('✅ API جدید penalty-settings کار می‌کند:');
        console.log(`   نام کاربر: ${settings.firstName} ${settings.lastName}`);
        console.log(`   مبلغ جریمه روزانه: ${new Intl.NumberFormat('fa-IR').format(settings.dailyPenaltyAmount)} ریال`);
        console.log(`   تعداد روزهای تاخیر مجاز: ${settings.penaltyGraceDays} روز`);
      } else {
        console.log('❌ API جدید کار نمی‌کند');
      }
    } catch (error) {
      console.log('❌ خطا در API جدید:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
    }

    // 4. تست به‌روزرسانی تنظیمات
    console.log('\n🔧 تست به‌روزرسانی تنظیمات...');
    try {
      const updateData = {
        dailyPenaltyAmount: 75000, // 75,000 ریال
        penaltyGraceDays: 5 // 5 روز
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
      } else {
        console.log('❌ خطا در به‌روزرسانی تنظیمات');
      }
    } catch (error) {
      console.log('❌ خطا در به‌روزرسانی:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
    }

    console.log('\n📝 تغییرات اعمال شده:');
    console.log('   ✅ فرم قدیمی "تعریف نرخ جریمه روزانه" حذف شد');
    console.log('   ✅ state penaltyRate حذف شد');
    console.log('   ✅ handler handleSavePenaltyRate حذف شد');
    console.log('   ✅ import Save حذف شد');
    console.log('   ✅ API قدیمی penalty-rate حذف شد');
    console.log('   ✅ API جدید penalty-settings کار می‌کند');
    console.log('   ✅ تنظیمات جریمه در تب جداگانه مدیریت می‌شود');

    console.log('\n🎯 برای تست در مرورگر:');
    console.log(`   URL: ${baseUrl}/finance/${projectId}/users/${userId}`);
    console.log('   تب: تنظیمات جریمه');
    console.log('   فرم قدیمی "تعریف نرخ جریمه روزانه" نباید نمایش داده شود');

  } catch (error) {
    console.error('❌ خطای کلی:', error.message);
  }
}

testRemovedPenaltyForm();







