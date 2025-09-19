import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/api/_lib/db';

// GET /api/projects/[id]/fiscal-years - دریافت لیست سال‌های مالی پروژه
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;

    // Only admin users can access fiscal years
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز دسترسی به سال‌های مالی ندارید' },
        { status: 403 }
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

    // Fetch fiscal years for the project
    const fiscalYears = await prisma.fiscalYear.findMany({
      where: { projectId },
      orderBy: { year: 'desc' }
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

// POST /api/projects/[id]/fiscal-years - ایجاد سال مالی جدید
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { year, startDate, endDate, description } = body;

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;

    // Only admin users can create fiscal years
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز ایجاد سال مالی ندارید' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!year || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'سال، تاریخ شروع و تاریخ پایان الزامی است' },
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

    // Check if fiscal year already exists for this project
    const existingFiscalYear = await prisma.fiscalYear.findUnique({
      where: {
        projectId_year: {
          projectId,
          year: parseInt(year)
        }
      }
    });

    if (existingFiscalYear) {
      return NextResponse.json(
        { error: 'سال مالی مورد نظر قبلاً تعریف شده است' },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return NextResponse.json(
        { error: 'تاریخ شروع باید قبل از تاریخ پایان باشد' },
        { status: 400 }
      );
    }

    // Create fiscal year
    const fiscalYear = await prisma.fiscalYear.create({
      data: {
        projectId,
        year: parseInt(year),
        startDate: start,
        endDate: end,
        description: description || null
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

// PUT /api/projects/[id]/fiscal-years - ویرایش سال مالی
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { originalYear, year, startDate, endDate, description, isActive, isClosed } = body;

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;

    // Only admin users can update fiscal years
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز ویرایش سال مالی ندارید' },
        { status: 403 }
      );
    }

    if (!originalYear) {
      return NextResponse.json(
        { error: 'سال مالی اصلی الزامی است' },
        { status: 400 }
      );
    }

    // Check if fiscal year exists (using original year for lookup)
    const existingFiscalYear = await prisma.fiscalYear.findUnique({
      where: {
        projectId_year: {
          projectId,
          year: parseInt(originalYear.toString())
        }
      }
    });

    if (!existingFiscalYear) {
      return NextResponse.json(
        { error: 'سال مالی یافت نشد' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      ...(startDate !== undefined && { startDate: new Date(startDate) }),
      ...(endDate !== undefined && { endDate: new Date(endDate) }),
      ...(description !== undefined && { description }),
      ...(isActive !== undefined && { isActive }),
      ...(isClosed !== undefined && { isClosed })
    };

    // If year is being changed, we need to handle it specially
    if (year && parseInt(year) !== parseInt(originalYear.toString())) {
      // Check if new year already exists
      const newYearExists = await prisma.fiscalYear.findUnique({
        where: {
          projectId_year: {
            projectId,
            year: parseInt(year)
          }
        }
      });

      if (newYearExists) {
        return NextResponse.json(
          { error: 'سال مالی جدید قبلاً وجود دارد' },
          { status: 400 }
        );
      }

      // Delete old record and create new one
      await prisma.fiscalYear.delete({
        where: {
          projectId_year: {
            projectId,
            year: parseInt(originalYear.toString())
          }
        }
      });

      const updatedFiscalYear = await prisma.fiscalYear.create({
        data: {
          projectId,
          year: parseInt(year),
          startDate: startDate ? new Date(startDate) : existingFiscalYear.startDate,
          endDate: endDate ? new Date(endDate) : existingFiscalYear.endDate,
          description: description !== undefined ? description : existingFiscalYear.description,
          isActive: isActive !== undefined ? isActive : existingFiscalYear.isActive,
          isClosed: isClosed !== undefined ? isClosed : existingFiscalYear.isClosed
        }
      });

      return NextResponse.json(updatedFiscalYear);
    } else {
      // Update existing record
      const updatedFiscalYear = await prisma.fiscalYear.update({
        where: { 
          projectId_year: {
            projectId,
            year: parseInt(originalYear.toString())
          }
        },
        data: updateData
      });

      return NextResponse.json(updatedFiscalYear);
    }
  } catch (error) {
    console.error('Error updating fiscal year:', error);
    return NextResponse.json(
      { error: 'خطا در ویرایش سال مالی' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/fiscal-years - حذف سال مالی
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const url = new URL(request.url);
    const year = url.searchParams.get('year');

    if (!year) {
      return NextResponse.json(
        { error: 'سال مالی الزامی است' },
        { status: 400 }
      );
    }

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;

    // Only admin users can delete fiscal years
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز حذف سال مالی ندارید' },
        { status: 403 }
      );
    }

    // Check if fiscal year exists
    const existingFiscalYear = await prisma.fiscalYear.findUnique({
      where: {
        projectId_year: {
          projectId,
          year: parseInt(year)
        }
      }
    });

    if (!existingFiscalYear) {
      return NextResponse.json(
        { error: 'سال مالی یافت نشد' },
        { status: 404 }
      );
    }

    // Delete fiscal year (this will cascade delete all related accounting data)
    await prisma.fiscalYear.delete({
      where: {
        projectId_year: {
          projectId,
          year: parseInt(year)
        }
      }
    });

    return NextResponse.json({ message: 'سال مالی با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting fiscal year:', error);
    return NextResponse.json(
      { error: 'خطا در حذف سال مالی' },
      { status: 500 }
    );
  }
}