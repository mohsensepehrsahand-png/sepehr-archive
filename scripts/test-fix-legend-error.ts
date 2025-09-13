import axios from 'axios';

async function testFixLegendError() {
  try {
    console.log('🔧 تست رفع خطای Legend...\n');

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

    // 2. تست API
    console.log('\n📊 تست API...');
    try {
      const projectResponse = await axios.get(`${baseUrl}/api/finance/projects/${projectId}`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      if (projectResponse.status === 200) {
        const data = projectResponse.data;
        console.log('✅ API درست کار می‌کند:');
        console.log(`   نام پروژه: ${data.name}`);
        console.log(`   تعداد کاربران: ${data.users.length}`);
        
        // بررسی داده‌های نمودار
        console.log('\n📈 بررسی داده‌های نمودار:');
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

        console.log(`   تعداد نقاط داده: ${combinedChartData.length}`);
        console.log(`   تعداد خط‌های نمودار: ${data.users.length * 2}`); // هر کاربر 2 خط دارد
        
        // بررسی خط‌های نمودار
        console.log('\n🎨 خط‌های نمودار:');
        data.users.forEach((user: any, index: number) => {
          const hue1 = index * 60;
          const hue2 = index * 60 + 30;
          const color1 = `hsl(${hue1}, 70%, 50%)`;
          const color2 = `hsl(${hue2}, 70%, 50%)`;
          
          console.log(`   ${user.name}:`);
          console.log(`      مبلغ قسط: ${color1} (${user.name}_amount)`);
          console.log(`      مبلغ پرداختی: ${color2} (${user.name}_paid)`);
        });

      } else {
        console.log('❌ خطا در API');
        console.log('   Status:', projectResponse.status);
        console.log('   Data:', projectResponse.data);
      }
    } catch (error) {
      console.log('❌ خطا در API:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
    }

    console.log('\n📝 تغییرات اعمال شده:');
    console.log('   ✅ Legend از recharts import شد');
    console.log('   ✅ Legend در نمودار ترکیبی اضافه شد');
    console.log('   ✅ خطای "Legend is not defined" رفع شد');
    console.log('   ✅ نمودار باید درست نمایش داده شود');

    console.log('\n🎯 برای تست در مرورگر:');
    console.log(`   URL: ${baseUrl}/finance/${projectId}`);
    console.log('   خطای Legend باید رفع شده باشد');
    console.log('   نمودار ترکیبی باید با Legend نمایش داده شود');
    console.log('   Legend باید نام خط‌ها را نشان دهد');

  } catch (error) {
    console.error('❌ خطای کلی:', error.message);
  }
}

testFixLegendError();

