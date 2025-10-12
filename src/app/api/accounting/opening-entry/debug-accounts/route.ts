import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";

// GET /api/accounting/opening-entry/debug-accounts - تست دریافت حساب‌ها
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'شناسه پروژه الزامی است' },
        { status: 400 }
      );
    }

    // Get all accounts for this project without any filtering
    const allAccounts = await prisma.account.findMany({
      where: {
        projectId,
        isActive: true
      },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        level: true,
        fiscalYearId: true,
        detailId: true
      },
      orderBy: {
        code: 'asc'
      }
    });

    // Get account details (level 4 - تفصیلی)
    const allAccountDetails = await prisma.accountDetail.findMany({
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

    // Get account subclasses (level 3 - معین)
    const allAccountSubClasses = await prisma.accountSubClass.findMany({
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

    // Get fiscal years for this project
    const fiscalYears = await prisma.fiscalYear.findMany({
      where: {
        projectId
      },
      select: {
        id: true,
        year: true,
        isActive: true
      },
      orderBy: {
        year: 'desc'
      }
    });

    // Get account details
    const accountDetails = await prisma.accountDetail.findMany({
      where: {
        projectId
      },
      select: {
        id: true,
        code: true,
        name: true,
        subClassId: true
      }
    });

    // Get account subclasses
    const accountSubClasses = await prisma.accountSubClass.findMany({
      where: {
        projectId
      },
      select: {
        id: true,
        code: true,
        name: true,
        classId: true
      }
    });

    // Get account classes
    const accountClasses = await prisma.accountClass.findMany({
      where: {
        projectId
      },
      select: {
        id: true,
        code: true,
        name: true,
        groupId: true
      }
    });

    // Get account groups
    const accountGroups = await prisma.accountGroup.findMany({
      where: {
        projectId
      },
      select: {
        id: true,
        code: true,
        name: true
      }
    });

    // Filter accounts by level
    const accountsByLevel = {
      level1: allAccounts.filter(a => a.level === 1),
      level2: allAccounts.filter(a => a.level === 2),
      level3: allAccounts.filter(a => a.level === 3),
      level4: allAccounts.filter(a => a.level === 4),
      level5AndAbove: allAccounts.filter(a => a.level >= 5)
    };

    // Accounts with detail (level 4)
    const accountsWithDetail = allAccounts.filter(a => a.detailId);

    // Usable accounts (level 3 and 4) - combine Account table + AccountSubClass + AccountDetail
    const usableAccountsFromAccountTable = allAccounts.filter(a => a.level >= 3);
    
    // Convert AccountSubClass to usable accounts (level 3)
    const usableAccountsFromSubClasses = allAccountSubClasses.map(subClass => ({
      id: subClass.id,
      code: subClass.code,
      name: subClass.name,
      type: subClass.class.group.name, // Use group name as type
      level: 3,
      fiscalYearId: subClass.fiscalYearId,
      detailId: null,
      fullName: `${subClass.class.group.name} - ${subClass.class.name} - ${subClass.name}`,
      hierarchy: {
        group: subClass.class.group.name,
        class: subClass.class.name,
        subClass: subClass.name
      }
    }));

    // Convert AccountDetail to usable accounts (level 4)
    const usableAccountsFromDetails = allAccountDetails.map(detail => ({
      id: detail.id,
      code: detail.code,
      name: detail.name,
      type: detail.subClass.class.group.name, // Use group name as type
      level: 4,
      fiscalYearId: detail.fiscalYearId,
      detailId: detail.id,
      fullName: `${detail.subClass.class.group.name} - ${detail.subClass.class.name} - ${detail.subClass.name} - ${detail.name}`,
      hierarchy: {
        group: detail.subClass.class.group.name,
        class: detail.subClass.class.name,
        subClass: detail.subClass.name,
        detail: detail.name
      }
    }));

    // Combine all usable accounts
    const usableAccounts = [
      ...usableAccountsFromAccountTable,
      ...usableAccountsFromSubClasses,
      ...usableAccountsFromDetails
    ];

    return NextResponse.json({
      projectId,
      summary: {
        totalAccounts: allAccounts.length,
        totalAccountDetails: allAccountDetails.length,
        totalAccountSubClasses: allAccountSubClasses.length,
        usableAccounts: usableAccounts.length,
        accountsWithDetail: accountsWithDetail.length,
        fiscalYears: fiscalYears.length,
        usableFromSubClasses: usableAccountsFromSubClasses.length,
        usableFromDetails: usableAccountsFromDetails.length
      },
      fiscalYears,
      accountsByLevel,
      accountsWithDetail,
      usableAccounts,
      allAccounts,
      allAccountDetails,
      allAccountSubClasses,
      accountDetails,
      accountSubClasses,
      accountClasses,
      accountGroups,
      usableAccountsFromSubClasses,
      usableAccountsFromDetails
    });
  } catch (error) {
    console.error('Error in debug accounts:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات debug', details: error.message },
      { status: 500 }
    );
  }
}
