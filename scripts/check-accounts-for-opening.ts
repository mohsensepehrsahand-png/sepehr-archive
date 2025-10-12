import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function checkAccountsForOpening() {
  try {
    console.log("🔍 بررسی حساب‌های مناسب برای سند افتتاحیه...");

    const projectId = "cmfpsyers0003udu44o6nlsha"; // احمدنیا

    // Get current fiscal year
    const currentYear = new Date().getFullYear();
    const fiscalYear = await prisma.fiscalYear.findFirst({
      where: {
        projectId,
        year: currentYear,
        isActive: true
      }
    });

    console.log(`\n📅 سال مالی فعلی: ${fiscalYear ? fiscalYear.year : 'یافت نشد'}`);
    console.log(`   شناسه سال مالی: ${fiscalYear?.id || 'ندارد'}`);

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

    console.log(`\n📋 معین‌ها (سطح 3) - ${accountSubClasses.length} حساب:`);
    accountSubClasses.forEach((subClass, index) => {
      console.log(`   ${index + 1}. ${subClass.code} - ${subClass.name}`);
      console.log(`      کل: ${subClass.class.code} - ${subClass.class.name}`);
      console.log(`      گروه: ${subClass.class.group.code} - ${subClass.class.group.name}`);
      console.log(`      سال مالی: ${subClass.fiscalYearId}`);
      console.log('');
    });

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

    console.log(`\n📄 تفصیلی‌ها (سطح 4) - ${accountDetails.length} حساب:`);
    accountDetails.forEach((detail, index) => {
      console.log(`   ${index + 1}. ${detail.code} - ${detail.name}`);
      console.log(`      معین: ${detail.subClass.code} - ${detail.subClass.name}`);
      console.log(`      کل: ${detail.subClass.class.code} - ${detail.subClass.class.name}`);
      console.log(`      گروه: ${detail.subClass.class.group.code} - ${detail.subClass.class.group.name}`);
      console.log(`      سال مالی: ${detail.fiscalYearId}`);
      console.log('');
    });

    // Group by fiscal year
    const subClassesByFiscalYear = accountSubClasses.reduce((acc: any, subClass) => {
      const fiscalYearId = subClass.fiscalYearId || 'بدون سال مالی';
      if (!acc[fiscalYearId]) acc[fiscalYearId] = [];
      acc[fiscalYearId].push(subClass);
      return acc;
    }, {});

    const detailsByFiscalYear = accountDetails.reduce((acc: any, detail) => {
      const fiscalYearId = detail.fiscalYearId || 'بدون سال مالی';
      if (!acc[fiscalYearId]) acc[fiscalYearId] = [];
      acc[fiscalYearId].push(detail);
      return acc;
    }, {});

    console.log("\n📊 گروه‌بندی بر اساس سال مالی:");
    Object.keys(subClassesByFiscalYear).forEach(fiscalYearId => {
      console.log(`   سال مالی ${fiscalYearId}:`);
      console.log(`     معین‌ها: ${subClassesByFiscalYear[fiscalYearId].length}`);
      console.log(`     تفصیلی‌ها: ${detailsByFiscalYear[fiscalYearId]?.length || 0}`);
    });

  } catch (error) {
    console.error("❌ خطا در بررسی حساب‌ها:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAccountsForOpening();
