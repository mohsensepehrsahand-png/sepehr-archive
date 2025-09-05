import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// PUT /api/users/[id] - تغییر وضعیت کاربر یا تغییر رمز عبور
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { isActive, newPassword } = body;

    // بررسی وجود کاربر
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    let updateData: any = {};

    // تغییر وضعیت فعال/غیرفعال
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }

    // تغییر رمز عبور
    if (newPassword && newPassword.trim()) {
      const passwordHash = await bcrypt.hash(newPassword.trim(), 10);
      updateData.passwordHash = passwordHash;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'هیچ تغییری برای اعمال وجود ندارد' },
        { status: 400 }
      );
    }

    // به‌روزرسانی کاربر
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        email: true,
        isActive: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: isActive !== undefined ? 
        `کاربر ${isActive ? 'فعال' : 'غیرفعال'} شد` : 
        'رمز عبور تغییر کرد'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی کاربر' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - حذف کاربر
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // بررسی وجود کاربر
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    // حذف کاربر
    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'کاربر با موفقیت حذف شد'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'خطا در حذف کاربر' },
      { status: 500 }
    );
  }
}

