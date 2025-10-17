/**
 * اسکریپت جامع تست امنیت
 * اجرای تمام تست‌های امنیتی و ارائه گزارش کامل
 */

import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

interface TestCategory {
  category: string;
  icon: string;
  results: TestResult[];
  passed: number;
  failed: number;
  total: number;
}

// رنگ‌ها برای خروجی ترمینال
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function printHeader() {
  console.log('\n' + '='.repeat(80));
  console.log(colors.bright + colors.cyan + '🔐 تست جامع امنیت سیستم' + colors.reset);
  console.log('='.repeat(80) + '\n');
  console.log('این اسکریپت تمام جنبه‌های امنیتی سیستم را تست می‌کند:');
  console.log('  • احراز هویت (Authentication)');
  console.log('  • کنترل دسترسی (Authorization)');
  console.log('  • محافظت در برابر Brute Force');
  console.log('  • سیستم دسترسی به منابع (Permissions)');
  console.log('  • تنظیمات امنیتی (Settings API)');
  console.log('\n' + '='.repeat(80) + '\n');
}

function printTestCategory(category: string, icon: string) {
  console.log('\n' + '─'.repeat(80));
  console.log(colors.bright + colors.blue + `${icon} ${category}` + colors.reset);
  console.log('─'.repeat(80));
}

function printTestResult(result: TestResult, index: number) {
  const status = result.passed 
    ? colors.green + '✓ PASS' + colors.reset
    : colors.red + '✗ FAIL' + colors.reset;
  
  console.log(`  ${index}. ${status} - ${result.name}`);
  
  if (result.passed) {
    console.log(`     ${colors.green}→${colors.reset} ${result.message}`);
  } else {
    console.log(`     ${colors.red}→${colors.reset} ${result.message}`);
    if (result.details) {
      console.log(`     ${colors.yellow}📋 جزئیات:${colors.reset}`, JSON.stringify(result.details, null, 2));
    }
  }
}

function printSummary(categories: TestCategory[]) {
  console.log('\n' + '='.repeat(80));
  console.log(colors.bright + colors.magenta + '📊 خلاصه نتایج' + colors.reset);
  console.log('='.repeat(80) + '\n');

  let totalPassed = 0;
  let totalFailed = 0;
  let totalTests = 0;

  categories.forEach(cat => {
    const passRate = cat.total > 0 ? ((cat.passed / cat.total) * 100).toFixed(1) : '0';
    const statusColor = cat.failed === 0 ? colors.green : cat.failed < cat.passed ? colors.yellow : colors.red;
    
    console.log(`${cat.icon} ${colors.bright}${cat.category}${colors.reset}`);
    console.log(`   ${statusColor}${cat.passed}/${cat.total} تست موفق (${passRate}%)${colors.reset}`);
    if (cat.failed > 0) {
      console.log(`   ${colors.red}${cat.failed} تست ناموفق${colors.reset}`);
    }
    console.log('');

    totalPassed += cat.passed;
    totalFailed += cat.failed;
    totalTests += cat.total;
  });

  console.log('─'.repeat(80));
  
  const overallPassRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0';
  const overallColor = totalFailed === 0 ? colors.green : totalFailed < totalPassed ? colors.yellow : colors.red;
  
  console.log(colors.bright + '\n🎯 نتیجه کلی:' + colors.reset);
  console.log(`   ${overallColor}${totalPassed}/${totalTests} تست موفق (${overallPassRate}%)${colors.reset}`);
  
  if (totalFailed > 0) {
    console.log(`   ${colors.red}${totalFailed} تست ناموفق${colors.reset}`);
    console.log(`\n${colors.yellow}⚠️  لطفاً تست‌های ناموفق را بررسی و رفع کنید.${colors.reset}`);
  } else {
    console.log(`\n${colors.green}✓ همه تست‌ها با موفقیت انجام شدند!${colors.reset}`);
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

function printRecommendations(categories: TestCategory[]) {
  const failedTests = categories.flatMap(cat => 
    cat.results.filter(r => !r.passed)
  );

  if (failedTests.length === 0) {
    return;
  }

  console.log('\n' + '='.repeat(80));
  console.log(colors.bright + colors.yellow + '💡 پیشنهادات بهبود' + colors.reset);
  console.log('='.repeat(80) + '\n');

  const recommendations = new Set<string>();

  failedTests.forEach(test => {
    if (test.name.includes('Admin')) {
      recommendations.add('• بررسی کنترل دسترسی Admin در API ها');
    }
    if (test.name.includes('IP')) {
      recommendations.add('• بررسی سیستم بلاک IP و لیست سیاه');
    }
    if (test.name.includes('تلاش')) {
      recommendations.add('• بررسی سیستم محدودیت تلاش ورود');
    }
    if (test.name.includes('Permission') || test.name.includes('دسترسی')) {
      recommendations.add('• بررسی سیستم Permission و دسترسی‌ها');
    }
    if (test.name.includes('Settings') || test.name.includes('تنظیمات')) {
      recommendations.add('• بررسی API تنظیمات و محافظت آن');
    }
  });

  recommendations.forEach(rec => {
    console.log(colors.yellow + rec + colors.reset);
  });

  console.log('\n' + '='.repeat(80) + '\n');
}

async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    console.log(colors.green + '✓ اتصال به دیتابیس برقرار شد' + colors.reset);
    return true;
  } catch (error) {
    console.error(colors.red + '✗ خطا در اتصال به دیتابیس:' + colors.reset, error);
    return false;
  }
}

