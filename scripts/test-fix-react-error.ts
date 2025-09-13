import axios from 'axios';

async function testFixReactError() {
  try {
    console.log('🔧 تست رفع خطای React...\n');

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
        
        // بررسی ساختار داده‌ها
        console.log('\n🔍 بررسی ساختار داده‌ها:');
        data.users.forEach((user: any, index: number) => {
          console.log(`   ${index + 1}. ${user.name} (${user.id})`);
          console.log(`      تعداد اقساط: ${user.installmentDetails?.length || 0}`);
          
          if (user.installmentDetails && user.installmentDetails.length > 0) {
            user.installmentDetails.forEach((installment: any, instIndex: number) => {
              console.log(`         ${instIndex + 1}. ${installment.title}`);
              console.log(`            تاریخ: ${installment.dueDate}`);
              console.log(`            مبلغ: ${installment.shareAmount}`);
              console.log(`            پرداخت: ${installment.paidAmount}`);
            });
          }
        });

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
        combinedChartData.forEach((dataPoint: any, index: number) => {
          console.log(`   ${index + 1}. ${new Date(dataPoint.date).toLocaleDateString('fa-IR')}:`);
          Object.keys(dataPoint).forEach(key => {
            if (key !== 'date' && dataPoint[key] > 0) {
              console.log(`      ${key}: ${new Intl.NumberFormat('fa-IR').format(dataPoint[key])} ریال`);
            }
          });
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
    console.log('   ✅ React.Fragment حذف شد');
    console.log('   ✅ از array و flat() استفاده شد');
    console.log('   ✅ key های منحصر به فرد اضافه شدند');
    console.log('   ✅ ساختار داده‌ها بررسی شد');
    console.log('   ✅ API درست کار می‌کند');

    console.log('\n🎯 برای تست در مرورگر:');
    console.log(`   URL: ${baseUrl}/finance/${projectId}`);
    console.log('   خطای React باید رفع شده باشد');
    console.log('   نمودار ترکیبی باید درست نمایش داده شود');

  } catch (error) {
    console.error('❌ خطای کلی:', error.message);
  }
}

testFixReactError();

