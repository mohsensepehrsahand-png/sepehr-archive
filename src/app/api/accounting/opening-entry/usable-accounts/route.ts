import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";

// GET /api/accounting/opening-entry/usable-accounts - دریافت حساب‌های قابل استفاده برای سند افتتاحیه
export async function GET(request: NextRequest) {
  try {
    console.log('=== usable-accounts API called ===');
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const fiscalYearId = searchParams.get('fiscalYearId');
    
    console.log('Project ID:', projectId);
    console.log('Fiscal Year ID:', fiscalYearId);

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;

    // Only admin users can access accounting
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز دسترسی به بخش حسابداری ندارید' },
        { status: 403 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'شناسه پروژه الزامی است' },
        { status: 400 }
      );
    }

    // Get current fiscal year if not specified
    let targetFiscalYearId = fiscalYearId;
    if (!targetFiscalYearId) {
      // First try to find the most recent fiscal year for this project
      const fiscalYear = await prisma.fiscalYear.findFirst({
        where: {
          projectId,
          isActive: true
        },
        orderBy: {
          year: 'desc'
        }
      });
      targetFiscalYearId = fiscalYear?.id;
    }

    console.log('Target fiscal year ID:', targetFiscalYearId);

    // Build where clause for accounts - be more flexible with fiscal year
    const whereClause: any = {
      projectId,
      isActive: true
    };

    // Don't filter by fiscal year initially - get all accounts for the project
    // We'll filter by fiscal year later if needed

    // Get accounts from coding tables instead of Account table
    // First get sub-classes (level 3) and details (level 4) from coding tables
    const accountSubClasses = await prisma.accountSubClass.findMany({
      where: {
        projectId: projectId,
        fiscalYearId: targetFiscalYearId,
        isActive: true
      },
      include: {
        class: {
          include: {
            group: true
          }
        }
      },
      orderBy: [
        { code: 'asc' },
        { name: 'asc' }
      ]
    });

    const accountDetails = await prisma.accountDetail.findMany({
      where: {
        projectId: projectId,
        fiscalYearId: targetFiscalYearId,
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
      orderBy: [
        { code: 'asc' },
        { name: 'asc' }
      ]
    });

    console.log(`Found ${accountSubClasses.length} sub-classes and ${accountDetails.length} details for project ${projectId}`);

    // Convert coding tables to usable accounts format
    const accountsFromSubClasses = accountSubClasses.map(subClass => ({
      id: subClass.id,
      code: `${subClass.class.group.code}${subClass.class.code}${subClass.code}`,
      name: subClass.name,
      type: subClass.class.group.name,
      level: 3,
      fiscalYearId: subClass.fiscalYearId,
      fullName: `${subClass.class.group.name} - ${subClass.class.name} - ${subClass.name}`,
      hasTransactions: false,
      nature: subClass.class.group.code === '3' || subClass.class.group.code === '4' ? 'CREDIT' : 'DEBIT',
      groupId: subClass.class.group.id,
      groupName: subClass.class.group.name,
      groupCode: subClass.class.group.code,
      classId: subClass.class.id,
      classCode: subClass.class.code,
      className: subClass.class.name,
      subClassId: subClass.id,
      subClassCode: subClass.code,
      subClassName: subClass.name,
      detailId: null,
      detailCode: null,
      detailName: null
    }));

    const accountsFromDetails = accountDetails.map(detail => ({
      id: detail.id,
      code: `${detail.subClass.class.group.code}${detail.subClass.class.code}${detail.subClass.code}${detail.code}`,
      name: detail.name,
      type: detail.subClass.class.group.name,
      level: 4,
      fiscalYearId: detail.fiscalYearId,
      fullName: `${detail.subClass.class.group.name} - ${detail.subClass.class.name} - ${detail.subClass.name} - ${detail.name}`,
      hasTransactions: false,
      nature: detail.subClass.class.group.code === '3' || detail.subClass.class.group.code === '4' ? 'CREDIT' : 'DEBIT',
      groupId: detail.subClass.class.group.id,
      groupName: detail.subClass.class.group.name,
      groupCode: detail.subClass.class.group.code,
      classId: detail.subClass.class.id,
      classCode: detail.subClass.class.code,
      className: detail.subClass.class.name,
      subClassId: detail.subClass.id,
      subClassCode: detail.subClass.code,
      subClassName: detail.subClass.name,
      detailId: detail.id,
      detailCode: detail.code,
      detailName: detail.name
    }));

    const accounts = [...accountsFromSubClasses, ...accountsFromDetails];
    console.log(`Total usable accounts: ${accounts.length}`);

    // Use accounts from coding tables
    const accountsWithDetails = accounts;

    // Simplified approach - no need for complex hierarchy queries

    console.log(`Found ${accountsWithDetails.length} total accounts for project ${projectId}`);
    
    // Use accounts directly from coding tables (already in correct format)
    const usableAccounts = accountsWithDetails;

    // usableAccounts is already created above

    // Sort accounts by fiscal year preference
    const prioritizedAccounts = usableAccounts.sort((a, b) => {
      if (targetFiscalYearId) {
        // Prefer accounts linked to current fiscal year
        if (a.fiscalYearId === targetFiscalYearId && b.fiscalYearId !== targetFiscalYearId) return -1;
        if (b.fiscalYearId === targetFiscalYearId && a.fiscalYearId !== targetFiscalYearId) return 1;
      }
      // Then sort by code
      return a.code.localeCompare(b.code);
    });

    return NextResponse.json({
      accounts: prioritizedAccounts,
      fiscalYearId: targetFiscalYearId,
      totalCount: prioritizedAccounts.length,
      debug: {
        totalSubClasses: accountSubClasses.length,
        totalDetails: accountDetails.length,
        totalAccounts: accounts.length,
        usableAccounts: usableAccounts.length,
        hasFiscalYear: !!targetFiscalYearId
      }
    });
  } catch (error) {
    console.error('Error fetching usable accounts:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: 'خطا در دریافت حساب‌های قابل استفاده',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
