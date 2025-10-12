import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function debugCreateAccountGroups() {
  try {
    console.log("🔍 تست منطق createAccountGroups...");

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

    // Simulate the createAccountGroups logic
    const groupMap = new Map();
    
    // Define only 3 groups according to accounting equation
    const groupDefinitions = [
      { code: 'ASSETS', name: 'دارایی‌ها', type: 'ASSET' as const, isIncludedInOpening: true, description: 'تمام دارایی‌های شرکت (جاری و غیرجاری)' },
      { code: '3', name: 'بدهی‌ها', type: 'LIABILITY' as const, isIncludedInOpening: true, description: 'تعهدات شرکت به اشخاص ثالث' },
      { code: '4', name: 'حقوق صاحبان سرمایه', type: 'EQUITY' as const, isIncludedInOpening: true, description: 'حقوق مالکانه صاحبان شرکت (شامل سود و زیان انباشته)' }
    ];
    
    // Initialize groups
    groupDefinitions.forEach(groupDef => {
      groupMap.set(groupDef.code, {
        id: groupDef.code,
        code: groupDef.code,
        name: groupDef.name,
        type: groupDef.type,
        accounts: [],
        classes: [],
        totalAmount: 0,
        isIncludedInOpening: groupDef.isIncludedInOpening,
        description: groupDef.description
      });
    });

    console.log("📁 گروه‌های تعریف شده:");
    groupMap.forEach((group, code) => {
      console.log(`   ${code}: ${group.name} (${group.type})`);
    });

    // Create hierarchical structure from accounts
    const classMap = new Map();
    const subClassMap = new Map();
    const detailMap = new Map();
    
    // First pass: Create classes from sub-classes (level 3) - group them by their parent class
    const classGroups = new Map();
    
    accountSubClasses.forEach(account => {
      if (account.classId && account.class.code && account.class.name) {
        const classKey = `${account.classId}`;
        if (!classGroups.has(classKey)) {
          classGroups.set(classKey, {
            classId: account.classId,
            classCode: account.class.code,
            className: account.class.name,
            groupCode: account.class.group.code
          });
        }
      }
    });

    console.log(`\n📂 کل‌های یافت شده: ${classGroups.size}`);
    classGroups.forEach((classData, classKey) => {
      console.log(`   ${classKey}: ${classData.classCode} - ${classData.className} (گروه: ${classData.groupCode})`);
    });

    // Create classes from the grouped data
    classGroups.forEach((classData, classKey) => {
      const groupCode = classData.groupCode;
      let targetGroupCode = groupCode;
      
      // Map asset groups (1 and 2) to the combined ASSETS group
      if (groupCode === '1' || groupCode === '2') {
        targetGroupCode = 'ASSETS';
      }
      // Map group 5 (سود و زیان انباشته) to group 4 (حقوق صاحبان سرمایه)
      else if (groupCode === '5') {
        targetGroupCode = '4';
      }
      
      const group = groupMap.get(targetGroupCode);
      if (!group) {
        console.log(`⚠️  گروه ${targetGroupCode} یافت نشد برای کل ${classData.classCode}`);
        return;
      }
      
      console.log(`✅ کل ${classData.classCode} به گروه ${targetGroupCode} اضافه شد`);
      
      // Create class
      const classMapKey = `${targetGroupCode}-${classData.classCode}`;
      if (!classMap.has(classMapKey)) {
        const accountClass = {
          id: classData.classId,
          code: classData.classCode,
          name: classData.className,
          groupCode: targetGroupCode,
          subClasses: [],
          totalAmount: 0,
          isExpanded: false
        };
        classMap.set(classMapKey, accountClass);
        group.classes.push(accountClass);
        console.log(`   📝 کل ${classData.classCode} - ${classData.className} ایجاد شد`);
      }
    });

    // Second pass: Create sub-classes (level 3) and associate with their parent classes
    accountSubClasses.forEach(account => {
      if (account.classId && account.class.code && account.class.name) {
        const groupCode = account.class.group.code;
        let targetGroupCode = groupCode;
        
        if (groupCode === '1' || groupCode === '2') {
          targetGroupCode = 'ASSETS';
        } else if (groupCode === '5') {
          targetGroupCode = '4';
        }
        
        const group = groupMap.get(targetGroupCode);
        if (!group) return;
        
        const classMapKey = `${targetGroupCode}-${account.class.code}`;
        const accountClass = classMap.get(classMapKey);
        
        if (accountClass) {
          const subClass = {
            id: account.id,
            code: account.code,
            name: account.name,
            classId: account.classId,
            classCode: account.class.code,
            className: account.class.name,
            details: [],
            totalAmount: 0,
            isExpanded: false
          };
          
          subClassMap.set(account.id, subClass);
          accountClass.subClasses.push(subClass);
          console.log(`   📋 معین ${account.code} - ${account.name} به کل ${account.class.code} اضافه شد`);
        } else {
          console.log(`⚠️  کل ${account.class.code} یافت نشد برای معین ${account.code}`);
        }
      }
    });

    // Final result
    console.log("\n📊 نتیجه نهایی:");
    groupMap.forEach((group, code) => {
      console.log(`\n🏷️  گروه ${code} - ${group.name}:`);
      console.log(`   کل‌ها: ${group.classes.length}`);
      group.classes.forEach(accountClass => {
        console.log(`     📂 ${accountClass.code} - ${accountClass.name} (${accountClass.subClasses.length} معین)`);
        accountClass.subClasses.forEach(subClass => {
          console.log(`       📋 ${subClass.code} - ${subClass.name}`);
        });
      });
    });

  } catch (error) {
    console.error("❌ خطا در تست createAccountGroups:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCreateAccountGroups();
