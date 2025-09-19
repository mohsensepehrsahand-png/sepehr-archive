import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/api/_lib/db';

// GET /api/custom-roles/[id] - دریافت اطلاعات نقش سفارشی
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const customRole = await prisma.customRole.findUnique({
      where: { id }
    });

    if (!customRole) {
      return NextResponse.json(
        { error: 'نقش سفارشی یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json(customRole);
  } catch (error) {
    console.error('Error fetching custom role:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت نقش سفارشی' },
      { status: 500 }
    );
  }
}

// PUT /api/custom-roles/[id] - ویرایش نقش سفارشی
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { label, description, color, isActive } = body;

    // بررسی وجود نقش
    const existingRole = await prisma.customRole.findUnique({
      where: { id }
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: 'نقش سفارشی یافت نشد' },
        { status: 404 }
      );
    }

    // به‌روزرسانی نقش
    const updatedRole = await prisma.customRole.update({
      where: { id },
      data: {
        label,
        description,
        color,
        isActive
      }
    });

    return NextResponse.json(updatedRole);
  } catch (error) {
    console.error('Error updating custom role:', error);
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی نقش سفارشی' },
      { status: 500 }
    );
  }
}

// DELETE /api/custom-roles/[id] - حذف نقش سفارشی
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // بررسی وجود نقش
    const existingRole = await prisma.customRole.findUnique({
      where: { id },
      include: {
        users: true
      }
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: 'نقش سفارشی یافت نشد' },
        { status: 404 }
      );
    }

    // بررسی اینکه آیا کاربرانی با این نقش وجود دارند
    if (existingRole.users.length > 0) {
      return NextResponse.json(
        { error: 'نمی‌توان نقش‌هایی که کاربر دارند را حذف کرد' },
        { status: 400 }
      );
    }

    // حذف نقش
    await prisma.customRole.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting custom role:', error);
    return NextResponse.json(
      { error: 'خطا در حذف نقش سفارشی' },
      { status: 500 }
    );
  }
}
