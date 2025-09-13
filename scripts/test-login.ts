async function testLogin() {
  try {
    console.log('🔐 تست ورود کاربر admin...');
    
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ ورود موفق!');
      console.log('📋 اطلاعات کاربر:');
      console.log(`   نام کاربری: ${data.user.username}`);
      console.log(`   نام: ${data.user.firstName} ${data.user.lastName}`);
      console.log(`   نقش: ${data.user.role}`);
      console.log(`   ایمیل: ${data.user.email || 'تعریف نشده'}`);
      console.log(`   وضعیت: ${data.user.isActive ? 'فعال' : 'غیرفعال'}`);
    } else {
      console.log('❌ خطا در ورود:');
      console.log(`   کد خطا: ${response.status}`);
      console.log(`   پیام: ${data.error || 'خطای نامشخص'}`);
    }
    
  } catch (error) {
    console.error('❌ خطا در تست ورود:', error);
  }
}

testLogin();
