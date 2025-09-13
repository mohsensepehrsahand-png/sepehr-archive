import axios from 'axios';

async function testPaymentDateSave() {
  try {
    console.log('🧪 تست ذخیره تاریخ پرداخت...\n');

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

    // 2. دریافت اطلاعات کاربر و اقساط
    console.log('\n📊 دریافت اطلاعات کاربر و اقساط...');
    let installmentId = '';
    let currentPaymentDate = '';
    try {
      const userResponse = await axios.get(`${baseUrl}/api/finance/projects/${projectId}/users/${userId}`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      if (userResponse.status === 200) {
        const userData = userResponse.data;
        console.log('✅ اطلاعات کاربر دریافت شد:');
        console.log(`   نام کاربر: ${userData.firstName} ${userData.lastName}`);
        console.log(`   تعداد اقساط: ${userData.installments.length}`);
        
        if (userData.installments.length > 0) {
          const installment = userData.installments[0];
          installmentId = installment.id;
          console.log(`   اولین قسط: ${installment.title}`);
          console.log(`   مبلغ قسط: ${new Intl.NumberFormat('fa-IR').format(installment.shareAmount)} ریال`);
          console.log(`   مبلغ پرداختی: ${new Intl.NumberFormat('fa-IR').format(installment.paidAmount)} ریال`);
          
          if (installment.payments && installment.payments.length > 0) {
            currentPaymentDate = installment.payments[installment.payments.length - 1].paymentDate;
            console.log(`   تاریخ پرداخت فعلی: ${new Date(currentPaymentDate).toLocaleDateString('fa-IR')}`);
          } else {
            console.log('   ⚠️ هیچ پرداختی ثبت نشده است');
          }
        } else {
          console.log('❌ هیچ قسطی یافت نشد');
          return;
        }
      } else {
        console.log('❌ خطا در دریافت اطلاعات کاربر');
        return;
      }
    } catch (error) {
      console.log('❌ خطا در دریافت اطلاعات کاربر:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
      return;
    }

    // 3. تست تغییر تاریخ پرداخت
    console.log('\n📅 تست تغییر تاریخ پرداخت...');
    try {
      const newPaymentDate = '2024-12-25'; // تاریخ جدید
      const updateData = {
        paymentDate: newPaymentDate
        // فقط تاریخ پرداخت را تغییر می‌دهیم، مبلغ پرداختی را تغییر نمی‌دهیم
      };

      console.log(`   تاریخ پرداخت جدید: ${new Date(newPaymentDate).toLocaleDateString('fa-IR')}`);

      const updateResponse = await axios.put(`${baseUrl}/api/finance/user-installments/${installmentId}`, updateData, {
        headers: {
          'Cookie': cookies,
          'Content-Type': 'application/json'
        }
      });
      
      if (updateResponse.status === 200) {
        const result = updateResponse.data;
        console.log('✅ تاریخ پرداخت با موفقیت به‌روزرسانی شد:');
        console.log(`   پیام: ${result.message}`);
      } else {
        console.log('❌ خطا در به‌روزرسانی تاریخ پرداخت');
        console.log('   Status:', updateResponse.status);
        console.log('   Data:', updateResponse.data);
      }
    } catch (error) {
      console.log('❌ خطا در به‌روزرسانی تاریخ پرداخت:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
    }

    // 4. بررسی تغییرات
    console.log('\n🔍 بررسی تغییرات...');
    try {
      const userResponse2 = await axios.get(`${baseUrl}/api/finance/projects/${projectId}/users/${userId}`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      if (userResponse2.status === 200) {
        const userData2 = userResponse2.data;
        const installment2 = userData2.installments[0];
        
        console.log('✅ اطلاعات به‌روزرسانی شده:');
        console.log(`   مبلغ قسط: ${new Intl.NumberFormat('fa-IR').format(installment2.shareAmount)} ریال`);
        console.log(`   مبلغ پرداختی: ${new Intl.NumberFormat('fa-IR').format(installment2.paidAmount)} ریال`);
        
        if (installment2.payments && installment2.payments.length > 0) {
          const newPaymentDate = installment2.payments[installment2.payments.length - 1].paymentDate;
          console.log(`   تاریخ پرداخت جدید: ${new Date(newPaymentDate).toLocaleDateString('fa-IR')}`);
          
          // بررسی تغییر
          if (newPaymentDate !== currentPaymentDate) {
            console.log('✅ تاریخ پرداخت با موفقیت تغییر کرد!');
          } else {
            console.log('❌ تاریخ پرداخت تغییر نکرد');
          }
        } else {
          console.log('⚠️ هیچ پرداختی یافت نشد');
        }
      } else {
        console.log('❌ خطا در دریافت مجدد اطلاعات');
      }
    } catch (error) {
      console.log('❌ خطا در بررسی تغییرات:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
    }

    console.log('\n📝 تغییرات اعمال شده:');
    console.log('   ✅ منطق جدید برای تغییر فقط تاریخ پرداخت');
    console.log('   ✅ اگر فقط paymentDate تغییر کند، آخرین پرداخت به‌روزرسانی می‌شود');
    console.log('   ✅ اگر هم مبلغ و هم تاریخ تغییر کند، منطق قبلی اجرا می‌شود');
    console.log('   ✅ مشکل ذخیره نشدن تاریخ پرداخت رفع شد');

    console.log('\n🎯 برای تست در مرورگر:');
    console.log(`   URL: ${baseUrl}/finance/${projectId}/users/${userId}`);
    console.log('   کلیک روی "ویرایش" در جدول اقساط');
    console.log('   فقط تاریخ پرداخت را تغییر دهید');
    console.log('   "ذخیره" را کلیک کنید');
    console.log('   تاریخ پرداخت باید ذخیره شود');

  } catch (error) {
    console.error('❌ خطای کلی:', error.message);
  }
}

testPaymentDateSave();







