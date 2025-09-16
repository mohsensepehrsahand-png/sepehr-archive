import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import { logActivity } from "@/lib/activityLogger";

// GET /api/accounting/accounts/[id] - دریافت اطلاعات حساب
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountId } = await params;

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

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        project: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            transactions: true,
            invoices: true,
            bills: true
          }
        }
      }
    });

    if (!account) {
      return NextResponse.json(
        { error: 'حساب یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات حساب' },
      { status: 500 }
    );
  }
}

// PUT /api/accounting/accounts/[id] - ویرایش حساب
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountId } = await params;
    const body = await request.json();
    const { name, code, type, level, parentId, contact, description, isActive } = body;

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    // Only admin users can edit accounts
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز ویرایش حساب ندارید' },
        { status: 403 }
      );
    }

    if (!name || !type || !code) {
      return NextResponse.json(
        { error: 'نام، کد و نوع حساب الزامی است' },
        { status: 400 }
      );
    }

    const account = await prisma.account.update({
      where: { id: accountId },
      data: {
        name,
        code,
        type,
        level: level || 1,
        parentId: parentId || null,
        contact: contact || null,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true
      },
      include: {
        project: {
          select: {
            name: true
          }
        }
      }
    });

    // Log the update activity
    if (userId) {
      await logActivity({
        userId,
        action: 'UPDATE',
        resourceType: 'PROJECT',
        resourceId: account.projectId,
        resourceName: account.project.name,
        description: `حساب "${account.name}" ویرایش شد`,
        metadata: {
          accountId: account.id,
          accountType: account.type
        }
      });
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json(
      { error: 'خطا در ویرایش حساب' },
      { status: 500 }
    );
  }
}

// DELETE /api/accounting/accounts/[id] - حذف حساب
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountId } = await params;

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    // Only admin users can delete accounts
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز حذف حساب ندارید' },
        { status: 403 }
      );
    }

    // Check if account has transactions
    const transactionCount = await prisma.transaction.count({
      where: { accountId }
    });

    if (transactionCount > 0) {
      return NextResponse.json(
        { error: 'نمی‌توان حسابی که تراکنش دارد را حذف کرد' },
        { status: 400 }
      );
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        project: {
          select: {
            name: true
          }
        }
      }
    });

    if (!account) {
      return NextResponse.json(
        { error: 'حساب یافت نشد' },
        { status: 404 }
      );
    }

    await prisma.account.delete({
      where: { id: accountId }
    });

    // Log the deletion activity
    if (userId) {
      await logActivity({
        userId,
        action: 'DELETE',
        resourceType: 'PROJECT',
        resourceId: account.projectId,
        resourceName: account.project.name,
        description: `حساب "${account.name}" حذف شد`,
        metadata: {
          accountId: account.id,
          accountType: account.type
        }
      });
    }

    return NextResponse.json({ message: 'حساب با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'خطا در حذف حساب' },
      { status: 500 }
    );
  }
}
