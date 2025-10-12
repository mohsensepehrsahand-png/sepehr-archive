import fetch from 'node-fetch';

async function testApiDirect() {
  try {
    console.log("🔍 تست مستقیم API...");

    const projectId = "cmfpsyers0003udu44o6nlsha";
    const response = await fetch(`http://localhost:3000/api/accounting/opening-entry/usable-accounts?projectId=${projectId}`);

    if (!response.ok) {
      throw new Error(`خطا در درخواست API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ پاسخ API دریافت شد:");
    console.log(`📊 تعداد حساب‌ها: ${data.accounts?.length || 0}`);
    
    if (data.accounts && data.accounts.length > 0) {
      console.log("\n📋 نمونه حساب‌ها:");
      data.accounts.slice(0, 5).forEach((account: any, index: number) => {
        console.log(`   ${index + 1}. ${account.code} - ${account.name} (سطح: ${account.level}, گروه: ${account.groupCode})`);
      });
    }

    console.log("\n🔍 اطلاعات debug:");
    console.log(`   totalAccountSubClasses: ${data.debug?.totalAccountSubClasses || 0}`);
    console.log(`   totalAccountDetails: ${data.debug?.totalAccountDetails || 0}`);
    console.log(`   usableFromSubClasses: ${data.debug?.usableFromSubClasses || 0}`);
    console.log(`   usableFromDetails: ${data.debug?.usableFromDetails || 0}`);

  } catch (error: any) {
    console.error("❌ خطا در تست API:", error.message);
  }
}

testApiDirect();
