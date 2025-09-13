import axios from 'axios';

async function testProjectUsersFilter() {
  try {
    console.log('🧪 تست فیلتر کردن مدیر از لیست کاربران پروژه...\n');

    const baseUrl = 'http://localhost:3000';
    const projectId = 'cmfbd0cqw0001udv0lp8geqy1'; // پروژه جدید

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

    // 2. تست دریافت اطلاعات پروژه
    console.log('\n📊 تست دریافت اطلاعات پروژه...');
    try {
      const projectResponse = await axios.get(`${baseUrl}/api/finance/projects/${projectId}`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      if (projectResponse.status === 200) {
        const projectData = projectResponse.data;
        console.log('✅ اطلاعات پروژه دریافت شد');
        console.log(`   نام پروژه: ${projectData.name}`);
        console.log(`   تعداد کاربران: ${projectData.users.length}`);
        
        console.log('\n👥 لیست کاربران:');
        projectData.users.forEach((user: any, index: number) => {
          console.log(`   ${index + 1}. ${user.name} (ID: ${user.id})`);
          console.log(`      سهم کل: ${new Intl.NumberFormat('fa-IR').format(user.totalShareAmount)} ریال`);
          console.log(`      پرداختی: ${new Intl.NumberFormat('fa-IR').format(user.totalPaidAmount)} ریال`);
          console.log(`      پیشرفت: ${user.progressPercentage}%`);
        });

        // Check if admin is in the list
        const adminInList = projectData.users.some((user: any) => 
          user.name.toLowerCase().includes('admin') || 
          user.id === 'cmfaeocxp000iudwwm6q920t8' // Admin user ID
        );

        if (adminInList) {
          console.log('\n❌ مدیر هنوز در لیست است!');
        } else {
          console.log('\n✅ مدیر از لیست حذف شده است!');
        }

      } else {
        console.log('❌ خطا در دریافت اطلاعات پروژه');
      }
    } catch (error) {
      console.log('❌ خطا در دریافت اطلاعات پروژه:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
    }

    console.log('\n🎯 برای تست در مرورگر:');
    console.log(`   URL: ${baseUrl}/finance/${projectId}`);
    console.log('   تب: جدول مقایسه‌ای کاربران');

  } catch (error) {
    console.error('❌ خطای کلی:', error.message);
  }
}

testProjectUsersFilter();
