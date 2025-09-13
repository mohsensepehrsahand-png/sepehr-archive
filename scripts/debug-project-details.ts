import axios from 'axios';

async function debugProjectDetails() {
  try {
    console.log('🔍 بررسی جزئیات پروژه...\n');

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

    // 2. بررسی پروژه در دیتابیس
    console.log('\n📊 بررسی پروژه در دیتابیس...');
    try {
      const projectResponse = await axios.get(`${baseUrl}/api/finance/projects/${projectId}`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      if (projectResponse.status === 200) {
        const data = projectResponse.data;
        console.log('✅ جزئیات پروژه دریافت شد:');
        console.log(`   نام: ${data.project?.name}`);
        console.log(`   وضعیت: ${data.project?.status}`);
        console.log(`   تعداد کاربران: ${data.users?.length || 0}`);
        console.log(`   خلاصه: ${JSON.stringify(data.summary, null, 2)}`);
        
        if (data.users && data.users.length > 0) {
          console.log('\n👥 کاربران:');
          data.users.forEach((user: any, index: number) => {
            console.log(`   ${index + 1}. ${user.name}`);
            console.log(`      پیشرفت: ${user.progressPercentage}%`);
            console.log(`      پرداختی: ${new Intl.NumberFormat('fa-IR').format(user.totalPaidAmount)} ریال`);
          });
        } else {
          console.log('⚠️ هیچ کاربری در پروژه وجود ندارد');
        }
      } else {
        console.log('❌ خطا در دریافت جزئیات پروژه');
        console.log('   Status:', projectResponse.status);
        console.log('   Data:', projectResponse.data);
      }
    } catch (error) {
      console.log('❌ خطا در دریافت جزئیات پروژه:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
      console.log('   Message:', error.message);
    }

    // 3. بررسی مستقیم API
    console.log('\n🔧 بررسی مستقیم API...');
    try {
      const directResponse = await axios.get(`${baseUrl}/api/finance/projects/${projectId}`, {
        headers: {
          'Cookie': cookies
        },
        validateStatus: () => true // Accept all status codes
      });
      
      console.log(`   Status: ${directResponse.status}`);
      console.log(`   Headers: ${JSON.stringify(directResponse.headers, null, 2)}`);
      console.log(`   Data: ${JSON.stringify(directResponse.data, null, 2)}`);
      
    } catch (error) {
      console.log('❌ خطا در بررسی مستقیم API:');
      console.log('   Error:', error.message);
    }

    // 4. بررسی سرور
    console.log('\n🖥️ بررسی سرور...');
    try {
      const healthResponse = await axios.get(`${baseUrl}/api/health`);
      console.log('✅ سرور در حال اجرا است');
      console.log('   Status:', healthResponse.status);
      console.log('   Data:', healthResponse.data);
    } catch (error) {
      console.log('❌ سرور در حال اجرا نیست یا خطا دارد');
      console.log('   Error:', error.message);
    }

  } catch (error) {
    console.error('❌ خطای کلی:', error.message);
  }
}

debugProjectDetails();

