import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/api/_lib/db';
import { logActivity } from '@/lib/activityLogger';

// PUT /api/folders/[id] - ویرایش پوشه
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'شناسه پوشه الزامی است' },
        { status: 400 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'نام پوشه الزامی است' },
        { status: 400 }
      );
    }

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    // Only admin users can update folders
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز ویرایش پوشه ندارید' },
        { status: 403 }
      );
    }

    // Check if folder exists
    const existingFolder = await prisma.folder.findUnique({
      where: { id }
    });

    if (!existingFolder) {
      return NextResponse.json(
        { error: 'پوشه یافت نشد' },
        { status: 404 }
      );
    }

    // Check if another folder with the same name exists in the same parent
    const duplicateFolder = await prisma.folder.findFirst({
      where: {
        id: { not: id },
        parentId: existingFolder.parentId,
        name: name.trim()
      }
    });

    if (duplicateFolder) {
      return NextResponse.json(
        { error: 'پوشه‌ای با این نام در همین مسیر وجود دارد' },
        { status: 400 }
      );
    }

    // Update folder
    const updatedFolder = await prisma.folder.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || ''
      }
    });

    // Log the update activity
    if (userId) {
      await logActivity({
        userId,
        action: 'UPDATE',
        resourceType: 'FOLDER',
        resourceId: id,
        resourceName: updatedFolder.name,
        description: `پوشه "${existingFolder.name}" به "${updatedFolder.name}" ویرایش شد`,
        metadata: {
          oldName: existingFolder.name,
          newName: updatedFolder.name,
          projectId: updatedFolder.projectId
        }
      });
    }

    return NextResponse.json(updatedFolder);
  } catch (error) {
    console.error('Error updating folder:', error);
    return NextResponse.json(
      { error: 'خطا در ویرایش پوشه' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'شناسه پوشه الزامی است' },
        { status: 400 }
      );
    }

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    // Only admin users can delete folders
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز حذف پوشه ندارید' },
        { status: 403 }
      );
    }

    // Get folder info before deletion
    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        documents: true
      }
    });

    if (!folder) {
      return NextResponse.json(
        { error: 'پوشه یافت نشد' },
        { status: 404 }
      );
    }

    // Check if folder has children
    const children = await prisma.folder.findMany({
      where: { parentId: id }
    });

    if (children.length > 0) {
      return NextResponse.json(
        { error: 'نمی‌توان پوشه‌ای که دارای زیرپوشه است را حذف کرد' },
        { status: 400 }
      );
    }

    // Log the deletion activity before deleting
    if (userId) {
      await logActivity({
        userId,
        action: 'DELETE',
        resourceType: 'FOLDER',
        resourceId: id,
        resourceName: folder.name,
        description: `پوشه "${folder.name}" حذف شد`,
        metadata: {
          documentsCount: folder.documents.length,
          parentId: folder.parentId,
          projectId: folder.projectId
        }
      });
    }

    // Delete all documents in the folder first
    await prisma.document.deleteMany({
      where: { folderId: id }
    });

    // Delete folder from database
    await prisma.folder.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'پوشه با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json(
      { error: 'خطا در حذف پوشه' },
      { status: 500 }
    );
  }
}
