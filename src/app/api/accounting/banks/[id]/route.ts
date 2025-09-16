import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLogger";

// GET /api/accounting/banks/[id] - دریافت اطلاعات حساب بانکی
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bankId = params.id;

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

    const bank = await prisma.bank.findUnique({
      where: { id: bankId },
      include: {
        project: {
          select: {
            name: true
          }
        },
        transactions: {
          orderBy: {
            date: 'desc'
          }
        }
      }
    });

    if (!bank) {
      return NextResponse.json(
        { error: 'حساب بانکی یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json(bank);
  } catch (error) {
    console.error('Error fetching bank:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات حساب بانکی' },
      { status: 500 }
    );
  }
}

// PUT /api/accounting/banks/[id] - ویرایش حساب بانکی
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bankId = params.id;
    const body = await request.json();
    const { name, branch, accountNumber, accountName, balance } = body;

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    // Only admin users can edit banks
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز ویرایش حساب بانکی ندارید' },
        { status: 403 }
      );
    }

    if (!name || !accountNumber || !accountName) {
      return NextResponse.json(
        { error: 'نام بانک، شماره حساب و نام صاحب حساب الزامی است' },
        { status: 400 }
      );
    }

    const bank = await prisma.bank.update({
      where: { id: bankId },
      data: {
        name,
        branch: branch || null,
        accountNumber,
        accountName,
        balance: parseFloat(balance.toString())
      },
      include: {
        project: {
          select: {
            name: true
          }
        },
        transactions: true
      }
    });

    // Log the update activity
    if (userId) {
      await logActivity({
        userId,
        action: 'UPDATE',
        resourceType: 'PROJECT',
        resourceId: bank.projectId,
        resourceName: bank.project.name,
        description: `حساب بانکی "${bank.name}" ویرایش شد`,
        metadata: {
          bankId: bank.id,
          accountNumber: bank.accountNumber
        }
      });
    }

    return NextResponse.json(bank);
  } catch (error) {
    console.error('Error updating bank:', error);
    return NextResponse.json(
      { error: 'خطا در ویرایش حساب بانکی' },
      { status: 500 }
    );
  }
}

// DELETE /api/accounting/banks/[id] - حذف حساب بانکی
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bankId = params.id;

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    // Only admin users can delete banks
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز حذف حساب بانکی ندارید' },
        { status: 403 }
      );
    }

    const bank = await prisma.bank.findUnique({
      where: { id: bankId },
      include: {
        project: {
          select: {
            name: true
          }
        }
      }
    });

    if (!bank) {
      return NextResponse.json(
        { error: 'حساب بانکی یافت نشد' },
        { status: 404 }
      );
    }

    await prisma.bank.delete({
      where: { id: bankId }
    });

    // Log the deletion activity
    if (userId) {
      await logActivity({
        userId,
        action: 'DELETE',
        resourceType: 'PROJECT',
        resourceId: bank.projectId,
        resourceName: bank.project.name,
        description: `حساب بانکی "${bank.name}" حذف شد`,
        metadata: {
          bankId: bank.id,
          accountNumber: bank.accountNumber
        }
      });
    }

    return NextResponse.json({ message: 'حساب بانکی با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting bank:', error);
    return NextResponse.json(
      { error: 'خطا در حذف حساب بانکی' },
      { status: 500 }
    );
  }
}
