import axios from 'axios';

async function testNewProject() {
  try {
    console.log('🧪 تست پروژه جدید...\n');

    const baseUrl = 'http://localhost:3000';
    const projectId = 'cmfbd0cqw0001udv0lp8geqy1'; // پروژه تست

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

    // 4. تست افزودن کاربر
    console.log('\n➕ تست افزودن کاربر...');
    try {
      const availableResponse = await axios.get(`${baseUrl}/api/finance/projects/${projectId}/available-users`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      if (availableResponse.data.length > 0) {
        const testUser = availableResponse.data[0];
        const addUserData = {
          userId: testUser.id,
          unitNumber: `TEST-${Date.now()}`,
          area: '100'
        };

        console.log(`   تلاش برای افزودن: ${testUser.firstName} ${testUser.lastName}`);
        console.log(`   شماره واحد: ${addUserData.unitNumber}`);

        const addResponse = await axios.post(`${baseUrl}/api/finance/projects/${projectId}/users`, addUserData, {
          headers: {
            'Cookie': cookies,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ کاربر با موفقیت اضافه شد');
        console.log('   پاسخ:', addResponse.data.message);

        // حذف کاربر تست
        console.log('   حذف کاربر تست...');
        await axios.delete(`${baseUrl}/api/finance/projects/${projectId}/users?userId=${testUser.id}`, {
          headers: {
            'Cookie': cookies
          }
        });
        console.log('✅ کاربر تست حذف شد');
      } else {
        console.log('⚠️ هیچ کاربری برای تست موجود نیست');
      }
    } catch (error) {
      console.log('❌ خطا در افزودن کاربر:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
      console.log('   Message:', error.message);
    }

    console.log('\n🎯 برای تست در مرورگر:');
    console.log(`   URL: ${baseUrl}/finance/${projectId}`);
    console.log('   تب: مدیریت کاربران پروژه');

  } catch (error) {
    console.error('❌ خطای کلی:', error.message);
  }
}

testNewProject();
