import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { logActivity } from '@/lib/activityLogger';

// GET /api/documents/[id] - دریافت اطلاعات سند
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'شناسه سند الزامی است' },
        { status: 400 }
      );
    }

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: {
            firstName: true,
            lastName: true,
            username: true
          }
        },
        folder: {
          select: {
            name: true
          }
        }
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'سند یافت نشد' },
        { status: 404 }
      );
    }

    const documentWithDetails = {
      ...document,
      uploadedBy: document.createdByUser ? 
        `${document.createdByUser.firstName || ''} ${document.createdByUser.lastName || ''}`.trim() || 
        document.createdByUser.username : 
        'نامشخص',
      folderName: document.folder?.name || 'پوشه اصلی'
    };

    return NextResponse.json(documentWithDetails);
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت سند' },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[id] - حذف سند
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'شناسه سند الزامی است' },
        { status: 400 }
      );
    }

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    // Only admin users can delete documents
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز حذف سند ندارید' },
        { status: 403 }
      );
    }

    // Get document info before deletion
    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'سند یافت نشد' },
        { status: 404 }
      );
    }

    // Log the deletion activity before deleting
    if (userId) {
      await logActivity({
        userId,
        action: 'DELETE',
        resourceType: 'DOCUMENT',
        resourceId: id,
        resourceName: document.originalName,
        description: `سند "${document.originalName}" حذف شد`,
        metadata: {
          mimeType: document.mimeType,
          sizeBytes: document.sizeBytes,
          folderId: document.folderId
        }
      });
    }

    // Delete document from database
    await prisma.document.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'سند با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'خطا در حذف سند' },
      { status: 500 }
    );
  }
}


