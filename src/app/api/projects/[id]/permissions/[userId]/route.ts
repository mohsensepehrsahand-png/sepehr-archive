import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// DELETE /api/projects/[id]/permissions/[userId] - حذف دسترسی کاربر
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId } = await params;

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;

    // Only admin users can delete project permissions
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز حذف دسترسی‌های پروژه ندارید' },
        { status: 403 }
      );
    }

    // Delete permission
    await prisma.permission.delete({
      where: {
        userId_resourceType_resourceId: {
          userId,
          resourceType: 'PROJECT',
          resourceId: id
        }
      }
    });

    return NextResponse.json({ message: 'دسترسی با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting project permission:', error);
    return NextResponse.json(
      { error: 'خطا در حذف دسترسی' },
      { status: 500 }
    );
  }
}
