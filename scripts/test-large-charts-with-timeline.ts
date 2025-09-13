import axios from 'axios';

async function testLargeChartsWithTimeline() {
  try {
    console.log('🧪 تست نمودارهای بزرگ با محور زمانی...\n');

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

        // 3. بررسی داده‌های نمودار خطی جدید
        console.log('\n📈 بررسی داده‌های نمودار خطی زمانی...');
        
        const allPayments: any[] = [];
        
        projectData.users.forEach((user: any) => {
          if (user.installmentDetails) {
            console.log(`\n👤 ${user.name}:`);
            user.installmentDetails.forEach((installment: any, instIndex: number) => {
              console.log(`   📋 ${instIndex + 1}. ${installment.title}`);
              console.log(`      تاریخ سررسید: ${new Date(installment.dueDate).toLocaleDateString('fa-IR')}`);
              console.log(`      مبلغ سهم: ${new Intl.NumberFormat('fa-IR').format(installment.shareAmount)} ریال`);
              console.log(`      مبلغ پرداختی: ${new Intl.NumberFormat('fa-IR').format(installment.paidAmount)} ریال`);
              console.log(`      تعداد پرداخت‌ها: ${installment.payments.length}`);
              
              installment.payments.forEach((payment: any, payIndex: number) => {
                console.log(`         💰 ${payIndex + 1}. ${new Date(payment.paymentDate).toLocaleDateString('fa-IR')}: ${new Intl.NumberFormat('fa-IR').format(payment.amount)} ریال`);
                if (payment.description) {
                  console.log(`            توضیحات: ${payment.description}`);
                }
                
                allPayments.push({
                  paymentDate: payment.paymentDate,
                  user: user.name,
                  userId: user.id,
                  amount: payment.amount,
                  installmentTitle: installment.title,
                  description: payment.description
                });
              });
            });
          }
        });

        // 4. مرتب‌سازی و گروه‌بندی پرداخت‌ها
        console.log('\n📅 مرتب‌سازی پرداخت‌ها بر اساس تاریخ...');
        allPayments.sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());
        
        console.log(`   تعداد کل پرداخت‌ها: ${allPayments.length}`);
        allPayments.forEach((payment, index) => {
          console.log(`   ${index + 1}. ${new Date(payment.paymentDate).toLocaleDateString('fa-IR')} - ${payment.user}: ${new Intl.NumberFormat('fa-IR').format(payment.amount)} ریال (${payment.installmentTitle})`);
        });

        // 5. گروه‌بندی بر اساس تاریخ
        console.log('\n📊 گروه‌بندی پرداخت‌ها بر اساس تاریخ...');
        const dateGroups: { [key: string]: any } = {};
        allPayments.forEach(payment => {
          const dateKey = payment.paymentDate;
          if (!dateGroups[dateKey]) {
            dateGroups[dateKey] = { paymentDate: dateKey };
            // Initialize all users with 0
            projectData.users.forEach((u: any) => {
              dateGroups[dateKey][`user_${u.id}`] = 0;
            });
          }
          dateGroups[dateKey][`user_${payment.userId}`] = payment.amount;
        });

        const lineChartData = Object.values(dateGroups);
        console.log(`   تعداد نقاط داده در نمودار: ${lineChartData.length}`);
        
        lineChartData.forEach((data: any, index: number) => {
          console.log(`   📅 ${index + 1}. ${new Date(data.paymentDate).toLocaleDateString('fa-IR')}:`);
          Object.keys(data).forEach(key => {
            if (key.startsWith('user_') && data[key] > 0) {
              const userId = key.replace('user_', '');
              const user = projectData.users.find((u: any) => u.id === userId);
              if (user) {
                console.log(`      ${user.name}: ${new Intl.NumberFormat('fa-IR').format(data[key])} ریال`);
              }
            }
          });
        });

        // 6. بررسی رنگ‌بندی کاربران
        console.log('\n🎨 رنگ‌بندی کاربران در نمودار:');
        projectData.users.forEach((user: any, index: number) => {
          const hue = index * 60;
          const color = `hsl(${hue}, 70%, 50%)`;
          console.log(`   ${user.name}: ${color} (Hue: ${hue}°)`);
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
    console.log('   ✅ عرض نمودارها به 100% افزایش یافت (xs=12)');
    console.log('   ✅ ارتفاع نمودارها به 500px افزایش یافت');
    console.log('   ✅ فونت‌های محورها بزرگ‌تر شدند (14px)');
    console.log('   ✅ نمودار خطی شامل محور تاریخ (X) و مبلغ (Y) شد');
    console.log('   ✅ داده‌های نمودار بر اساس تاریخ پرداخت‌ها مرتب شدند');
    console.log('   ✅ هر کاربر خط جداگانه با رنگ متفاوت دارد');
    console.log('   ✅ Tooltip شامل تاریخ و مبلغ پرداخت است');
    console.log('   ✅ نام کاربران در Tooltip نمایش داده می‌شود');
    console.log('   ✅ margin راست نمودار خطی برای legend افزایش یافت (100px)');

    console.log('\n🎯 برای تست در مرورگر:');
    console.log(`   URL: ${baseUrl}/finance/${projectId}`);
    console.log('   تب: جدول مقایسه‌ای کاربران');
    console.log('   بررسی دو نمودار بزرگ و کامل در پایین صفحه');
    console.log('   نمودار خطی باید تاریخ‌ها را در محور X و مبالغ را در محور Y نشان دهد');

  } catch (error) {
    console.error('❌ خطای کلی:', error.message);
  }
}

testLargeChartsWithTimeline();

