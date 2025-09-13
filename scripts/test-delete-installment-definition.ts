import axios from 'axios';

async function testDeleteInstallmentDefinition() {
  try {
    console.log('🧪 تست حذف تعریف قسط...\n');

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
          console.log(`   ${index + 1}. ${def.title} (${def.id})`);
        });

        if (definitions.length > 0) {
          // 3. تست حذف اولین تعریف
          const firstDefinition = definitions[0];
          console.log(`\n🗑️ تست حذف تعریف: ${firstDefinition.title}...`);
          
          try {
            const deleteResponse = await axios.delete(`${baseUrl}/api/finance/projects/${projectId}/installment-definitions?installmentDefinitionId=${firstDefinition.id}`, {
              headers: {
                'Cookie': cookies
              }
            });
            
            if (deleteResponse.status === 200) {
              console.log('✅ تعریف قسط با موفقیت حذف شد');
              console.log('   پاسخ:', deleteResponse.data.message);
            } else {
              console.log('❌ خطا در حذف تعریف قسط');
            }
          } catch (deleteError) {
            if (deleteError.response?.status === 400) {
              console.log('❌ خطای مورد انتظار:');
              console.log('   پیام:', deleteError.response.data.error);
              console.log('   تعداد اقساط کاربری:', deleteError.response.data.userInstallmentsCount);
            } else {
              console.log('❌ خطای غیرمنتظره:');
              console.log('   Status:', deleteError.response?.status);
              console.log('   Data:', deleteError.response?.data);
            }
          }
        } else {
          console.log('❌ هیچ تعریف قسطی برای تست وجود ندارد');
        }
      } else {
        console.log('❌ خطا در دریافت تعریف‌های اقساط');
      }
    } catch (error) {
      console.log('❌ خطا در دریافت تعریف‌های اقساط:');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
    }

    console.log('\n🎯 برای تست در مرورگر:');
    console.log(`   URL: ${baseUrl}/finance/${projectId}`);
    console.log('   تب: مدیریت انواع قسط');

  } catch (error) {
    console.error('❌ خطای کلی:', error.message);
  }
}

testDeleteInstallmentDefinition();
