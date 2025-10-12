import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function checkAccountsFiscalYear() {
  try {
    console.log("🔍 بررسی سال مالی حساب‌ها...");

    const projectId = "cmfpsyers0003udu44o6nlsha"; // احمدنیا

    // Get all subclasses
    const subClasses = await prisma.accountSubClass.findMany({
      where: {
        projectId,
        isActive: true
      },
      select: {
        id: true,
        code: true,
        name: true,
        fiscalYearId: true
      },
      take: 10
    });

    console.log(`\n📋 نمونه معین‌ها (${subClasses.length}):`);
    subClasses.forEach((subClass, index) => {
      console.log(`   ${index + 1}. ${subClass.code} - ${subClass.name}`);
      console.log(`      سال مالی: ${subClass.fiscalYearId || 'ندارد'}`);
    });

    // Get all details
    const details = await prisma.accountDetail.findMany({
      where: {
        projectId,
        isActive: true
      },
      select: {
        id: true,
        code: true,
        name: true,
        fiscalYearId: true
      },
      take: 10
    });

    console.log(`\n📄 نمونه تفصیلی‌ها (${details.length}):`);
    details.forEach((detail, index) => {
      console.log(`   ${index + 1}. ${detail.code} - ${detail.name}`);
      console.log(`      سال مالی: ${detail.fiscalYearId || 'ندارد'}`);
    });

  } catch (error) {
    console.error("❌ خطا در بررسی سال مالی حساب‌ها:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAccountsFiscalYear();
