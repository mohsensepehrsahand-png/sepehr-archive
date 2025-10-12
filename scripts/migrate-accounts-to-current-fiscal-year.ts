import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function migrateAccountsToCurrentFiscalYear() {
  try {
    console.log("🔍 انتقال حساب‌ها به سال مالی فعلی...");

    const projectId = "cmfpsyers0003udu44o6nlsha"; // احمدنیا
    const currentYear = new Date().getFullYear();

    // Get current fiscal year
    const currentFiscalYear = await prisma.fiscalYear.findFirst({
      where: {
        projectId,
        year: currentYear,
        isActive: true
      }
    });

    if (!currentFiscalYear) {
      console.log("❌ سال مالی فعلی یافت نشد");
      return;
    }

    console.log(`📅 سال مالی فعلی: ${currentFiscalYear.year} (${currentFiscalYear.id})`);

    // Get all subclasses that don't have current fiscal year
    const subClassesToMigrate = await prisma.accountSubClass.findMany({
      where: {
        projectId,
        isActive: true,
        fiscalYearId: {
          not: currentFiscalYear.id
        }
      }
    });

    console.log(`📋 معین‌های قابل انتقال: ${subClassesToMigrate.length}`);

    // Migrate subclasses
    for (const subClass of subClassesToMigrate) {
      await prisma.accountSubClass.update({
        where: { id: subClass.id },
        data: { fiscalYearId: currentFiscalYear.id }
      });
      console.log(`   ✅ معین ${subClass.code} - ${subClass.name} منتقل شد`);
    }

    // Get all details that don't have current fiscal year
    const detailsToMigrate = await prisma.accountDetail.findMany({
      where: {
        projectId,
        isActive: true,
        fiscalYearId: {
          not: currentFiscalYear.id
        }
      }
    });

    console.log(`📄 تفصیلی‌های قابل انتقال: ${detailsToMigrate.length}`);

    // Migrate details
    for (const detail of detailsToMigrate) {
      await prisma.accountDetail.update({
        where: { id: detail.id },
        data: { fiscalYearId: currentFiscalYear.id }
      });
      console.log(`   ✅ تفصیلی ${detail.code} - ${detail.name} منتقل شد`);
    }

    console.log("\n✅ انتقال حساب‌ها تکمیل شد");

  } catch (error) {
    console.error("❌ خطا در انتقال حساب‌ها:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateAccountsToCurrentFiscalYear();
