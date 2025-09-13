import axios from 'axios';

async function testUserPenaltySettings() {
  try {
    console.log('🧪 تست سیستم تنظیمات جریمه کاربر...\n');

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

    // 2. دریافت تنظیمات فعلی جریمه کاربر
    console.log('\n📊 دریافت تنظیمات فعلی جریمه کاربر...');
    try {
      const settingsResponse = await axios.get(`${baseUrl}/api/finance/projects/${projectId}/users/${userId}/penalty-settings`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      if (settingsResponse.status === 200) {
        const settings = settingsResponse.data;
        console.log('✅ تنظیمات فعلی کاربر:');
        console.log(`   نام کاربر: ${settings.firstName} ${settings.lastName}`);
        console.log(`   نام کاربری: ${settings.username}`);
        console.log(`   مبلغ جریمه روزانه: ${new Intl.NumberFormat('fa-IR').format(settings.dailyPenaltyAmount || 0)} ریال`);
        console.log(`   تعداد روزهای تاخیر مجاز: ${settings.penaltyGraceDays || 0} روز`);
      } else {
        console.log('❌ خطا در دریافت تنظیمات');
      }
    } catch (error) {
      console.log('❌ خطا در دریافت تنظیمات:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
    }

    // 3. تست به‌روزرسانی تنظیمات جریمه کاربر
    console.log('\n🔧 تست به‌روزرسانی تنظیمات جریمه کاربر...');
    try {
      const updateData = {
        dailyPenaltyAmount: 50000, // 50,000 ریال
        penaltyGraceDays: 7 // 7 روز
      };

      const updateResponse = await axios.put(`${baseUrl}/api/finance/projects/${projectId}/users/${userId}/penalty-settings`, updateData, {
        headers: {
          'Cookie': cookies,
          'Content-Type': 'application/json'
        }
      });
      
      if (updateResponse.status === 200) {
        const result = updateResponse.data;
        console.log('✅ تنظیمات کاربر با موفقیت به‌روزرسانی شد:');
        console.log(`   پیام: ${result.message}`);
        console.log(`   نام کاربر: ${result.user.firstName} ${result.user.lastName}`);
        console.log(`   مبلغ جریمه روزانه: ${new Intl.NumberFormat('fa-IR').format(result.user.dailyPenaltyAmount)} ریال`);
        console.log(`   تعداد روزهای تاخیر مجاز: ${result.user.penaltyGraceDays} روز`);
      } else {
        console.log('❌ خطا در به‌روزرسانی تنظیمات');
      }
    } catch (error) {
      console.log('❌ خطا در به‌روزرسانی تنظیمات:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
    }

    // 4. تست دریافت تنظیمات به‌روزرسانی شده
    console.log('\n📊 بررسی تنظیمات به‌روزرسانی شده...');
    try {
      const settingsResponse = await axios.get(`${baseUrl}/api/finance/projects/${projectId}/users/${userId}/penalty-settings`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      if (settingsResponse.status === 200) {
        const settings = settingsResponse.data;
        console.log('✅ تنظیمات به‌روزرسانی شده:');
        console.log(`   مبلغ جریمه روزانه: ${new Intl.NumberFormat('fa-IR').format(settings.dailyPenaltyAmount)} ریال`);
        console.log(`   تعداد روزهای تاخیر مجاز: ${settings.penaltyGraceDays} روز`);
        
        // 5. توضیح نحوه محاسبه جریمه برای این کاربر
        console.log('\n📝 نحوه محاسبه جریمه برای این کاربر:');
        console.log(`   1. قسط سررسید می‌شود`);
        console.log(`   2. ${settings.penaltyGraceDays} روز تاخیر مجاز است`);
        console.log(`   3. بعد از ${settings.penaltyGraceDays} روز، جریمه شروع می‌شود`);
        console.log(`   4. هر روز ${new Intl.NumberFormat('fa-IR').format(settings.dailyPenaltyAmount)} ریال جریمه اضافه می‌شود`);
        
        // مثال محاسبه
        const exampleDays = 15;
        const penaltyDays = Math.max(0, exampleDays - settings.penaltyGraceDays);
        const totalPenalty = penaltyDays * settings.dailyPenaltyAmount;
        
        console.log(`\n💡 مثال: اگر ${exampleDays} روز از سررسید گذشته باشد:`);
        console.log(`   روزهای جریمه: ${penaltyDays} روز`);
        console.log(`   مجموع جریمه: ${new Intl.NumberFormat('fa-IR').format(totalPenalty)} ریال`);
      }
    } catch (error) {
      console.log('❌ خطا در بررسی تنظیمات:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
    }

    console.log('\n📝 ویژگی‌های جدید:');
    console.log('   ✅ فیلد dailyPenaltyAmount در مدل User');
    console.log('   ✅ فیلد penaltyGraceDays در مدل User');
    console.log('   ✅ API GET برای دریافت تنظیمات جریمه کاربر');
    console.log('   ✅ API PUT برای به‌روزرسانی تنظیمات جریمه کاربر');
    console.log('   ✅ کامپوننت PenaltySettingsManager برای کاربر خاص');
    console.log('   ✅ تب جدید "تنظیمات جریمه" در صفحه مدیریت کاربر');
    console.log('   ✅ محاسبه جریمه بر اساس تنظیمات هر کاربر');

    console.log('\n🎯 برای تست در مرورگر:');
    console.log(`   URL: ${baseUrl}/finance/${projectId}/users/${userId}`);
    console.log('   تب: تنظیمات جریمه');
    console.log('   تنظیم مبلغ جریمه روزانه و تعداد روزهای تاخیر مجاز برای این کاربر');

  } catch (error) {
    console.error('❌ خطای کلی:', error.message);
  }
}

testUserPenaltySettings();
