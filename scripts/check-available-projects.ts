import axios from 'axios';

async function checkAvailableProjects() {
  try {
    console.log('🔍 بررسی پروژه‌های موجود در سیستم...\n');

    const baseUrl = 'http://localhost:3000';

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

    // 2. دریافت لیست پروژه‌ها
    console.log('\n📋 دریافت لیست پروژه‌ها...');
    try {
      const projectsResponse = await axios.get(`${baseUrl}/api/finance/projects`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      if (projectsResponse.status === 200) {
        const projects = projectsResponse.data;
        console.log(`✅ ${projects.length} پروژه یافت شد:`);
        
        if (projects.length === 0) {
          console.log('⚠️ هیچ پروژه‌ای در سیستم وجود ندارد');
          console.log('\n💡 راه‌حل:');
          console.log('   1. یک پروژه جدید ایجاد کنید');
          console.log('   2. یا از اسکریپت create-test-project.ts استفاده کنید');
          return;
        }

        projects.forEach((project: any, index: number) => {
          console.log(`\n${index + 1}. ${project.name}`);
          console.log(`   ID: ${project.id}`);
          console.log(`   وضعیت: ${project.status}`);
          console.log(`   تاریخ ایجاد: ${new Date(project.createdAt).toLocaleDateString('fa-IR')}`);
          console.log(`   تعداد واحدها: ${project.units?.length || 0}`);
          
          if (project.units && project.units.length > 0) {
            console.log(`   کاربران:`);
            project.units.forEach((unit: any, unitIndex: number) => {
              const userName = `${unit.user?.firstName || ''} ${unit.user?.lastName || ''}`.trim() || unit.user?.username || 'نامشخص';
              console.log(`      ${unitIndex + 1}. ${userName} (${unit.unitNumber})`);
            });
          }
        });

        console.log('\n🎯 برای تست نمودارها:');
        console.log(`   URL: ${baseUrl}/finance/${projects[0].id}`);
        console.log(`   پروژه: ${projects[0].name}`);

      } else {
        console.log('❌ خطا در دریافت لیست پروژه‌ها');
        console.log('   Status:', projectsResponse.status);
        console.log('   Data:', projectsResponse.data);
      }
    } catch (error) {
      console.log('❌ خطا در دریافت لیست پروژه‌ها:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
    }

    // 3. بررسی پروژه‌های قدیمی
    console.log('\n🔍 بررسی پروژه‌های قدیمی...');
    const oldProjectIds = [
      'cmfa8ni2j0002udcopddkg947', // پروژه قدیمی
      'cmf5w5h7m0001ud5k5kldwvrj', // پروژه تست
      'cmf3lz69g0001ud8ol92fjnln'  // پروژه دیگر
    ];

    for (const projectId of oldProjectIds) {
      try {
        const projectResponse = await axios.get(`${baseUrl}/api/finance/projects/${projectId}`, {
          headers: {
            'Cookie': cookies
          }
        });
        
        if (projectResponse.status === 200) {
          const project = projectResponse.data.project;
          console.log(`✅ پروژه قدیمی یافت شد: ${project.name} (${projectId})`);
        } else {
          console.log(`❌ پروژه قدیمی یافت نشد: ${projectId}`);
        }
      } catch (error) {
        console.log(`❌ خطا در بررسی پروژه ${projectId}: ${error.response?.status}`);
      }
    }

  } catch (error) {
    console.error('❌ خطای کلی:', error.message);
  }
}

checkAvailableProjects();

