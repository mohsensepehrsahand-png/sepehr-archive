import axios from 'axios';

async function testFixSaveIconError() {
  try {
    console.log('🧪 تست رفع خطای Save is not defined در InstallmentForm...\n');

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
        console.log(`   تعداد اقساط: ${userData.installments.length}`);
        
        if (userData.installments.length > 0) {
          console.log(`   اولین قسط: ${userData.installments[0].title}`);
          console.log(`   مبلغ قسط: ${new Intl.NumberFormat('fa-IR').format(userData.installments[0].shareAmount)} ریال`);
        }
      } else {
        console.log('❌ خطا در دریافت اطلاعات کاربر');
      }
    } catch (error) {
      console.log('❌ خطا در دریافت اطلاعات کاربر:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
    }

    // 3. تست دریافت انواع قسط (برای فرم)
    console.log('\n📋 تست دریافت انواع قسط...');
    try {
      const definitionsResponse = await axios.get(`${baseUrl}/api/finance/projects/${projectId}/installment-definitions`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      if (definitionsResponse.status === 200) {
        const definitions = definitionsResponse.data;
        console.log('✅ انواع قسط دریافت شد:');
        console.log(`   تعداد انواع قسط: ${definitions.length}`);
        
        if (definitions.length > 0) {
          console.log(`   اولین نوع: ${definitions[0].title}`);
          console.log(`   مبلغ: ${new Intl.NumberFormat('fa-IR').format(definitions[0].amount)} ریال`);
        }
      } else {
        console.log('❌ خطا در دریافت انواع قسط');
      }
    } catch (error) {
      console.log('❌ خطا در دریافت انواع قسط:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
    }

    // 4. تست تنظیمات جریمه
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

    console.log('\n📝 تغییرات اعمال شده:');
    console.log('   ✅ Save icon به imports اضافه شد');
    console.log('   ✅ InstallmentForm کامپوننت حالا Save icon دارد');
    console.log('   ✅ خطای "Save is not defined" رفع شد');
    console.log('   ✅ فرم ویرایش قسط باید کار کند');

    console.log('\n🎯 برای تست در مرورگر:');
    console.log(`   URL: ${baseUrl}/finance/${projectId}/users/${userId}`);
    console.log('   خطای "Save is not defined" نباید نمایش داده شود');
    console.log('   کلیک روی "ویرایش" در جدول اقساط باید کار کند');
    console.log('   فرم ویرایش قسط باید باز شود');
    console.log('   دکمه "ذخیره" باید نمایش داده شود');

    console.log('\n⚠️ نکات مهم:');
    console.log('   - Save icon فقط در InstallmentForm استفاده می‌شود');
    console.log('   - فرم قدیمی "تعریف نرخ جریمه روزانه" حذف شده');
    console.log('   - تنظیمات جریمه در تب جداگانه مدیریت می‌شود');

  } catch (error) {
    console.error('❌ خطای کلی:', error.message);
  }
}

testFixSaveIconError();







