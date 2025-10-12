import { prisma } from '../src/app/api/_lib/db';

async function debugOpeningEntry() {
  try {
    console.log('🔍 بررسی کدینگ‌های قابل استفاده برای سند افتتاحیه...\n');

    const projectId = 'cmfqu2aw10001udjc3chinixh'; // پروژه "تا"

    // Get account classes (level 2 - کل)
    const accountClasses = await prisma.accountClass.findMany({
      where: {
        projectId,
        isActive: true
      },
      include: {
        group: true
      },
      orderBy: {
        code: 'asc'
      }
    });

    console.log(`📂 کل‌ها (${accountClasses.length}):`);
    for (const accountClass of accountClasses) {
      console.log(`   ${accountClass.code} - ${accountClass.name} (گروه: ${accountClass.group.name})`);
    }

    // Get account subclasses (level 3 - معین)
    const accountSubClasses = await prisma.accountSubClass.findMany({
      where: {
        projectId,
        isActive: true
      },
      include: {
        class: {
          include: {
            group: true
          }
        }
      },
      orderBy: {
        code: 'asc'
      }
    });

    console.log(`\n📋 معین‌ها (${accountSubClasses.length}):`);
    for (const subClass of accountSubClasses) {
      console.log(`   ${subClass.code} - ${subClass.name} (کل: ${subClass.class.name})`);
    }

    // Get account details (level 4 - تفصیلی)
    const accountDetails = await prisma.accountDetail.findMany({
      where: {
        projectId,
        isActive: true
      },
      include: {
        subClass: {
          include: {
            class: {
              include: {
                group: true
              }
            }
          }
        }
      },
      orderBy: {
        code: 'asc'
      }
    });

    console.log(`\n📄 تفصیلی‌ها (${accountDetails.length}):`);
    for (const detail of accountDetails) {
      console.log(`   ${detail.code} - ${detail.name} (معین: ${detail.subClass.name})`);
    }

    // Convert to usable accounts format
    console.log('\n🔄 تبدیل به فرمت usable accounts...\n');

    // Convert AccountClass to usable accounts (level 2)
    const usableAccountsFromClasses = accountClasses.map(accountClass => ({
      id: accountClass.id,
      code: accountClass.code,
      name: accountClass.name,
      type: accountClass.group.name,
      level: 2,
      fiscalYearId: accountClass.fiscalYearId,
      fullName: `${accountClass.group.name} - ${accountClass.name}`,
      hasTransactions: false,
      groupId: accountClass.group.id,
      groupName: accountClass.group.name,
      groupCode: accountClass.group.code
    }));

    console.log(`📂 usable accounts from classes (${usableAccountsFromClasses.length}):`);
    for (const account of usableAccountsFromClasses) {
      console.log(`   ${account.code} - ${account.name} (گروه: ${account.groupName})`);
    }

    // Convert AccountSubClass to usable accounts (level 3)
    const usableAccountsFromSubClasses = accountSubClasses.map(subClass => ({
      id: subClass.id,
      code: subClass.code,
      name: subClass.name,
      type: subClass.class.group.name,
      level: 3,
      fiscalYearId: subClass.fiscalYearId,
      fullName: `${subClass.class.group.name} - ${subClass.class.name} - ${subClass.name}`,
      hasTransactions: false,
      groupId: subClass.class.group.id,
      groupName: subClass.class.group.name,
      groupCode: subClass.class.group.code,
      classId: subClass.class.id,
      classCode: subClass.class.code,
      className: subClass.class.name
    }));

    console.log(`\n📋 usable accounts from sub-classes (${usableAccountsFromSubClasses.length}):`);
    for (const account of usableAccountsFromSubClasses) {
      console.log(`   ${account.code} - ${account.name} (کل: ${account.className})`);
    }

    // Convert AccountDetail to usable accounts (level 4)
    const usableAccountsFromDetails = accountDetails.map(detail => ({
      id: detail.id,
      code: detail.code,
      name: detail.name,
      type: detail.subClass.class.group.name,
      level: 4,
      fiscalYearId: detail.fiscalYearId,
      fullName: `${detail.subClass.class.group.name} - ${detail.subClass.class.name} - ${detail.subClass.name} - ${detail.name}`,
      hasTransactions: false,
      groupId: detail.subClass.class.group.id,
      groupName: detail.subClass.class.group.name,
      groupCode: detail.subClass.class.group.code,
      classId: detail.subClass.class.id,
      classCode: detail.subClass.class.code,
      className: detail.subClass.class.name,
      subClassId: detail.subClass.id,
      subClassCode: detail.subClass.code,
      subClassName: detail.subClass.name
    }));

    console.log(`\n📄 usable accounts from details (${usableAccountsFromDetails.length}):`);
    for (const account of usableAccountsFromDetails) {
      console.log(`   ${account.code} - ${account.name} (معین: ${account.subClassName})`);
    }

    // Combine all usable accounts
    const usableAccounts = [
      ...usableAccountsFromClasses,
      ...usableAccountsFromSubClasses,
      ...usableAccountsFromDetails
    ];

    console.log(`\n🎯 مجموع usable accounts: ${usableAccounts.length}`);

    // Test hierarchical structure creation
    console.log('\n🏗️  تست ایجاد ساختار سلسله‌مراتبی...\n');

    // Group accounts by groupCode
    const accountsByGroup = usableAccounts.reduce((acc, account) => {
      const groupCode = account.groupCode;
      if (!acc[groupCode]) {
        acc[groupCode] = [];
      }
      acc[groupCode].push(account);
      return acc;
    }, {} as Record<string, typeof usableAccounts>);

    console.log('📊 گروه‌بندی حساب‌ها:');
    for (const [groupCode, accounts] of Object.entries(accountsByGroup)) {
      console.log(`   گروه ${groupCode}: ${accounts.length} حساب`);
      
      // Group by level
      const byLevel = accounts.reduce((acc, account) => {
        if (!acc[account.level]) {
          acc[account.level] = [];
        }
        acc[account.level].push(account);
        return acc;
      }, {} as Record<number, typeof accounts>);

      for (const [level, levelAccounts] of Object.entries(byLevel)) {
        console.log(`     سطح ${level}: ${levelAccounts.length} حساب`);
        for (const account of levelAccounts) {
          console.log(`       ${account.code} - ${account.name}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ خطا:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugOpeningEntry();
