import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  level: number;
  fullName: string;
  hasTransactions: boolean;
  fiscalYearId?: string;
  groupId?: string;
  groupName?: string;
  groupCode?: string;
  classId?: string;
  classCode?: string;
  className?: string;
  subClassId?: string;
  subClassCode?: string;
  subClassName?: string;
}

interface AccountClass {
  id: string;
  code: string;
  name: string;
  groupCode: string;
  subClasses: AccountSubClass[];
  totalAmount: number;
  isExpanded: boolean;
}

interface AccountSubClass {
  id: string;
  code: string;
  name: string;
  classCode: string;
  details: AccountDetail[];
  totalAmount: number;
  isExpanded: boolean;
}

interface AccountDetail {
  id: string;
  code: string;
  name: string;
  subClassCode: string;
  totalAmount: number;
}

interface AccountGroup {
  id: string;
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'TEMPORARY' | 'REGULATORY';
  accounts: Account[];
  classes: AccountClass[];
  totalAmount: number;
  isIncludedInOpening: boolean;
  description: string;
}

async function testHierarchyFix() {
  try {
    console.log("🔍 تست اصلاح ساختار سلسله‌مراتبی...");

    // Get a sample project
    const project = await prisma.project.findFirst({
      select: { id: true, name: true }
    });

    if (!project) {
      console.log("❌ هیچ پروژه‌ای یافت نشد");
      return;
    }

    console.log(`📊 پروژه: ${project.name} (${project.id})`);

    // Get account classes (level 2)
    const accountClasses = await prisma.accountClass.findMany({
      where: { projectId: project.id, isActive: true },
      include: { group: true },
      orderBy: { code: 'asc' }
    });

    // Get account subclasses (level 3)
    const accountSubClasses = await prisma.accountSubClass.findMany({
      where: { projectId: project.id, isActive: true },
      include: { 
        class: { 
          include: { group: true } 
        } 
      },
      orderBy: { code: 'asc' }
    });

    // Get account details (level 4)
    const accountDetails = await prisma.accountDetail.findMany({
      where: { projectId: project.id, isActive: true },
      include: { 
        subClass: { 
          include: { 
            class: { 
              include: { group: true } 
            } 
          } 
        } 
      },
      orderBy: { code: 'asc' }
    });

    // Convert to usable accounts format (simulating API response)
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

    const accounts: Account[] = [
      ...usableAccountsFromClasses,
      ...usableAccountsFromSubClasses,
      ...usableAccountsFromDetails
    ];

    console.log(`\n📊 کل حساب‌ها: ${accounts.length}`);
    console.log(`   کل‌ها: ${usableAccountsFromClasses.length}`);
    console.log(`   معین‌ها: ${usableAccountsFromSubClasses.length}`);
    console.log(`   تفصیلی‌ها: ${usableAccountsFromDetails.length}`);

    // Show class IDs for debugging
    console.log("\n🔍 کل‌ها (Classes):");
    usableAccountsFromClasses.forEach(acc => {
      console.log(`   ${acc.code} - ${acc.name} (ID: ${acc.id})`);
    });

    console.log("\n🔍 معین‌ها (Sub-Classes) - showing classId they're looking for:");
    usableAccountsFromSubClasses.forEach(acc => {
      console.log(`   ${acc.code} - ${acc.name} (looking for classId: ${acc.classId})`);
    });

    // Test the createAccountGroups function
    const groups = createAccountGroups(accounts);

    console.log("\n🏗️  نتیجه ساختار سلسله‌مراتبی:");
    groups.forEach(group => {
      console.log(`\n📁 گروه ${group.name} (${group.code}):`);
      console.log(`   کل‌ها: ${group.classes.length}`);
      
      group.classes.forEach(accountClass => {
        console.log(`     کل: ${accountClass.code} - ${accountClass.name}`);
        console.log(`       معین‌ها: ${accountClass.subClasses.length}`);
        
        accountClass.subClasses.forEach(subClass => {
          console.log(`         معین: ${subClass.code} - ${subClass.name}`);
          console.log(`           تفصیلی‌ها: ${subClass.details.length}`);
          
          subClass.details.forEach(detail => {
            console.log(`             تفصیلی: ${detail.code} - ${detail.name}`);
          });
        });
      });
    });

  } catch (error) {
    console.error("❌ خطا در تست ساختار سلسله‌مراتبی:", error);
  } finally {
    await prisma.$disconnect();
  }
}

