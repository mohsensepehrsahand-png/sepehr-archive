import axios from 'axios';

async function testCombinedUserCharts() {
  try {
    console.log('🧪 تست نمودار ترکیبی کاربران...\n');

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

        // 3. بررسی داده‌های نمودار ترکیبی
        console.log('\n📈 بررسی داده‌های نمودار ترکیبی:');
        
        const allDates = new Set<string>();
        const userDataMap: { [userId: string]: { [date: string]: { amount: number, paidAmount: number, title: string } } } = {};
        
        data.users.forEach((user: any) => {
          userDataMap[user.id] = {};
          
          if (user.installmentDetails) {
            user.installmentDetails.forEach((installment: any) => {
              const date = installment.dueDate;
              allDates.add(date);
              userDataMap[user.id][date] = {
                amount: installment.shareAmount,
                paidAmount: installment.paidAmount,
                title: installment.title
              };
            });
          }
        });
        
        // Create combined chart data
        const sortedDates = Array.from(allDates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        const combinedChartData = sortedDates.map(date => {
          const dataPoint: any = { date };
          
          data.users.forEach((user: any) => {
            const userData = userDataMap[user.id][date];
            if (userData) {
              dataPoint[`${user.name}_amount`] = userData.amount;
              dataPoint[`${user.name}_paid`] = userData.paidAmount;
            } else {
              dataPoint[`${user.name}_amount`] = 0;
              dataPoint[`${user.name}_paid`] = 0;
            }
          });
          
          return dataPoint;
        });

        console.log(`   تعداد تاریخ‌های منحصر به فرد: ${sortedDates.length}`);
        sortedDates.forEach((date, index) => {
          console.log(`   ${index + 1}. ${new Date(date).toLocaleDateString('fa-IR')}`);
        });

        console.log('\n📊 داده‌های نمودار ترکیبی:');
        combinedChartData.forEach((dataPoint: any, index: number) => {
          console.log(`\n📅 ${index + 1}. ${new Date(dataPoint.date).toLocaleDateString('fa-IR')}:`);
          
          data.users.forEach((user: any) => {
            const amount = dataPoint[`${user.name}_amount`];
            const paid = dataPoint[`${user.name}_paid`];
            
            if (amount > 0 || paid > 0) {
              console.log(`   👤 ${user.name}:`);
              console.log(`      مبلغ قسط: ${new Intl.NumberFormat('fa-IR').format(amount)} ریال`);
              console.log(`      مبلغ پرداختی: ${new Intl.NumberFormat('fa-IR').format(paid)} ریال`);
            }
          });
        });

        // 4. بررسی خط‌های نمودار
        console.log('\n🎨 خط‌های نمودار:');
        data.users.forEach((user: any, index: number) => {
          const hue1 = index * 60;
          const hue2 = index * 60 + 30;
          const color1 = `hsl(${hue1}, 70%, 50%)`;
          const color2 = `hsl(${hue2}, 70%, 50%)`;
          
          console.log(`   ${user.name}:`);
          console.log(`      مبلغ قسط: ${color1} (Hue: ${hue1}°)`);
          console.log(`      مبلغ پرداختی: ${color2} (Hue: ${hue2}°)`);
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
    console.log('   ✅ نمودار مقایسه‌ای پیشرفت: md=6 (50% عرض)');
    console.log('   ✅ نمودار ترکیبی کاربران: md=6 (50% عرض)');
    console.log('   ✅ همه کاربران در یک نمودار واحد');
    console.log('   ✅ محور X: تاریخ سررسید اقساط');
    console.log('   ✅ محور Y: مبلغ قسط (ریال)');
    console.log('   ✅ دو خط برای هر کاربر: مبلغ قسط و مبلغ پرداختی');
    console.log('   ✅ رنگ‌های متفاوت برای هر کاربر');
    console.log('   ✅ Legend برای نمایش نام خط‌ها');
    console.log('   ✅ Tooltip با فرمت فارسی');

    console.log('\n🎯 برای تست در مرورگر:');
    console.log(`   URL: ${baseUrl}/finance/${projectId}`);
    console.log('   تب: جدول مقایسه‌ای کاربران');
    console.log('   بررسی دو نمودار کنار هم:');
    console.log('   - نمودار میله‌ای پیشرفت (چپ)');
    console.log('   - نمودار ترکیبی اقساط کاربران (راست)');

  } catch (error) {
    console.error('❌ خطای کلی:', error.message);
  }
}

testCombinedUserCharts();

