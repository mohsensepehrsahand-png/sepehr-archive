import axios from 'axios';

async function testDeleteProject() {
  try {
    console.log('🧪 تست حذف پروژه...\n');

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

    // 2. بررسی پروژه قبل از حذف
    console.log('\n📊 بررسی پروژه قبل از حذف...');
    try {
      const projectResponse = await axios.get(`${baseUrl}/api/finance/projects/${projectId}`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      if (projectResponse.status === 200) {
        const projectData = projectResponse.data;
        console.log(`✅ پروژه یافت شد: ${projectData.name}`);
        console.log(`   کاربران: ${projectData.users.length}`);
        console.log(`   تعریف‌های اقساط: ${projectData.installmentDefinitions?.length || 0}`);
        
        // بررسی پرداخت‌ها
        const hasPayments = projectData.users.some((user: any) => 
          user.totalPaidAmount > 0
        );
        
        if (hasPayments) {
          console.log('⚠️ پروژه دارای پرداخت است - ممکن است قابل حذف نباشد');
        } else {
          console.log('✅ پروژه بدون پرداخت است - قابل حذف');
        }
      } else {
        console.log('❌ خطا در دریافت اطلاعات پروژه');
        return;
      }
    } catch (error) {
      console.log('❌ خطا در دریافت اطلاعات پروژه:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
      return;
    }

    // 3. تست حذف پروژه
    console.log('\n🗑️ تست حذف پروژه...');
    try {
      const deleteResponse = await axios.delete(`${baseUrl}/api/finance/projects?projectId=${projectId}`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      if (deleteResponse.status === 200) {
        console.log('✅ پروژه با موفقیت حذف شد');
        console.log(`   پیام: ${deleteResponse.data.message}`);
        console.log(`   واحدهای حذف شده: ${deleteResponse.data.deletedUnits}`);
        console.log(`   اقساط حذف شده: ${deleteResponse.data.deletedInstallments}`);
        console.log(`   جریمه‌های حذف شده: ${deleteResponse.data.deletedPenalties}`);
      } else {
        console.log('❌ خطا در حذف پروژه');
      }
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('❌ خطای مورد انتظار:');
        console.log('   پیام:', error.response.data.error);
        console.log('   پیشنهاد:', error.response.data.suggestion);
      } else {
        console.log('❌ خطای غیرمنتظره:');
        console.log('   Status:', error.response?.status);
        console.log('   Data:', error.response?.data);
      }
    }

    // 4. بررسی پروژه بعد از حذف
    console.log('\n🔍 بررسی پروژه بعد از حذف...');
    try {
      const projectResponse = await axios.get(`${baseUrl}/api/finance/projects/${projectId}`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      console.log('❌ پروژه هنوز وجود دارد!');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ پروژه با موفقیت حذف شد (404 Not Found)');
      } else {
        console.log('❌ خطای غیرمنتظره در بررسی پروژه:');
        console.log('   Status:', error.response?.status);
        console.log('   Data:', error.response?.data);
      }
    }

    console.log('\n🎯 برای تست در مرورگر:');
    console.log(`   URL: ${baseUrl}/finance`);
    console.log('   دکمه حذف (🗑️) کنار پروژه');

  } catch (error) {
    console.error('❌ خطای کلی:', error.message);
  }
}

testDeleteProject();
