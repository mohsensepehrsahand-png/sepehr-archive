import axios from 'axios';

async function testChartsImprovements() {
  try {
    console.log('🧪 تست بهبودهای نمودارها...\n');

    const baseUrl = 'http://localhost:3000';
    const projectId = 'cmfa8ni2j0002udcopddkg947'; // پروژه قدیمی

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
        const projectData = projectResponse.data;
        console.log(`✅ اطلاعات پروژه دریافت شد: ${projectData.name}`);
        console.log(`   تعداد کاربران: ${projectData.users.length}`);
        
        if (projectData.users.length === 0) {
          console.log('⚠️ هیچ کاربری در پروژه وجود ندارد');
          return;
        }

        // 3. بررسی داده‌های نمودار
        console.log('\n📈 بررسی داده‌های نمودار...');
        projectData.users.forEach((user: any, index: number) => {
          console.log(`   ${index + 1}. ${user.name}`);
          console.log(`      درصد پیشرفت: ${user.progressPercentage}%`);
          console.log(`      مبلغ پرداختی: ${new Intl.NumberFormat('fa-IR').format(user.totalPaidAmount)} ریال`);
          console.log(`      مبلغ مانده: ${new Intl.NumberFormat('fa-IR').format(user.remainingAmount)} ریال`);
        });

        // 4. بررسی داده‌های نمودار خطی
        console.log('\n📊 داده‌های نمودار خطی:');
        const lineChartData = projectData.users.map((user: any) => ({
          name: user.name,
          paid: user.totalPaidAmount,
          progress: user.progressPercentage,
          remaining: user.remainingAmount
        }));

        lineChartData.forEach((data: any, index: number) => {
          console.log(`   ${index + 1}. ${data.name}: ${new Intl.NumberFormat('fa-IR').format(data.paid)} ریال`);
        });

        // 5. بررسی داده‌های نمودار میله‌ای
        console.log('\n📊 داده‌های نمودار میله‌ای:');
        const barChartData = projectData.users.map((user: any) => ({
          name: user.name,
          progress: user.progressPercentage,
          paid: user.totalPaidAmount,
          remaining: user.remainingAmount
        }));

        barChartData.forEach((data: any, index: number) => {
          console.log(`   ${index + 1}. ${data.name}: ${data.progress}% پیشرفت`);
        });

      } else {
        console.log('❌ خطا در دریافت اطلاعات پروژه');
      }
    } catch (error) {
      console.log('❌ خطا در دریافت اطلاعات پروژه:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
    }

    console.log('\n📝 تغییرات اعمال شده:');
    console.log('   ✅ نمودار میله‌ای پیشرفت پرداخت نصف شد (50% عرض)');
    console.log('   ✅ نمودار خطی مقایسه مبلغ پرداختی اضافه شد (50% عرض)');
    console.log('   ✅ هر دو نمودار کنار هم نمایش داده می‌شوند');
    console.log('   ✅ داده‌های نمودار خطی از مبلغ پرداختی جدول اقساط می‌آید');
    console.log('   ✅ ارتفاع نمودارها به 300px کاهش یافت');

    console.log('\n🎯 برای تست در مرورگر:');
    console.log(`   URL: ${baseUrl}/finance/${projectId}`);
    console.log('   تب: جدول مقایسه‌ای کاربران');
    console.log('   بررسی دو نمودار کنار هم در پایین صفحه');

  } catch (error) {
    console.error('❌ خطای کلی:', error.message);
  }
}

testChartsImprovements();

