import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../_lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const folderId = params.id;
    
    // Check if folder exists
    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    });

    if (!folder) {
      return NextResponse.json({ error: 'پوشه یافت نشد' }, { status: 404 });
    }

    // Get folder permissions
    const permissions = await prisma.folderPermissions.findMany({
      where: { folderId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    return NextResponse.json(permissions);
  } catch (error) {
    console.error('Error fetching folder permissions:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت دسترسی‌های پوشه' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const folderId = params.id;
    const { userId, canView, canEdit, canDelete } = await request.json();

    // Check if folder exists
    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    });

    if (!folder) {
      return NextResponse.json({ error: 'پوشه یافت نشد' }, { status: 404 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    // Create or update folder permission
    const permission = await prisma.folderPermissions.upsert({
      where: {
        folderId_userId: {
          folderId,
          userId
        }
      },
      update: {
        canView,
        canEdit,
        canDelete
      },
      create: {
        folderId,
        userId,
        canView,
        canEdit,
        canDelete
      }
    });

    return NextResponse.json(permission);
  } catch (error) {
    console.error('Error updating folder permission:', error);
    return NextResponse.json(
      { error: 'خطا در بروزرسانی دسترسی پوشه' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const folderId = params.id;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'شناسه کاربر الزامی است' }, { status: 400 });
    }

    // Delete folder permission
    await prisma.folderPermissions.delete({
      where: {
        folderId_userId: {
          folderId,
          userId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting folder permission:', error);
    return NextResponse.json(
      { error: 'خطا در حذف دسترسی پوشه' },
      { status: 500 }
    );
  }
}
