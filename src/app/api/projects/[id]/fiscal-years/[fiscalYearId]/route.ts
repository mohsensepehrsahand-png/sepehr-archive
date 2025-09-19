import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/api/_lib/db';

// GET /api/projects/[id]/fiscal-years/[fiscalYearId] - دریافت اطلاعات سال مالی
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fiscalYearId: string }> }
) {
  try {
    const { id: projectId, fiscalYearId } = await params;

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;

    // Only admin users can access fiscal year details
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

    // Fetch fiscal year details
    const fiscalYear = await prisma.fiscalYear.findFirst({
      where: { 
        id: fiscalYearId,
        projectId 
      },
      include: {
        accountGroups: true,
        accountClasses: true,
        accountSubClasses: true,
        accountDetails: true,
        accounts: true,
        transactions: true,
        invoices: true,
        bills: true,
        ledgers: true,
        banks: true,
        accountingDocuments: true,
        commonDescriptions: true
      }
    });

    if (!fiscalYear) {
      return NextResponse.json(
        { error: 'سال مالی یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json(fiscalYear);
  } catch (error) {
    console.error('Error fetching fiscal year:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت سال مالی' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id]/fiscal-years/[fiscalYearId] - ویرایش سال مالی
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fiscalYearId: string }> }
) {
  try {
    const { id: projectId, fiscalYearId } = await params;
    const body = await request.json();
    const { year, startDate, endDate, isActive, isClosed } = body;

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;

    // Only admin users can update fiscal years
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز ویرایش سال مالی ندارید' },
        { status: 403 }
      );
    }

    // Check if fiscal year exists
    const existingFiscalYear = await prisma.fiscalYear.findFirst({
      where: { 
        id: fiscalYearId,
        projectId 
      }
    });

    if (!existingFiscalYear) {
      return NextResponse.json(
        { error: 'سال مالی یافت نشد' },
        { status: 404 }
      );
    }

    // Update fiscal year
    const updatedFiscalYear = await prisma.fiscalYear.update({
      where: { id: fiscalYearId },
      data: {
        ...(year !== undefined && { year: parseInt(year) }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(isActive !== undefined && { isActive }),
        ...(isClosed !== undefined && { isClosed })
      }
    });

    return NextResponse.json(updatedFiscalYear);
  } catch (error) {
    console.error('Error updating fiscal year:', error);
    return NextResponse.json(
      { error: 'خطا در ویرایش سال مالی' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/fiscal-years/[fiscalYearId] - حذف سال مالی
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fiscalYearId: string }> }
) {
  try {
    const { id: projectId, fiscalYearId } = await params;

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
    const existingFiscalYear = await prisma.fiscalYear.findFirst({
      where: { 
        id: fiscalYearId,
        projectId 
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
      where: { id: fiscalYearId }
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