async function checkServerRunning(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3000/api/health');
    if (response.ok) {
      console.log(colors.green + '✓ سرور در حال اجرا است' + colors.reset);
      return true;
    }
    console.error(colors.red + '✗ سرور پاسخ نمی‌دهد' + colors.reset);
    return false;
  } catch (error) {
    console.error(colors.red + '✗ سرور در حال اجرا نیست. لطفاً ابتدا سرور را اجرا کنید:' + colors.reset);
    console.log(colors.yellow + '   npm run dev' + colors.reset);
    return false;
  }
}

async function runAllTests(): Promise<TestCategory[]> {
  const categories: TestCategory[] = [];

  // تست 1: احراز هویت
  printTestCategory('تست‌های احراز هویت (Authentication)', '🔐');
  try {
    const { runAuthenticationTests } = await import('./test-security-auth');
    const authResults = await runAuthenticationTests();
    
    authResults.forEach((result, index) => {
      printTestResult(result, index + 1);
    });

    categories.push({
      category: 'احراز هویت (Authentication)',
      icon: '🔐',
      results: authResults,
      passed: authResults.filter(r => r.passed).length,
      failed: authResults.filter(r => !r.passed).length,
      total: authResults.length
    });
  } catch (error) {
    console.error(colors.red + 'خطا در اجرای تست‌های احراز هویت:' + colors.reset, error);
  }

  // تست 2: کنترل دسترسی
  printTestCategory('تست‌های کنترل دسترسی (Authorization)', '🛡️');
  try {
    const { runAuthorizationTests } = await import('./test-security-authorization');
    const authzResults = await runAuthorizationTests();
    
    authzResults.forEach((result, index) => {
      printTestResult(result, index + 1);
    });

    categories.push({
      category: 'کنترل دسترسی (Authorization)',
      icon: '🛡️',
      results: authzResults,
      passed: authzResults.filter(r => r.passed).length,
      failed: authzResults.filter(r => !r.passed).length,
      total: authzResults.length
    });
  } catch (error) {
    console.error(colors.red + 'خطا در اجرای تست‌های کنترل دسترسی:' + colors.reset, error);
  }

  // تست 3: محافظت Brute Force
  printTestCategory('تست‌های محافظت در برابر Brute Force', '🔒');
  try {
    const { runBruteForceTests } = await import('./test-security-bruteforce');
    const bruteForceResults = await runBruteForceTests();
    
    bruteForceResults.forEach((result, index) => {
      printTestResult(result, index + 1);
    });

    categories.push({
      category: 'محافظت در برابر Brute Force',
      icon: '🔒',
      results: bruteForceResults,
      passed: bruteForceResults.filter(r => r.passed).length,
      failed: bruteForceResults.filter(r => !r.passed).length,
      total: bruteForceResults.length
    });
  } catch (error) {
    console.error(colors.red + 'خطا در اجرای تست‌های Brute Force:' + colors.reset, error);
  }

  // تست 4: دسترسی به منابع
  printTestCategory('تست‌های دسترسی به منابع (Resources)', '📁');
  try {
    const { runResourceAccessTests } = await import('./test-security-resources');
    const resourceResults = await runResourceAccessTests();
    
    resourceResults.forEach((result, index) => {
      printTestResult(result, index + 1);
    });

    categories.push({
      category: 'دسترسی به منابع (Resources)',
      icon: '📁',
      results: resourceResults,
      passed: resourceResults.filter(r => r.passed).length,
      failed: resourceResults.filter(r => !r.passed).length,
      total: resourceResults.length
    });
  } catch (error) {
    console.error(colors.red + 'خطا در اجرای تست‌های دسترسی به منابع:' + colors.reset, error);
  }

  // تست 5: تنظیمات امنیتی
  printTestCategory('تست‌های Settings API', '⚙️');
  try {
    const { runSettingsTests } = await import('./test-security-settings');
    const settingsResults = await runSettingsTests();
    
    settingsResults.forEach((result, index) => {
      printTestResult(result, index + 1);
    });

    categories.push({
      category: 'تنظیمات امنیتی (Settings)',
      icon: '⚙️',
      results: settingsResults,
      passed: settingsResults.filter(r => r.passed).length,
      failed: settingsResults.filter(r => !r.passed).length,
      total: settingsResults.length
    });
  } catch (error) {
    console.error(colors.red + 'خطا در اجرای تست‌های تنظیمات:' + colors.reset, error);
  }

  return categories;
}

