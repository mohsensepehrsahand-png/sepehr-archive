import axios from 'axios';

async function checkProjectUsers() {
  try {
    console.log('🔍 بررسی کاربران پروژه...\n');

    const baseUrl = 'http://localhost:3001';
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

    // 2. دریافت اطلاعات پروژه
    console.log('\n📊 دریافت اطلاعات پروژه...');
    try {
      const projectResponse = await axios.get(`${baseUrl}/api/finance/projects/${projectId}`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      if (projectResponse.status === 200) {
        const project = projectResponse.data;
        console.log('✅ اطلاعات پروژه:');
        console.log(`   نام پروژه: ${project.name}`);
        console.log(`   تعداد کاربران: ${project.users.length}`);
        
        console.log('\n👥 لیست کاربران:');
        project.users.forEach((user: any, index: number) => {
          console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.username})`);
          console.log(`      ID: ${user.id}`);
          console.log(`      واحد: ${user.unitArea} متر مربع`);
          console.log(`      سهم: ${new Intl.NumberFormat('fa-IR').format(user.shareAmount)} ریال`);
          console.log('');
        });
      } else {
        console.log('❌ خطا در دریافت اطلاعات پروژه');
      }
    } catch (error) {
      console.log('❌ خطا در دریافت اطلاعات پروژه:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
    }

  } catch (error) {
    console.error('❌ خطای کلی:', error.message);
  }
}

checkProjectUsers();







