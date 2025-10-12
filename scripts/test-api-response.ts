import fetch from 'node-fetch';

async function testAPIResponse() {
  try {
    console.log("🔍 تست پاسخ API...");
    
    // Test the API endpoint
    const response = await fetch('http://localhost:3000/api/accounting/opening-entry/usable-accounts?projectId=cmfpsyers0003udu44o6nlsha');
    
    if (!response.ok) {
      console.error('❌ خطا در درخواست API:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    
    console.log("\n📊 آمار کلی:");
    console.log(`   تعداد کل حساب‌ها: ${data.totalCount}`);
    console.log(`   شناسه سال مالی: ${data.fiscalYearId}`);
    
    console.log("\n🔍 اطلاعات Debug:");
    console.log(`   حساب‌های از جدول Account: ${data.debug.totalAccountsFromTable}`);
    console.log(`   کل‌ها (Classes): ${data.debug.totalAccountClasses}`);
    console.log(`   معین‌ها (Sub-Classes): ${data.debug.totalAccountSubClasses}`);
    console.log(`   تفصیلی‌ها (Details): ${data.debug.totalAccountDetails}`);
    console.log(`   حساب‌های قابل استفاده: ${data.debug.usableAccounts}`);
    console.log(`   قابل استفاده از کل‌ها: ${data.debug.usableFromClasses}`);
    console.log(`   قابل استفاده از معین‌ها: ${data.debug.usableFromSubClasses}`);
    console.log(`   قابل استفاده از تفصیلی‌ها: ${data.debug.usableFromDetails}`);
    
    console.log("\n📋 نمونه حساب‌ها:");
    data.accounts.slice(0, 10).forEach((account: any, index: number) => {
      console.log(`   ${index + 1}. ${account.code} - ${account.name} (سطح: ${account.level}, گروه: ${account.groupName})`);
    });
    
    console.log("\n🏗️  گروه‌بندی حساب‌ها:");
    const groupedByLevel = data.accounts.reduce((acc: any, account: any) => {
      const level = account.level;
      if (!acc[level]) acc[level] = [];
      acc[level].push(account);
      return acc;
    }, {});
    
    Object.keys(groupedByLevel).forEach(level => {
      console.log(`   سطح ${level}: ${groupedByLevel[level].length} حساب`);
    });
    
  } catch (error) {
    console.error("❌ خطا در تست API:", error);
  }
}

testAPIResponse();