async function main() {
  printHeader();

  console.log(colors.bright + '🔍 بررسی پیش‌نیازها...\n' + colors.reset);

  // بررسی اتصال دیتابیس
  const dbConnected = await checkDatabaseConnection();
  if (!dbConnected) {
    console.error(colors.red + '\n❌ نمی‌توان بدون اتصال به دیتابیس تست‌ها را اجرا کرد.' + colors.reset);
    process.exit(1);
  }

  // بررسی سرور
  const serverRunning = await checkServerRunning();
  if (!serverRunning) {
    console.error(colors.red + '\n❌ نمی‌توان بدون سرور در حال اجرا تست‌ها را اجرا کرد.' + colors.reset);
    process.exit(1);
  }

  console.log(colors.green + '\n✓ همه پیش‌نیازها برقرار است. شروع تست‌ها...\n' + colors.reset);

  // اجرای تست‌ها
  const startTime = Date.now();
  const categories = await runAllTests();
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // نمایش خلاصه
  printSummary(categories);

  // نمایش پیشنهادات
  printRecommendations(categories);

  console.log(colors.cyan + `⏱️  زمان اجرا: ${duration} ثانیه` + colors.reset);
  console.log('');

  // بستن اتصال دیتابیس
  await prisma.$disconnect();

  // تعیین کد خروج بر اساس نتیجه
  const totalFailed = categories.reduce((sum, cat) => sum + cat.failed, 0);
  process.exit(totalFailed > 0 ? 1 : 0);
}

// اجرای اسکریپت
main().catch(error => {
  console.error(colors.red + '\n❌ خطای غیرمنتظره:' + colors.reset, error);
  process.exit(1);
});

