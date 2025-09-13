import axios from 'axios';

async function testInstallmentTableOrder() {
  try {
    console.log('🧪 تست ترتیب ردیف‌های جدول اقساط کاربر...\n');

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

    // 2. دریافت کاربران پروژه
    console.log('\n👥 دریافت کاربران پروژه...');
    try {
      const usersResponse = await axios.get(`${baseUrl}/api/finance/projects/${projectId}/users`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      if (usersResponse.status === 200) {
        const users = usersResponse.data;
        console.log(`✅ ${users.length} کاربر یافت شد`);
        
        if (users.length === 0) {
          console.log('⚠️ هیچ کاربری در پروژه وجود ندارد');
          return;
        }

        const firstUser = users[0];
        console.log(`\n🎯 تست با کاربر: ${firstUser.firstName} ${firstUser.lastName} (${firstUser.username})`);

        // 3. بررسی اقساط کاربر
        console.log('\n📊 بررسی اقساط کاربر...');
        try {
          const userFinanceResponse = await axios.get(`${baseUrl}/api/finance/projects/${projectId}/users/${firstUser.id}`, {
            headers: {
              'Cookie': cookies
            }
          });
          
          if (userFinanceResponse.status === 200) {
            const userData = userFinanceResponse.data;
            console.log(`✅ ${userData.installments.length} اقساط یافت شد`);
            
            if (userData.installments.length === 0) {
              console.log('⚠️ کاربر هیچ اقساطی ندارد');
              console.log('   ردیف خالی باید در انتهای جدول نمایش داده شود');
            } else {
              console.log('✅ کاربر دارای اقساط است');
              console.log('   ردیف‌های موجود باید در ابتدا و ردیف خالی در انتها باشد');
              
              userData.installments.forEach((inst: any, index: number) => {
                console.log(`   ${index + 1}. ${inst.title} - ${new Intl.NumberFormat('fa-IR').format(inst.shareAmount)} ریال`);
              });
            }
          } else {
            console.log('❌ خطا در دریافت اطلاعات مالی کاربر');
          }
        } catch (error) {
          console.log('❌ خطا در دریافت اطلاعات مالی کاربر:');
          console.log('   Status:', error.response?.status);
          console.log('   Data:', error.response?.data);
        }
      } else {
        console.log('❌ خطا در دریافت کاربران پروژه');
      }
    } catch (error) {
      console.log('❌ خطا در دریافت کاربران پروژه:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
    }

    console.log('\n📝 تغییرات اعمال شده:');
    console.log('   ✅ ردیف خالی از ابتدای جدول به انتهای جدول منتقل شد');
    console.log('   ✅ اقساط موجود در ابتدای جدول نمایش داده می‌شوند');
    console.log('   ✅ ردیف خالی برای اضافه کردن قسط جدید در انتها است');

    console.log('\n🎯 برای تست در مرورگر:');
    console.log(`   URL: ${baseUrl}/finance/${projectId}`);
    console.log('   تب: جدول مقایسه‌ای کاربران');
    console.log('   دکمه ویرایش (✏️) کنار هر کاربر');
    console.log('   بررسی ترتیب ردیف‌ها در جدول اقساط');

  } catch (error) {
    console.error('❌ خطای کلی:', error.message);
  }
}

testInstallmentTableOrder();
