import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import { DateObject } from 'react-multi-date-picker';
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

// Helper function to get Persian fiscal year start date (Farvardin 1) using the library
const getPersianFiscalYearStartDate = (persianYear: number) => {
  try {
    const startPersianDate = new DateObject({
      year: persianYear,
      month: 1, // Farvardin
      day: 1,
      calendar: persian,
      locale: persian_fa
    });
    return startPersianDate.toDate();
  } catch (error) {
    // Fallback to approximate calculation
    const gregorianStartYear = persianYear + 621;
    return new Date(gregorianStartYear, 2, 21);
  }
};

// Helper function to get Persian fiscal year end date (Esfand 29/30) using the library
const getPersianFiscalYearEndDate = (persianYear: number) => {
  try {
    // Try to get the last day of Esfand (29 or 30 depending on leap year)
    let endPersianDate;
    try {
      // First try with day 30
      endPersianDate = new DateObject({
        year: persianYear,
        month: 12, // Esfand
        day: 30,
        calendar: persian,
        locale: persian_fa
      });
    } catch (error) {
      // If day 30 doesn't exist, use day 29
      endPersianDate = new DateObject({
        year: persianYear,
        month: 12, // Esfand
        day: 29,
        calendar: persian,
        locale: persian_fa
      });
    }
    return endPersianDate.toDate();
  } catch (error) {
    // Fallback to approximate calculation
    const gregorianStartYear = persianYear + 621;
    return new Date(gregorianStartYear + 1, 2, 20);
  }
};

// GET /api/accounting/fiscal-years - دریافت لیست سال‌های مالی
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const current = searchParams.get('current') === 'true';

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

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

    const where: any = { projectId };
    
    if (current) {
      // Get current Persian year using the library
      try {
        const now = new Date();
        const persianDate = new DateObject({ date: now, calendar: persian, locale: persian_fa });
        where.year = persianDate.year;
        where.isActive = true;
      } catch (error) {
        // Fallback to approximate calculation
        const now = new Date();
        const currentPersianYear = now.getFullYear() - 621;
        where.year = currentPersianYear;
        where.isActive = true;
      }
    }

    const fiscalYears = await prisma.fiscalYear.findMany({
      where,
      include: {
        project: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            accounts: true,
            accountGroups: true,
            accountingDocuments: true
          }
        }
      },
      orderBy: {
        year: 'desc'
      }
    });

    return NextResponse.json(fiscalYears);
  } catch (error) {
    console.error('Error fetching fiscal years:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت سال‌های مالی' },
      { status: 500 }
    );
  }
}

// POST /api/accounting/fiscal-years - ایجاد سال مالی جدید
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, year, startDate, endDate, description } = body;

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    // Only admin users can create fiscal years
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز ایجاد سال مالی ندارید' },
        { status: 403 }
      );
    }

    if (!projectId || !year) {
      return NextResponse.json(
        { error: 'شناسه پروژه و سال الزامی است' },
        { status: 400 }
      );
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'پروژه یافت نشد' },
        { status: 404 }
      );
    }

    // Check if fiscal year already exists
    const existingFiscalYear = await prisma.fiscalYear.findFirst({
      where: {
        projectId,
        year: parseInt(year)
      }
    });

    if (existingFiscalYear) {
      return NextResponse.json(
        { error: `سال مالی ${year} قبلاً برای این پروژه ایجاد شده است` },
        { status: 400 }
      );
    }

    // Set default dates if not provided - use Persian calendar dates
    const defaultStartDate = startDate ? new Date(startDate) : getPersianFiscalYearStartDate(parseInt(year));
    const defaultEndDate = endDate ? new Date(endDate) : getPersianFiscalYearEndDate(parseInt(year));

    const fiscalYear = await prisma.fiscalYear.create({
      data: {
        projectId,
        year: parseInt(year),
        startDate: defaultStartDate,
        endDate: defaultEndDate,
        description: description || `سال مالی ${year}`,
        isActive: true,
        isClosed: false
      },
      include: {
        project: {
          select: {
            name: true
          }
        }
      }
    });

    // Link existing accounts without fiscal year to this new fiscal year
    await prisma.account.updateMany({
      where: {
        projectId,
        fiscalYearId: null
      },
      data: {
        fiscalYearId: fiscalYear.id
      }
    });

    // Link existing account groups without fiscal year to this new fiscal year
    await prisma.accountGroup.updateMany({
      where: {
        projectId,
        fiscalYearId: null
      },
      data: {
        fiscalYearId: fiscalYear.id
      }
    });

    // Link existing account classes without fiscal year to this new fiscal year
    await prisma.accountClass.updateMany({
      where: {
        projectId,
        fiscalYearId: null
      },
      data: {
        fiscalYearId: fiscalYear.id
      }
    });

    // Link existing account sub-classes without fiscal year to this new fiscal year
    await prisma.accountSubClass.updateMany({
      where: {
        projectId,
        fiscalYearId: null
      },
      data: {
        fiscalYearId: fiscalYear.id
      }
    });

    // Link existing account details without fiscal year to this new fiscal year
    await prisma.accountDetail.updateMany({
      where: {
        projectId,
        fiscalYearId: null
      },
      data: {
        fiscalYearId: fiscalYear.id
      }
    });

    return NextResponse.json(fiscalYear, { status: 201 });
  } catch (error) {
    console.error('Error creating fiscal year:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد سال مالی' },
      { status: 500 }
    );
  }
}
