import axios from 'axios';

async function testUsersApiDirect() {
  try {
    console.log('🧪 تست مستقیم API کاربران پروژه...\n');

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

    // 2. تست دریافت کاربران پروژه
    console.log('\n👥 تست دریافت کاربران پروژه...');
    try {
      const usersResponse = await axios.get(`${baseUrl}/api/finance/projects/${projectId}/users`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      console.log('✅ کاربران پروژه:', usersResponse.data.length);
      usersResponse.data.forEach((user: any, index: number) => {
        console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.username})`);
        console.log(`      واحدها: ${user.units.map((unit: any) => unit.unitNumber).join(', ')}`);
      });
    } catch (error) {
      console.log('❌ خطا در دریافت کاربران پروژه:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
      console.log('   Message:', error.message);
    }

    // 3. تست دریافت کاربران موجود
    console.log('\n👤 تست دریافت کاربران موجود...');
    try {
      const availableResponse = await axios.get(`${baseUrl}/api/finance/projects/${projectId}/available-users`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      console.log('✅ کاربران موجود:', availableResponse.data.length);
      availableResponse.data.forEach((user: any, index: number) => {
        console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.username}) - ${user.role}`);
      });
    } catch (error) {
      console.log('❌ خطا در دریافت کاربران موجود:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
      console.log('   Message:', error.message);
    }

  } catch (error) {
    console.error('❌ خطای کلی:', error.message);
  }
}

testUsersApiDirect();
