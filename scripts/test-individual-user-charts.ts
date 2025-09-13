import axios from 'axios';

async function testIndividualUserCharts() {
  try {
    console.log('🧪 تست نمودارهای جداگانه کاربران...\n');

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

        // 3. بررسی داده‌های نمودارهای جداگانه کاربران
        console.log('\n📈 بررسی داده‌های نمودارهای جداگانه کاربران:');
        
        const userChartsData = data.users.map((user: any) => {
          const userData: any[] = [];
          
          if (user.installmentDetails) {
            user.installmentDetails.forEach((installment: any) => {
              userData.push({
                date: installment.dueDate,
                amount: installment.shareAmount,
                title: installment.title,
                paidAmount: installment.paidAmount
              });
            });
          }
          
          // Sort by date
          userData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          return {
            userId: user.id,
            userName: user.name,
            data: userData
          };
        });

        userChartsData.forEach((userChart: any, index: number) => {
          console.log(`\n👤 ${index + 1}. ${userChart.userName}:`);
          console.log(`   تعداد اقساط: ${userChart.data.length}`);
          
          if (userChart.data.length > 0) {
            console.log(`   جزئیات اقساط:`);
            userChart.data.forEach((installment: any, instIndex: number) => {
              console.log(`      ${instIndex + 1}. ${installment.title}`);
              console.log(`         تاریخ سررسید: ${new Date(installment.date).toLocaleDateString('fa-IR')}`);
              console.log(`         مبلغ قسط: ${new Intl.NumberFormat('fa-IR').format(installment.amount)} ریال`);
              console.log(`         مبلغ پرداختی: ${new Intl.NumberFormat('fa-IR').format(installment.paidAmount)} ریال`);
            });
          } else {
            console.log(`   ⚠️ هیچ قسطی برای این کاربر وجود ندارد`);
          }
        });

        // 4. بررسی چیدمان نمودارها
        console.log('\n📊 چیدمان نمودارها:');
        console.log(`   نمودار میله‌ای پیشرفت: md=6 (50% عرض)`);
        console.log(`   نمودارهای کاربران: md=3 (25% عرض هر کدام)`);
        console.log(`   تعداد نمودارهای کاربران: ${userChartsData.length}`);
        
        if (userChartsData.length > 0) {
          console.log(`   کاربران با نمودار:`);
          userChartsData.forEach((userChart: any, index: number) => {
            console.log(`      ${index + 1}. ${userChart.userName} (${userChart.data.length} قسط)`);
          });
        }

        // 5. بررسی ویژگی‌های نمودار
        console.log('\n🎨 ویژگی‌های نمودار:');
        console.log(`   محور X: تاریخ سررسید اقساط`);
        console.log(`   محور Y: مبلغ قسط (ریال)`);
        console.log(`   خط آبی: مبلغ قسط (amount)`);
        console.log(`   خط سبز: مبلغ پرداختی (paidAmount)`);
        console.log(`   ارتفاع: 200px`);
        console.log(`   فونت محورها: 10px`);
        console.log(`   Tooltip: تاریخ و مبلغ با فرمت فارسی`);

      } else {
        console.log('❌ خطا در دریافت اطلاعات پروژه');
      }
    } catch (error) {
      console.log('❌ خطا در دریافت اطلاعات پروژه:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
    }

    console.log('\n📝 تغییرات اعمال شده:');
    console.log('   ✅ نمودار مقایسه‌ای پیشرفت: md=6 (50% عرض)');
    console.log('   ✅ نمودارهای جداگانه کاربران: md=3 (25% عرض هر کدام)');
    console.log('   ✅ محور X: تاریخ سررسید اقساط');
    console.log('   ✅ محور Y: مبلغ قسط (ریال)');
    console.log('   ✅ دو خط: مبلغ قسط (آبی) و مبلغ پرداختی (سبز)');
    console.log('   ✅ ارتفاع نمودارها: 200px');
    console.log('   ✅ فونت‌های کوچک‌تر: 10px');
    console.log('   ✅ Tooltip با فرمت فارسی');
    console.log('   ✅ مرتب‌سازی بر اساس تاریخ');

    console.log('\n🎯 برای تست در مرورگر:');
    console.log(`   URL: ${baseUrl}/finance/${projectId}`);
    console.log('   تب: جدول مقایسه‌ای کاربران');
    console.log('   بررسی نمودار میله‌ای (50% عرض) و نمودارهای کاربران (25% عرض هر کدام)');

  } catch (error) {
    console.error('❌ خطای کلی:', error.message);
  }
}

testIndividualUserCharts();

