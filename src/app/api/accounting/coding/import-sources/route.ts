import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/api/_lib/db';

// GET /api/accounting/coding/import-sources - دریافت لیست پروژه‌ها با سال‌های مالی برای ایمپورت کدینگ
export async function GET(request: NextRequest) {
  try {
    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;

    // Only admin users can access this
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز دسترسی به این بخش ندارید' },
        { status: 403 }
      );
    }

    // Get all projects with their fiscal years
    const projects = await prisma.project.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        fiscalYears: {
          orderBy: { year: 'desc' },
          include: {
            _count: {
              select: {
                accounts: true,
                accountGroups: true,
                accountClasses: true,
                accountSubClasses: true,
                accountDetails: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Filter projects that have at least one fiscal year
    const projectsWithFiscalYears = projects.filter(project => project.fiscalYears.length > 0);

    // Transform data for frontend
    const result = projectsWithFiscalYears.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      fiscalYears: project.fiscalYears.map(fy => {
        // Calculate total coding items (both old and new structure)
        const totalCodingItems = fy._count.accounts + 
                                fy._count.accountGroups + 
                                fy._count.accountClasses + 
                                fy._count.accountSubClasses + 
                                fy._count.accountDetails;
        
        return {
          id: fy.id,
          year: fy.year,
          startDate: fy.startDate,
          endDate: fy.endDate,
          description: fy.description,
          accountsCount: totalCodingItems,
          displayName: `${project.name} (سال مالی ${fy.year})`
        };
      })
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching import sources:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت منابع ایمپورت' },
      { status: 500 }
    );
  }
}