function createAccountGroups(accounts: Account[]): AccountGroup[] {
  try {
    const groupMap = new Map<string, AccountGroup>();
    
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
    
    // Create hierarchical structure from accounts
    const classMap = new Map<string, AccountClass>();
    const subClassMap = new Map<string, AccountSubClass>();
    const detailMap = new Map<string, AccountDetail>();
    
    // Process accounts to build hierarchy
    accounts.forEach(account => {
      try {
        const groupCode = account.groupCode || account.code?.charAt(0) || '1';
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
        if (!group) return;
        
        // Add to flat accounts list
        group.accounts.push(account);
        
        // Build hierarchical structure based on account level
        if (account.level === 2) {
          // This is a class (کل) - level 2
          const classKey = `${targetGroupCode}-${account.code}`;
          if (!classMap.has(classKey)) {
            const accountClass: AccountClass = {
              id: account.id,
              code: account.code,
              name: account.name,
              groupCode: targetGroupCode,
              subClasses: [],
              totalAmount: 0,
              isExpanded: false
            };
            classMap.set(classKey, accountClass);
            group.classes.push(accountClass);
          }
        } else if (account.level === 3) {
          // This is a sub-class (معین) - level 3
          // Use the classId and classCode from the API response
          const classId = account.classId;
          const classCode = account.classCode;
          
          if (classId && classCode) {
            // Find the parent class by classId
            let parentClass = null;
            for (const [classKey, classObj] of classMap.entries()) {
              if (classObj.id === classId) {
                parentClass = classObj;
                break;
              }
            }
            
            if (parentClass) {
              const subClassKey = `${parentClass.code}-${account.code}`;
              if (!subClassMap.has(subClassKey)) {
                const accountSubClass: AccountSubClass = {
                  id: account.id,
                  code: account.code,
                  name: account.name,
                  classCode: parentClass.code,
                  details: [],
                  totalAmount: 0,
                  isExpanded: false
                };
                subClassMap.set(subClassKey, accountSubClass);
                parentClass.subClasses.push(accountSubClass);
              }
            } else {
              console.warn('Parent class not found for sub-class:', account, 'classId:', classId);
            }
          } else {
            console.warn('Missing classId or classCode for sub-class:', account);
          }
        } else if (account.level === 4) {
          // This is a detail (تفصیلی) - level 4
          // Use the subClassId and subClassCode from the API response
          const subClassId = account.subClassId;
          const subClassCode = account.subClassCode;
          
          if (subClassId && subClassCode) {
            // Find the parent sub-class by subClassId
            let parentSubClass = null;
            for (const [subClassKey, subClassObj] of subClassMap.entries()) {
              if (subClassObj.id === subClassId) {
                parentSubClass = subClassObj;
                break;
              }
            }
            
            if (parentSubClass) {
              const accountDetail: AccountDetail = {
                id: account.id,
                code: account.code,
                name: account.name,
                subClassCode: subClassCode,
                totalAmount: 0
              };
              detailMap.set(account.id, accountDetail);
              parentSubClass.details.push(accountDetail);
            } else {
              console.warn('Parent sub-class not found for detail:', account, 'subClassId:', subClassId);
            }
          } else {
            console.warn('Missing subClassId or subClassCode for detail:', account);
          }
        }
      } catch (error) {
        console.error('Error processing account:', account, error);
      }
    });
    
    return Array.from(groupMap.values());
  } catch (error) {
    console.error('Error creating account groups:', error);
    return [];
  }
}

testHierarchyFix();
