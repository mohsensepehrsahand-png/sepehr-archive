import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function checkFiscalYears() {
  try {
    console.log("🔍 بررسی سال‌های مالی...");

    const projectId = "cmfpsyers0003udu44o6nlsha"; // احمدنیا

    // Get all fiscal years
    const fiscalYears = await prisma.fiscalYear.findMany({
      where: {
        projectId
      },
      orderBy: {
        year: 'desc'
      }
    });

    console.log(`\n📅 سال‌های مالی (${fiscalYears.length}):`);
    fiscalYears.forEach((fy, index) => {
      console.log(`   ${index + 1}. ${fy.year} - ${fy.isActive ? 'فعال' : 'غیرفعال'} (${fy.id})`);
    });

    // Get current fiscal year
    const currentYear = new Date().getFullYear();
    const currentFiscalYear = await prisma.fiscalYear.findFirst({
      where: {
        projectId,
        year: currentYear,
        isActive: true
      }
    });

    console.log(`\n📅 سال مالی فعلی: ${currentFiscalYear ? currentFiscalYear.year : 'یافت نشد'}`);

    // Get accounts by fiscal year
    const subClassesByFiscalYear = await prisma.accountSubClass.findMany({
      where: {
        projectId,
        isActive: true
      },
      select: {
        fiscalYearId: true,
        code: true,
        name: true
      }
    });

    const fiscalYearCounts = subClassesByFiscalYear.reduce((acc: any, subClass) => {
      const fiscalYearId = subClass.fiscalYearId || 'بدون سال مالی';
      if (!acc[fiscalYearId]) acc[fiscalYearId] = 0;
      acc[fiscalYearId]++;
      return acc;
    }, {});

    console.log("\n📊 معین‌ها بر اساس سال مالی:");
    Object.keys(fiscalYearCounts).forEach(fiscalYearId => {
      const fiscalYear = fiscalYears.find(fy => fy.id === fiscalYearId);
      console.log(`   ${fiscalYear ? fiscalYear.year : 'نامشخص'}: ${fiscalYearCounts[fiscalYearId]} معین`);
    });

  } catch (error) {
    console.error("❌ خطا در بررسی سال‌های مالی:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFiscalYears();
