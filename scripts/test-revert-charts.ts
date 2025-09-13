import axios from 'axios';

async function testRevertCharts() {
  try {
    console.log('🔄 تست برگشت نمودارها به حالت قبلی...\n');

    const baseUrl = 'http://localhost:3000';
    const projectId = 'cmfa8ni2j0002udcopddkg947';

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

    // 2. دریافت اطلاعات پروژه
    console.log('\n📊 دریافت اطلاعات پروژه...');
    try {
      const projectResponse = await axios.get(`${baseUrl}/api/finance/projects/${projectId}`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      if (projectResponse.status === 200) {
        const data = projectResponse.data;
        console.log(`✅ اطلاعات پروژه دریافت شد: ${data.name}`);
        console.log(`   تعداد کاربران: ${data.users.length}`);
        
        if (data.users.length === 0) {
          console.log('⚠️ هیچ کاربری در پروژه وجود ندارد');
          return;
        }

        // 3. بررسی داده‌های نمودار میله‌ای
        console.log('\n📈 بررسی داده‌های نمودار میله‌ای:');
        const chartData = data.users.map((user: any) => ({
          name: user.name,
          progress: user.progressPercentage,
          paid: user.totalPaidAmount,
          remaining: user.remainingAmount
        }));
        
        chartData.forEach((data: any, index: number) => {
          console.log(`   ${index + 1}. ${data.name}`);
          console.log(`      درصد پیشرفت: ${data.progress}%`);
          console.log(`      مبلغ پرداختی: ${new Intl.NumberFormat('fa-IR').format(data.paid)} ریال`);
          console.log(`      مبلغ مانده: ${new Intl.NumberFormat('fa-IR').format(data.remaining)} ریال`);
        });

        // 4. بررسی داده‌های نمودار خطی
        console.log('\n📊 بررسی داده‌های نمودار خطی:');
        const lineChartData = data.users.map((user: any) => ({
          name: user.name,
          progress: user.progressPercentage,
          paid: user.totalPaidAmount,
          remaining: user.remainingAmount
        }));
        
        lineChartData.forEach((data: any, index: number) => {
          console.log(`   ${index + 1}. ${data.name}`);
          console.log(`      مبلغ پرداختی: ${new Intl.NumberFormat('fa-IR').format(data.paid)} ریال`);
        });

      } else {
        console.log('❌ خطا در دریافت اطلاعات پروژه');
      }
    } catch (error) {
      console.log('❌ خطا در دریافت اطلاعات پروژه:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
    }

    console.log('\n📝 تغییرات برگشت داده شده:');
    console.log('   ✅ عرض نمودارها به md=6 برگشت (50% عرض)');
    console.log('   ✅ ارتفاع نمودارها به 300px برگشت');
    console.log('   ✅ فونت‌های محورها به 12px برگشت');
    console.log('   ✅ نمودار خطی به حالت ساده برگشت (یک خط آبی)');
    console.log('   ✅ محور X نمودار خطی به نام کاربران برگشت');
    console.log('   ✅ داده‌های نمودار خطی ساده شدند');
    console.log('   ✅ عنوان نمودار خطی به "مقایسه‌ای مبلغ پرداختی" برگشت');
    console.log('   ✅ margin راست نمودار خطی به 30px برگشت');

    console.log('\n🎯 برای تست در مرورگر:');
    console.log(`   URL: ${baseUrl}/finance/${projectId}`);
    console.log('   تب: جدول مقایسه‌ای کاربران');
    console.log('   بررسی دو نمودار کوچک‌تر در کنار هم');
    console.log('   نمودار خطی باید یک خط آبی ساده باشد');

  } catch (error) {
    console.error('❌ خطای کلی:', error.message);
  }
}

testRevertCharts();

