import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function restoreAccounts() {
  try {
    console.log("🔍 بازیابی حساب‌ها...");

    const projectId = "cmfpsyers0003udu44o6nlsha"; // احمدنیا
    const sourceProjectId = "cmfqu2aw10001udjc3chinixh"; // تا

    // Get current fiscal year
    const currentYear = new Date().getFullYear();
    const fiscalYear = await prisma.fiscalYear.findFirst({
      where: {
        projectId,
        year: currentYear,
        isActive: true
      }
    });

    if (!fiscalYear) {
      console.log("❌ سال مالی فعلی یافت نشد");
      return;
    }

    console.log(`📅 سال مالی فعلی: ${fiscalYear.year} (${fiscalYear.id})`);

    // Get source project's subclasses
    const sourceSubClasses = await prisma.accountSubClass.findMany({
      where: {
        projectId: sourceProjectId,
        isActive: true
      },
      include: {
        class: {
          include: {
            group: true
          }
        }
      }
    });

    console.log(`📋 معین‌های منبع: ${sourceSubClasses.length}`);

    // Get target project's groups and classes
    const targetGroups = await prisma.accountGroup.findMany({
      where: { projectId }
    });

    const targetClasses = await prisma.accountClass.findMany({
      where: { projectId }
    });

    console.log(`📁 گروه‌های هدف: ${targetGroups.length}`);
    console.log(`📂 کل‌های هدف: ${targetClasses.length}`);

    // Create subclasses
    for (const sourceSubClass of sourceSubClasses) {
      // Find matching group
      const targetGroup = targetGroups.find(g => g.code === sourceSubClass.class.group.code);
      if (!targetGroup) {
        console.log(`⚠️  گروه ${sourceSubClass.class.group.code} یافت نشد`);
        continue;
      }

      // Find matching class
      const targetClass = targetClasses.find(c => c.code === sourceSubClass.class.code && c.groupId === targetGroup.id);
      if (!targetClass) {
        console.log(`⚠️  کل ${sourceSubClass.class.code} یافت نشد`);
        continue;
      }

      // Create subclass
      await prisma.accountSubClass.create({
        data: {
          projectId,
          fiscalYearId: fiscalYear.id,
          classId: targetClass.id,
          code: sourceSubClass.code,
          name: sourceSubClass.name,
          isActive: true
        }
      });

      console.log(`✅ معین ${sourceSubClass.code} - ${sourceSubClass.name} ایجاد شد`);
    }

    // Get source project's details
    const sourceDetails = await prisma.accountDetail.findMany({
      where: {
        projectId: sourceProjectId,
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
      }
    });

    console.log(`📄 تفصیلی‌های منبع: ${sourceDetails.length}`);

    // Get target project's subclasses
    const targetSubClasses = await prisma.accountSubClass.findMany({
      where: { projectId }
    });

    // Create details
    for (const sourceDetail of sourceDetails) {
      // Find matching subclass
      const targetSubClass = targetSubClasses.find(sc => 
        sc.code === sourceDetail.subClass.code && 
        sc.class.code === sourceDetail.subClass.class.code
      );
      
      if (!targetSubClass) {
        console.log(`⚠️  معین ${sourceDetail.subClass.code} یافت نشد`);
        continue;
      }

      // Create detail
      await prisma.accountDetail.create({
        data: {
          projectId,
          fiscalYearId: fiscalYear.id,
          subClassId: targetSubClass.id,
          code: sourceDetail.code,
          name: sourceDetail.name,
          isActive: true
        }
      });

      console.log(`✅ تفصیلی ${sourceDetail.code} - ${sourceDetail.name} ایجاد شد`);
    }

    console.log("\n✅ بازیابی حساب‌ها تکمیل شد");

  } catch (error) {
    console.error("❌ خطا در بازیابی حساب‌ها:", error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreAccounts();
