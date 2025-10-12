import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function testFrontendData() {
  try {
    console.log("🔍 تست داده‌های frontend...");

    const projectId = "cmfpsyers0003udu44o6nlsha"; // احمدنیا
    const currentYear = new Date().getFullYear();

    // Get current fiscal year
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

    // Get account subclasses (level 3 - معین) - only from current fiscal year
    const accountSubClasses = await prisma.accountSubClass.findMany({
      where: {
        projectId,
        isActive: true,
        fiscalYearId: fiscalYear.id
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
    
    // Group by group code
    const subClassesByGroup = accountSubClasses.reduce((acc: any, subClass) => {
      const groupCode = subClass.class.group.code;
      if (!acc[groupCode]) acc[groupCode] = [];
      acc[groupCode].push(subClass);
      return acc;
    }, {});

    Object.keys(subClassesByGroup).forEach(groupCode => {
      console.log(`\n🏷️  گروه ${groupCode} - ${subClassesByGroup[groupCode][0].class.group.name}:`);
      subClassesByGroup[groupCode].forEach((subClass: any, index: number) => {
        console.log(`   ${index + 1}. ${subClass.code} - ${subClass.name}`);
        console.log(`      کل: ${subClass.class.code} - ${subClass.class.name}`);
        console.log(`      گروه: ${subClass.class.group.code} - ${subClass.class.group.name}`);
      });
    });

    // Test the mapping logic
    console.log("\n🔍 تست منطق mapping:");
    Object.keys(subClassesByGroup).forEach(groupCode => {
      let targetGroupCode = groupCode;
      
      // Map asset groups (1 and 2) to the combined ASSETS group
      if (groupCode === '1' || groupCode === '2') {
        targetGroupCode = 'ASSETS';
      }
      // Map group 5 (سود و زیان انباشته) to group 4 (حقوق صاحبان سرمایه)
      else if (groupCode === '5') {
        targetGroupCode = '4';
      }
      
      console.log(`   گروه ${groupCode} → ${targetGroupCode} (${subClassesByGroup[groupCode].length} معین)`);
    });

  } catch (error) {
    console.error("❌ خطا در تست داده‌ها:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testFrontendData();
