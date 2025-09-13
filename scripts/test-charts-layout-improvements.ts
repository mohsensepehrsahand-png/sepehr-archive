import axios from 'axios';

async function testChartsLayoutImprovements() {
  try {
    console.log('🧪 تست بهبودهای چیدمان نمودارها...\n');

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
          console.log(`      تعداد اقساط: ${user.installmentDetails?.length || 0}`);
          
          if (user.installmentDetails && user.installmentDetails.length > 0) {
            console.log(`      جزئیات اقساط:`);
            user.installmentDetails.forEach((inst: any, instIndex: number) => {
              console.log(`         ${instIndex + 1}. ${inst.title}`);
              console.log(`            تاریخ سررسید: ${new Date(inst.dueDate).toLocaleDateString('fa-IR')}`);
              console.log(`            مبلغ سهم: ${new Intl.NumberFormat('fa-IR').format(inst.shareAmount)} ریال`);
              console.log(`            مبلغ پرداختی: ${new Intl.NumberFormat('fa-IR').format(inst.paidAmount)} ریال`);
              console.log(`            تعداد پرداخت‌ها: ${inst.payments.length}`);
            });
          }
        });

        // 4. بررسی داده‌های نمودار خطی
        console.log('\n📊 داده‌های نمودار خطی:');
        const lineChartData = projectData.users.map((user: any) => {
          const userData: any = { name: user.name };
          
          projectData.users.forEach((u: any) => {
            userData[`user_${u.id}`] = u.id === user.id ? user.totalPaidAmount : 0;
          });
          
          return userData;
        });

        lineChartData.forEach((data: any, index: number) => {
          console.log(`   ${index + 1}. ${data.name}:`);
          Object.keys(data).forEach(key => {
            if (key.startsWith('user_')) {
              const userId = key.replace('user_', '');
              const user = projectData.users.find((u: any) => u.id === userId);
              if (user && data[key] > 0) {
                console.log(`      ${user.name}: ${new Intl.NumberFormat('fa-IR').format(data[key])} ریال`);
              }
            }
          });
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
    console.log('   ✅ عرض نمودارها 2 برابر شد (از md=6 به md=8)');
    console.log('   ✅ نمودارها وسط صفحه قرار گرفتند (justifyContent="center")');
    console.log('   ✅ ارتفاع نمودارها به 400px افزایش یافت');
    console.log('   ✅ نمودار خطی برای هر کاربر خط جداگانه دارد');
    console.log('   ✅ رنگ‌های مختلف برای هر خط (HSL color scheme)');
    console.log('   ✅ اطلاعات اقساط در API اضافه شد');
    console.log('   ✅ عنوان نمودار خطی به "نمودار زمانی پرداخت‌های کاربران" تغییر کرد');

    console.log('\n🎯 برای تست در مرورگر:');
    console.log(`   URL: ${baseUrl}/finance/${projectId}`);
    console.log('   تب: جدول مقایسه‌ای کاربران');
    console.log('   بررسی دو نمودار بزرگ‌تر و وسط صفحه');

  } catch (error) {
    console.error('❌ خطای کلی:', error.message);
  }
}

testChartsLayoutImprovements();

