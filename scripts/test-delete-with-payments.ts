import axios from 'axios';

async function testDeleteWithPayments() {
  try {
    console.log('🧪 تست حذف کاربر با پرداخت...\n');

    const baseUrl = 'http://localhost:3000';
    const projectId = 'cmfa8ni2j0002udcopddkg947'; // پروژه قدیمی
    const userId = 'cmfaeocxp000iudwwm6q920t8'; // علی رضایی

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

    // 2. تست حذف کاربر (باید خطا بدهد)
    console.log('\n🗑️ تست حذف کاربر با پرداخت...');
    try {
      const deleteResponse = await axios.delete(`${baseUrl}/api/finance/projects/${projectId}/users?userId=${userId}`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      console.log('❌ انتظار خطا بود اما موفق شد!');
    } catch (error) {
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        console.log('✅ خطای مورد انتظار دریافت شد');
        console.log('   پیام:', errorData.error);
        console.log('   تعداد پرداخت‌ها:', errorData.paymentCount);
        console.log('   مجموع مبلغ:', new Intl.NumberFormat('fa-IR').format(errorData.totalAmount));
        console.log('   جزئیات پرداخت‌ها:');
        errorData.payments.forEach((payment: any, index: number) => {
          console.log(`     ${index + 1}. ${new Date(payment.date).toLocaleDateString('fa-IR')}: ${new Intl.NumberFormat('fa-IR').format(payment.amount)} ریال`);
        });
      } else {
        console.log('❌ خطای غیرمنتظره:', error.response?.data || error.message);
      }
    }

    // 3. تست حذف کامل (clear payments)
    console.log('\n🧹 تست حذف کامل اطلاعات مالی...');
    try {
      const clearResponse = await axios.delete(`${baseUrl}/api/finance/projects/${projectId}/users/${userId}/clear-payments`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      console.log('✅ اطلاعات مالی با موفقیت حذف شد');
      console.log('   پاسخ:', clearResponse.data.message);
      console.log('   حذف شده:');
      console.log(`     - ${clearResponse.data.deletedPayments} پرداخت`);
      console.log(`     - ${clearResponse.data.deletedPenalties} جریمه`);
      console.log(`     - ${clearResponse.data.deletedInstallments} قسط`);
      console.log(`     - ${clearResponse.data.deletedUnits} واحد`);
    } catch (error) {
      console.log('❌ خطا در حذف اطلاعات مالی:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
      console.log('   Message:', error.message);
    }

    console.log('\n🎯 برای تست در مرورگر:');
    console.log(`   URL: ${baseUrl}/finance/${projectId}`);
    console.log('   تب: مدیریت کاربران پروژه');
    console.log('   دکمه حذف کنار کاربر علی رضایی');

  } catch (error) {
    console.error('❌ خطای کلی:', error.message);
  }
}

testDeleteWithPayments();
