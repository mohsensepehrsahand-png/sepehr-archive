import axios from 'axios';

async function testInstallmentFormImprovements() {
  try {
    console.log('🧪 تست بهبودهای فرم اقساط کاربر...\n');

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

    // 2. دریافت تعریف‌های اقساط
    console.log('\n📋 دریافت تعریف‌های اقساط...');
    try {
      const definitionsResponse = await axios.get(`${baseUrl}/api/finance/projects/${projectId}/installment-definitions`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      if (definitionsResponse.status === 200) {
        const definitions = definitionsResponse.data;
        console.log(`✅ ${definitions.length} تعریف قسط دریافت شد`);
        
        definitions.forEach((def: any, index: number) => {
          console.log(`   ${index + 1}. ${def.title}`);
          console.log(`      تاریخ سررسید: ${new Date(def.dueDate).toLocaleDateString('fa-IR')}`);
          console.log(`      مبلغ: ${new Intl.NumberFormat('fa-IR').format(def.amount)} ریال`);
        });

        if (definitions.length === 0) {
          console.log('\n⚠️ هیچ تعریف قسطی وجود ندارد');
          console.log('   ابتدا در تب "مدیریت انواع قسط" تعریف‌های اقساط را ایجاد کنید');
        }
      } else {
        console.log('❌ خطا در دریافت تعریف‌های اقساط');
      }
    } catch (error) {
      console.log('❌ خطا در دریافت تعریف‌های اقساط:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
    }

    // 3. دریافت کاربران پروژه
    console.log('\n👥 دریافت کاربران پروژه...');
    try {
      const usersResponse = await axios.get(`${baseUrl}/api/finance/projects/${projectId}/users`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      if (usersResponse.status === 200) {
        const users = usersResponse.data;
        console.log(`✅ ${users.length} کاربر دریافت شد`);
        
        users.forEach((user: any, index: number) => {
          console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.username})`);
        });

        if (users.length > 0) {
          const firstUser = users[0];
          console.log(`\n🎯 برای تست فرم اقساط:`);
          console.log(`   URL: ${baseUrl}/finance/${projectId}/users/${firstUser.id}`);
          console.log(`   کاربر: ${firstUser.firstName} ${firstUser.lastName}`);
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
    console.log('   ✅ نوع قسط به بالای فرم منتقل شد');
    console.log('   ✅ انتخاب نوع قسط، مبلغ قسط را به صورت پیش‌فرض پر می‌کند');
    console.log('   ✅ انتخاب نوع قسط، عنوان و تاریخ سررسید را پر می‌کند');
    console.log('   ✅ گزینه "ایجاد قسط جدید" برای قسط‌های سفارشی');

    console.log('\n🎯 برای تست در مرورگر:');
    console.log(`   URL: ${baseUrl}/finance/${projectId}`);
    console.log('   تب: جدول مقایسه‌ای کاربران');
    console.log('   دکمه ویرایش (✏️) کنار هر کاربر');

  } catch (error) {
    console.error('❌ خطای کلی:', error.message);
  }
}

testInstallmentFormImprovements();
